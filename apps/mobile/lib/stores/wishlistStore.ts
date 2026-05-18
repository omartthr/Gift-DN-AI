import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface WishlistRow {
  id: string;
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

export type WishlistInsert = Omit<WishlistRow, "id" | "user_id" | "created_at">;

interface WishlistState {
  items: WishlistRow[];
  loading: boolean;
  fetched: boolean;
  fetchItems: (userId: string) => Promise<void>;
  addItem: (userId: string, item: WishlistInsert) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  hasItem: (productName: string) => boolean;
  resetLocal: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  fetched: false,

  fetchItems: async (userId) => {
    if (get().fetched) return;
    set({ loading: true });
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

  addItem: async (userId, item) => {
    const { items } = get();
    if (items.some((w) => w.product_name === item.product_name)) return false;

    const row = { user_id: userId, ...item };
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

  removeItem: async (id) => {
    const prev = get().items;
    set({ items: prev.filter((w) => w.id !== id) });
    const { error } = await supabase.from("wishlists").delete().eq("id", id);
    if (error) set({ items: prev });
  },

  updateNote: async (id, note) => {
    const prev = get().items;
    set({ items: prev.map((w) => (w.id === id ? { ...w, note } : w)) });
    const { error } = await supabase
      .from("wishlists")
      .update({ note })
      .eq("id", id);
    if (error) set({ items: prev });
  },

  hasItem: (productName) => get().items.some((w) => w.product_name === productName),

  resetLocal: () => set({ items: [], fetched: false, loading: false }),
}));
