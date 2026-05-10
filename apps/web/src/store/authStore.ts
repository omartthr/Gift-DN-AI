"use client";

import { create } from "zustand";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  fetchProfile: async (userId) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) set({ profile: data });
  },
  signOut: async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
