import { create } from "zustand";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type {
  GiftSuggestion,
  InitialChips,
  NextQuestionResponse,
  QuizSession,
} from "@/lib/types";
import { useAuthStore } from "./authStore";

async function extractFnError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error ?? body?.message ?? error.message;
    } catch {
      return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

const BUDGET_MAP: Record<string, string> = {
  b1: "0–500 TL",
  b2: "500–1000 TL",
  b3: "1000–3000 TL",
  b4: "3000–10000 TL",
  b5: "10000+ TL",
};

export type QuizPhase = "chips" | "quiz" | "loading" | "generating" | "results";

interface QuizState {
  session: QuizSession | null;
  chips: InitialChips;
  currentQuestion: NextQuestionResponse | null;
  newQuestionPending: NextQuestionResponse | null;
  previousConfidence: number;
  gifts: GiftSuggestion[];
  phase: QuizPhase;
  error: string | null;
  loadingMore: boolean;
  paywallBlocked: boolean;
  setChips: (chips: InitialChips) => void;
  startSession: (userId: string, language: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  commitQuestion: () => void;
  loadMoreGifts: () => Promise<void>;
  reset: () => void;
  dismissPaywall: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  chips: { recipients: [], budget: "" },
  currentQuestion: null,
  newQuestionPending: null,
  previousConfidence: 0,
  gifts: [],
  phase: "chips",
  error: null,
  loadingMore: false,
  paywallBlocked: false,

  setChips: (chips) => set({ chips }),

  dismissPaywall: () => set({ paywallBlocked: false }),

  startSession: async (userId, language) => {
    const { profile } = useAuthStore.getState();

    // Free-plan check (web parity): if not active subscriber, allow only 1 completed quiz
    if (profile?.subscription_status !== "active") {
      const { count } = await supabase
        .from("quiz_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

      if ((count ?? 0) >= 1) {
        set({ paywallBlocked: true });
        return;
      }
    }

    set({
      phase: "loading",
      error: null,
      previousConfidence: 0,
      newQuestionPending: null,
      currentQuestion: null,
      gifts: [],
    });

    try {
      const { chips } = get();
      const budgetLabel = BUDGET_MAP[chips.budget] || chips.budget;

      const { data, error } = await supabase.functions.invoke("next-question", {
        body: {
          session_id: null,
          user_answer: null,
          chips: {
            recipients: chips.recipients,
            budget: budgetLabel,
            ...(chips.recipientGender ? { recipientGender: chips.recipientGender } : {}),
          },
          language,
        },
      });

      if (error) throw new Error(await extractFnError(error));
      if (!data) throw new Error("Empty response");
      if (data.error) throw new Error(data.error);

      if (data.session_id) {
        set({ session: { id: data.session_id } });
      }

      // Commit immediately (no animated loading screen in mobile MVP)
      set({
        currentQuestion: data,
        newQuestionPending: null,
        phase: "quiz",
      });
    } catch (err: any) {
      set({ error: err.message || "Unknown error", phase: "chips" });
    }
  },

  submitAnswer: async (answer) => {
    const { session, currentQuestion } = get();
    if (!session) return;

    set({
      phase: "loading",
      error: null,
      previousConfidence: currentQuestion?.confidence_score ?? 0,
      newQuestionPending: null,
    });

    try {
      const { data, error } = await supabase.functions.invoke("next-question", {
        body: { session_id: session.id, user_answer: answer },
      });

      if (error) throw new Error(await extractFnError(error));
      if (!data) throw new Error("Empty response");
      if (data.error) throw new Error(data.error);

      if (data.completed) {
        set({ phase: "generating", currentQuestion: null });

        const { data: giftsData, error: giftErr } = await supabase.functions.invoke(
          "generate-gifts",
          { body: { session_id: session.id } }
        );

        if (giftErr) throw new Error(await extractFnError(giftErr));
        if (giftsData?.error) throw new Error(giftsData.error);

        set({
          gifts: giftsData?.gifts || [],
          phase: "results",
        });
      } else {
        set({
          currentQuestion: data,
          phase: "quiz",
        });
      }
    } catch (err: any) {
      set({ error: err.message || "Unknown error", phase: "quiz" });
    }
  },

  commitQuestion: () => {
    const { newQuestionPending } = get();
    if (!newQuestionPending) return;
    set({
      currentQuestion: newQuestionPending,
      newQuestionPending: null,
      phase: "quiz",
    });
  },

  loadMoreGifts: async () => {
    const { session, gifts, loadingMore } = get();
    if (!session || loadingMore) return;

    set({ loadingMore: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke("generate-gifts", {
        body: {
          session_id: session.id,
          exclude_names: gifts.map((g) => g.product_name).filter(Boolean),
        },
      });

      if (error) throw new Error(await extractFnError(error));
      if (data?.error) throw new Error(data.error);

      const incoming: GiftSuggestion[] = Array.isArray(data?.gifts) ? data.gifts : [];
      const existingNames = new Set(gifts.map((g) => g.product_name));
      const fresh = incoming.filter((g) => g.product_name && !existingNames.has(g.product_name));
      const maxRank = gifts.reduce((m, g) => Math.max(m, g.rank ?? 0), 0);
      const renumbered = fresh.map((g, i) => ({ ...g, rank: maxRank + i + 1 }));

      set({ gifts: [...gifts, ...renumbered], loadingMore: false });
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loadingMore: false });
    }
  },

  reset: () =>
    set({
      session: null,
      chips: { recipients: [], budget: "" },
      currentQuestion: null,
      newQuestionPending: null,
      previousConfidence: 0,
      gifts: [],
      phase: "chips",
      error: null,
      loadingMore: false,
      paywallBlocked: false,
    }),
}));
