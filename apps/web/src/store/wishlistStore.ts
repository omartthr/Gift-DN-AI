"use client";

import { create } from "zustand";
import { getSupabaseClient } from "@/lib/supabase";

// ─── Veritabanı satırı ─────────────────────────────────────────────────────
export interface WishlistRow {
  id: string;           // uuid PK
  user_id: string;
  product_name: string;
  product_link: string;
  product_image: string;
  product_description: string;
  reasoning: string;
  current_price: string;
  source_store: string;
  source_icon: string;
  rating: number | null;
  thumbnails: string[];
  tone: string;
  note: string;
  created_at: string;
}

// ─── Yeni öğe eklerken kullanılan payload (id/user_id/created_at hariç) ──
export type WishlistInsert = Omit<WishlistRow, "id" | "user_id" | "created_at">;

// ─── Store arayüzü ─────────────────────────────────────────────────────────
interface WishlistState {
  items: WishlistRow[];
  loading: boolean;
  /** İlk fetch yapıldı mı (gereksiz tekrar çekmeyi önler) */
  fetched: boolean;

  fetchItems: (userId: string) => Promise<void>;
  addItem: (userId: string, item: WishlistInsert) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  hasItem: (productName: string) => boolean;
  clearAll: (userId: string) => Promise<void>;
  /** Kullanıcı çıkış yaptığında local state'i temizle */
  resetLocal: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  fetched: false,

  // ─── READ ─────────────────────────────────────────────────────────────
  fetchItems: async (userId) => {
    // Zaten çekilmişse tekrar çekme
    if (get().fetched) return;

    set({ loading: true });
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ items: data as WishlistRow[], loading: false, fetched: true });
    } else {
      set({ loading: false, fetched: true });
    }
  },

  // ─── CREATE ───────────────────────────────────────────────────────────
  addItem: async (userId, item) => {
    const { items } = get();
    // Aynı ürün zaten varsa ekleme
    if (items.some((w) => w.product_name === item.product_name)) return false;

    const supabase = getSupabaseClient();

    const row = {
      user_id: userId,
      product_name: item.product_name,
      product_link: item.product_link,
      product_image: item.product_image,
      product_description: item.product_description,
      reasoning: item.reasoning,
      current_price: item.current_price,
      source_store: item.source_store,
      source_icon: item.source_icon,
      rating: item.rating,
      thumbnails: item.thumbnails,
      tone: item.tone,
      note: item.note,
    };

    const { data, error } = await supabase
      .from("wishlists")
      .insert(row)
      .select()
      .single();

    if (!error && data) {
      set({ items: [data as WishlistRow, ...items] });
      return true;
    }
    return false;
  },

  // ─── DELETE (tek) ─────────────────────────────────────────────────────
  removeItem: async (id) => {
    // Optimistic: önce UI'dan kaldır
    const prev = get().items;
    set({ items: prev.filter((w) => w.id !== id) });

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("wishlists").delete().eq("id", id);

    // Hata olursa geri al
    if (error) set({ items: prev });
  },

  // ─── UPDATE NOTE ──────────────────────────────────────────────────────
  updateNote: async (id, note) => {
    // Optimistic
    const prev = get().items;
    set({
      items: prev.map((w) => (w.id === id ? { ...w, note } : w)),
    });

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("wishlists")
      .update({ note })
      .eq("id", id);

    if (error) set({ items: prev });
  },

  // ─── HAS (local, senkron) ─────────────────────────────────────────────
  hasItem: (productName) => {
    return get().items.some((w) => w.product_name === productName);
  },

  // ─── DELETE ALL ───────────────────────────────────────────────────────
  clearAll: async (userId) => {
    const prev = get().items;
    set({ items: [] });

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", userId);

    if (error) set({ items: prev });
  },

  // ─── LOCAL RESET (çıkış yapınca) ──────────────────────────────────────
  resetLocal: () => set({ items: [], fetched: false, loading: false }),
}));
