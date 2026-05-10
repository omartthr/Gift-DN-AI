"use client";

import { create } from "zustand";
import { getSupabaseClient } from "@/lib/supabase";
import type { QuizSession, GiftSuggestion, InitialChips, NextQuestionResponse } from "@/types";

interface QuizState {
  session: QuizSession | null;
  chips: InitialChips;
  currentQuestion: NextQuestionResponse | null;
  gifts: GiftSuggestion[];
  phase: "chips" | "quiz" | "loading" | "results";
  error: string | null;
  setChips: (chips: InitialChips) => void;
  startSession: (userId: string, language: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  chips: { recipients: [], budget: "" },
  currentQuestion: null,
  gifts: [],
  phase: "chips",
  error: null,

  setChips: (chips) => set({ chips }),

  startSession: async (userId, language) => {
    set({ phase: "loading", error: null });
    const supabase = getSupabaseClient();
    try {
      const { chips } = get();
      const { data: session, error } = await supabase
        .from("quiz_sessions")
        .insert({ user_id: userId, initial_chips: chips, language, conversation_history: [] })
        .select()
        .single();
      if (error || !session) throw new Error("Oturum oluşturulamadı");
      set({ session });
      const { data, error: fnErr } = await supabase.functions.invoke("next-question", {
        body: { session_id: session.id, user_answer: null },
      });
      if (fnErr) throw fnErr;
      set({ currentQuestion: data, phase: "quiz" });
    } catch (err) {
      set({ error: (err as Error).message, phase: "chips" });
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
      if (error) throw error;
      if (data.completed) {
        const { data: giftsData, error: giftErr } = await supabase.functions.invoke("generate-gifts", {
          body: { session_id: session.id },
        });
        if (giftErr) throw giftErr;
        set({ gifts: giftsData.gifts, phase: "results" });
      } else {
        set({ currentQuestion: data, phase: "quiz" });
      }
    } catch (err) {
      set({ error: (err as Error).message, phase: "quiz" });
    }
  },

  reset: () => set({ session: null, chips: { recipients: [], budget: "" }, currentQuestion: null, gifts: [], phase: "chips", error: null }),
}));
