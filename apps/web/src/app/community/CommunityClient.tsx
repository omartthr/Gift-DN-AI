"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/store/i18nStore";
import type { CommunityPost } from "@/types";
import styles from "./Community.module.css";

const RECIPIENTS = ["sevgili", "anne", "baba", "arkadas", "kardes", "is_arkadasi", "cocuk", "diger"] as const;
const PAGE_SIZE = 12;

export default function CommunityClient() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    const supabase = getSupabaseClient();
    let query = supabase
      .from("community_posts")
      .select("*, profiles(full_name, avatar_url)")
      .range(reset ? 0 : posts.length, (reset ? 0 : posts.length) + PAGE_SIZE - 1);

    if (filter !== "all") query = query.ilike("recipient_label", `%${(t.quiz.recipients as any)[filter] || filter}%`);
    query = sort === "popular" ? query.order("likes_count", { ascending: false }) : query.order("created_at", { ascending: false });

    const { data } = await query;
    if (data) {
      setPosts(reset ? data : prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [filter, sort]);

  useEffect(() => { fetchPosts(true); }, [filter, sort]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    supabase.from("post_likes").select("post_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setLikedIds(new Set(data.map(d => d.post_id)));
    });
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase.functions.invoke("community-like", { body: { post_id: postId } });
    if (data) {
      setLikedIds(prev => { const n = new Set(prev); data.liked ? n.add(postId) : n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes_count } : p));
    }
  };

  const handleWishlist = async (post: CommunityPost) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    await supabase.from("wishlists").insert({ user_id: user.id, post_id: post.id, product_name: post.product_name, product_link: post.product_link, product_image: post.product_image });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={`${styles.header} animate-fade-in-up`}>
          <h1 className="gradient-text">{t.community.title}</h1>
          <p>{t.community.subtitle}</p>
        </div>

        <div className={`${styles.filters} animate-fade-in-up`}>
          <div className={styles.filterChips}>
            <button className={`chip ${filter === "all" ? "selected" : ""}`} onClick={() => setFilter("all")}>{t.community.filter_all}</button>
            {RECIPIENTS.map(r => (
              <button key={r} className={`chip ${filter === r ? "selected" : ""}`} onClick={() => setFilter(r)}>
                {(t.quiz.recipients as any)[r]}
              </button>
            ))}
          </div>
          <div className={styles.sortBtns}>
            <button className={`btn btn-sm ${sort === "newest" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setSort("newest")}>{t.community.sort_newest}</button>
            <button className={`btn btn-sm ${sort === "popular" ? "btn-secondary" : "btn-ghost"}`} onClick={() => setSort("popular")}>{t.community.sort_popular}</button>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="masonry-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: `${180 + (i * 30)}px` }} />
            ))}
          </div>
        ) : (
          <div className="masonry-grid">
            {posts.map(post => (
              <div key={post.id} className={`card animate-fade-in-up ${styles.postCard}`}>
                {post.product_image && (
                  <div className={styles.imageWrap}>
                    <img src={post.product_image} alt={post.product_name} className={styles.image} />
                  </div>
                )}
                <div className={styles.cardContent}>
                  <div className={styles.topMeta}>
                    {post.recipient_label && <span className="badge badge-primary">{post.recipient_label}</span>}
                    <span className={styles.date}>{new Date(post.created_at).toLocaleDateString("tr-TR")}</span>
                  </div>
                  <h3 className={styles.productName}>{post.product_name}</h3>
                  {post.feedback_text && <p className={styles.feedback}>"{post.feedback_text}"</p>}
                  <div className={styles.footer}>
                    <span className={styles.author}>— {post.is_anonymous ? t.common.anonymous : (post.profiles as any)?.full_name || t.common.anonymous}</span>
                    <div className={styles.postActions}>
                      <button className={`${styles.likeBtn} ${likedIds.has(post.id) ? styles.liked : ""}`} onClick={() => handleLike(post.id)}>
                        {likedIds.has(post.id) ? "❤️" : "🤍"} {post.likes_count}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleWishlist(post)} style={{ fontSize: "0.75rem" }}>
                        + {t.community.add_wishlist}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => fetchPosts(false)}>Daha Fazla Göster</button>
          </div>
        )}
      </div>
    </div>
  );
}
