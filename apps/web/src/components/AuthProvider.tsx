"use client";

import { useEffect } from "react";
import { getSupabaseClient, IS_SUPABASE_CONFIGURED } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Supabase henüz yapılandırılmamışsa sessizce geç
    if (!IS_SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        useWishlistStore.getState().fetchItems(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        useWishlistStore.getState().fetchItems(session.user.id);
      } else {
        // Çıkış yapıldı — wishlist local state'ini temizle
        useWishlistStore.getState().resetLocal();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

