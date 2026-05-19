"use client";

import { create } from "zustand";
import { getSupabaseClient } from "@/lib/supabase";

// ─── Veritabanı satırı (community_posts + profiles join) ────────────────
export interface DbCommunityPost {
  id: string;
  user_id: string;
  session_id: string | null;
  suggestion_id: string | null;
  product_name: string;
  product_image: string;
  product_link: string;
  feedback_text: string;
  recipient_label: string;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string } | null;
}

// ─── Yeni post oluştururken kullanılan payload ──────────────────────────
export type CommunityPostInsert = {
  user_id: string;
  session_id?: string | null;
  suggestion_id?: string | null;
  product_name: string;
  product_image: string;
  product_link: string;
  feedback_text: string;
  recipient_label: string;
  is_anonymous: boolean;
};

// ─── Store arayüzü ─────────────────────────────────────────────────────
interface CommunityState {
  dbPosts: DbCommunityPost[];
  loading: boolean;
  fetched: boolean;

  fetchPosts: () => Promise<void>;
  createPost: (post: CommunityPostInsert) => Promise<boolean>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  /** Kullanıcının beğendiği post ID'leri */
  userLikes: Set<string>;
  fetchUserLikes: (userId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  dbPosts: [],
  loading: false,
  fetched: false,
  userLikes: new Set(),

  // ─── READ ─────────────────────────────────────────────────────────
  fetchPosts: async () => {
    if (get().fetched) return;

    set({ loading: true });
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("community_posts")
      .select("*, profiles!user_id(full_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      set({ dbPosts: data as DbCommunityPost[], loading: false, fetched: true });
    } else {
      set({ loading: false, fetched: true });
    }
  },

  // ─── CREATE ───────────────────────────────────────────────────────
  createPost: async (post) => {
    const supabase = getSupabaseClient();

    // FK alanları null ise payload'dan çıkar — yoksa FK violation olur
    const payload: Record<string, unknown> = {
      user_id: post.user_id,
      product_name: post.product_name,
      product_image: post.product_image,
      product_link: post.product_link,
      feedback_text: post.feedback_text,
      recipient_label: post.recipient_label,
      is_anonymous: post.is_anonymous,
    };
    if (post.session_id) payload.session_id = post.session_id;
    if (post.suggestion_id) payload.suggestion_id = post.suggestion_id;

    const { data, error } = await supabase
      .from("community_posts")
      .insert(payload)
      .select("*, profiles!user_id(full_name, avatar_url)")
      .single();

    if (error) {
      console.error("[communityStore] createPost error:", error);
      return false;
    }

    if (data) {
      set({ dbPosts: [data as DbCommunityPost, ...get().dbPosts] });
      return true;
    }
    return false;
  },

  // ─── LIKE / UNLIKE ────────────────────────────────────────────────
  toggleLike: async (postId, userId) => {
    const { userLikes, dbPosts } = get();
    const supabase = getSupabaseClient();
    const alreadyLiked = userLikes.has(postId);

    // Optimistic update
    const newLikes = new Set(userLikes);
    if (alreadyLiked) {
      newLikes.delete(postId);
    } else {
      newLikes.add(postId);
    }
    set({
      userLikes: newLikes,
      dbPosts: dbPosts.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (alreadyLiked ? -1 : 1) }
          : p
      ),
    });

    if (alreadyLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (error) {
        // Rollback
        set({ userLikes, dbPosts });
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ user_id: userId, post_id: postId });

      if (error) {
        // Rollback
        set({ userLikes, dbPosts });
      }
    }
  },

  // ─── Kullanıcının beğeni listesini çek ────────────────────────────
  fetchUserLikes: async (userId) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId);

    if (data) {
      set({ userLikes: new Set(data.map((d) => d.post_id)) });
    }
  },
}));
