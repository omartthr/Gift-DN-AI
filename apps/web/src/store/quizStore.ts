"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";
import type { QuizSession, GiftSuggestion, InitialChips, NextQuestionResponse } from "@/types";

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
  b1: "0–250 TL",
  b2: "250–500 TL",
  b3: "500–1000 TL",
  b4: "1000–3000 TL",
  b5: "3000+ TL",
};

interface QuizState {
  session: QuizSession | null;
  chips: InitialChips;
  currentQuestion: NextQuestionResponse | null;
  gifts: GiftSuggestion[];
  phase: "chips" | "quiz" | "loading" | "generating" | "results";
  error: string | null;

  setChips: (chips: InitialChips) => void;
  startSession: (userId: string, language: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()(persist((set, get) => ({
  session: null,
  chips: { recipients: [], budget: "" },
  currentQuestion: null,
  gifts: [],
  phase: "chips",
  error: null,

  setChips: (chips) => set({ chips }),

  startSession: async (_userId, language) => {
    set({ phase: "loading", error: null });
    const supabase = getSupabaseClient();

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

      set({ currentQuestion: data, phase: "quiz" });
    } catch (err: any) {
      set({ error: err.message || "Bilinmeyen hata", phase: "chips" });
    }
  },

  submitAnswer: async (answer) => {
    const { session } = get();
    if (!session) return;

    set({ phase: "loading", error: null });
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

        set({ gifts: giftsData?.gifts || [], phase: "results" });
      } else {
        set({ currentQuestion: data, phase: "quiz" });
      }
    } catch (err: any) {
      set({ error: err.message || "Bilinmeyen hata", phase: "quiz" });
    }
  },

  reset: () => set({
    session: null,
    chips: { recipients: [], budget: "" },
    currentQuestion: null,
    gifts: [],
    phase: "chips",
    error: null,
  }),
}), {
  name: "gift-dn-ai:quiz",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ session: state.session, gifts: state.gifts, chips: state.chips }),
}));
