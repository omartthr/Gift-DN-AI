"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import type { QuizSession, GiftSuggestion, InitialChips, NextQuestionResponse } from "@/types";
import { useAuthStore } from "./authStore";

// Supabase'in gizlediği gerçek hata metnini çıkar
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
  return "Bilinmeyen hata";
}

const BUDGET_MAP: Record<string, string> = {
  b1: "0–500 TL",
  b2: "500–1000 TL",
  b3: "1000–3000 TL",
  b4: "3000–10000 TL",
  b5: "10000+ TL",
};

interface QuizState {
  session: QuizSession | null;
  chips: InitialChips;
  currentQuestion: NextQuestionResponse | null;
  newQuestionPending: NextQuestionResponse | null;
  previousConfidence: number;
  gifts: GiftSuggestion[];
  phase: "chips" | "quiz" | "loading" | "generating" | "results";
  error: string | null;
  loadingMore: boolean;
  setChips: (chips: InitialChips) => void;
  startSession: (userId: string, language: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  commitQuestion: () => void;
  loadMoreGifts: () => Promise<void>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()(persist((set, get) => ({
  session: null,
  chips: { recipients: [], budget: "" },
  currentQuestion: null,
  newQuestionPending: null,
  previousConfidence: 0,
  gifts: [],
  phase: "chips",
  error: null,
  loadingMore: false,

  setChips: (chips) => set({ chips }),

  startSession: async (_userId, language) => {
    const { profile } = useAuthStore.getState();
    const supabase = getSupabaseClient();

    // Check free plan limits securely via DB count
    if (profile?.subscription_status !== 'active') {
      const { count } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', _userId)
        .eq('status', 'completed');
      
      if ((count ?? 0) >= 1) {
        window.location.href = '/pricing';
        return;
      }
    }

    set({ phase: "loading", error: null, previousConfidence: 0, newQuestionPending: null, currentQuestion: null });

    try {
      const { chips } = get();
      const budgetLabel = BUDGET_MAP[chips.budget] || chips.budget;

      // Session oluşturma + ilk soru → Edge Function halleder (service_role ile)
      const { data, error } = await supabase.functions.invoke("next-question", {
        body: {
          session_id: null,   // İlk çağrı → EF içinde session oluşturulur
          user_answer: null,
          chips: {
            recipients: chips.recipients,
            budget: budgetLabel,
          },
          language,
        },
      });

      if (error) throw new Error(await extractFnError(error));
      if (!data) throw new Error("Boş yanıt döndü");
      if (data.error) throw new Error(data.error);

      // Edge Function session_id'yi de döndürür (ilk çağrıda)
      if (data.session_id) {
        set({
          session: { id: data.session_id } as QuizSession,
        });
      }

      // Yeni soruyu beklemeye al — LoadingScreen güven skoru animasyonunu çalıştırır,
      // animasyon bitince commitQuestion() çağırarak phase: "quiz"'e geçer.
      set({ newQuestionPending: data });
    } catch (err: any) {
      set({ error: err.message || "Bilinmeyen hata", phase: "chips" });
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
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.functions.invoke("next-question", {
        body: { session_id: session.id, user_answer: answer },
      });

      if (error) throw new Error(await extractFnError(error));
      if (!data) throw new Error("Boş yanıt döndü");
      if (data.error) throw new Error(data.error);

      if (data.completed) {
        // Anket bitti → hediye üretimi
        set({ phase: "generating", currentQuestion: null });

        const { data: giftsData, error: giftErr } = await supabase.functions.invoke("generate-gifts", {
          body: { session_id: session.id },
        });

        if (giftErr) throw new Error(await extractFnError(giftErr));
        if (giftsData?.error) throw new Error(giftsData.error);

        set({ 
          gifts: giftsData?.gifts || [], 
          phase: "results"
        });
      } else {
        // Yeni soru hazır — LoadingScreen güven skoru geçişini animasyonla
        // gösterip bitince commitQuestion() ile phase'i "quiz"e çevirecek.
        set({ newQuestionPending: data });
      }
    } catch (err: any) {
      set({ error: err.message || "Bilinmeyen hata", phase: "quiz" });
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
    const supabase = getSupabaseClient();

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
      set({ error: err.message || "Bilinmeyen hata", loadingMore: false });
    }
  },

  reset: () => set({
    session: null,
    chips: { recipients: [], budget: "" },
    currentQuestion: null,
    newQuestionPending: null,
    previousConfidence: 0,
    gifts: [],
    phase: "chips",
    error: null,
    loadingMore: false,
  }),
}), {
  name: "gift-dn-ai:quiz",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ session: state.session, gifts: state.gifts, chips: state.chips }),
}));
