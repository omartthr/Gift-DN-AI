"use client";

import { useState, useMemo, useEffect } from "react";
import { useI18n } from "@/store/i18nStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { useCommunityStore, type DbCommunityPost } from "@/store/communityStore";
import { COMMUNITY_FEED, TONE_BG, type CommunityPost } from "@/lib/data";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import TiltedCard from "@/components/TiltedCard";
import GradientText from "@/components/GradientText";

// ─── Birleştirilmiş post tipi (mock + DB) ──────────────────────────────
type UnifiedPost = {
  id: string;
  source: "mock" | "db";
  productName: string;
  productImage: string;        // DB postlarında gerçek görsel URL'si
  productLink: string;
  store: string;
  forLabel: string;            // Dile göre alıcı etiketi
  feedbackText: string;        // Dile göre geri bildirim metni
  author: string;
  anon: boolean;
  likes: number;
  h: number;                   // Kart yüksekliği
  tone: string;
  createdAt: string;
};

const TONES = ["sage", "rose", "clay", "sky", "cream", "coral"];

function mapMockToUnified(p: CommunityPost, lang: string): UnifiedPost {
  return {
    id: p.id,
    source: "mock",
    productName: p.productName,
    productImage: "",
    productLink: "",
    store: p.store,
    forLabel: lang === "tr" ? p.forTr : p.forEn,
    feedbackText: lang === "tr" ? p.textTr : p.textEn,
    author: p.author,
    anon: p.anon,
    likes: p.likes,
    h: p.h,
    tone: p.tone,
    createdAt: "",
  };
}

function mapDbToUnified(p: DbCommunityPost): UnifiedPost {
  const authorName = p.is_anonymous
    ? "Anonim"
    : p.profiles?.full_name || "Kullanıcı";

  return {
    id: p.id,
    source: "db",
    productName: p.product_name || "",
    productImage: p.product_image || "",
    productLink: p.product_link || "",
    store: "",
    forLabel: p.recipient_label || "",
    feedbackText: p.feedback_text || "",
    author: authorName,
    anon: p.is_anonymous,
    likes: p.likes_count,
    h: 300,
    tone: TONES[Math.abs(hashStr(p.id)) % TONES.length],
    createdAt: p.created_at,
  };
}

// Basit string hash — tutarlı renk ataması için
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export default function CommunityClient() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();

  // Wishlist
  const addWishlistItem = useWishlistStore((s) => s.addItem);
  const hasWishlistItem = useWishlistStore((s) => s.hasItem);
  const fetchWishlist = useWishlistStore((s) => s.fetchItems);

  // Community DB
  const dbPosts = useCommunityStore((s) => s.dbPosts);
  const fetchPosts = useCommunityStore((s) => s.fetchPosts);
  const communityLoading = useCommunityStore((s) => s.loading);
  const userLikes = useCommunityStore((s) => s.userLikes);
  const toggleDbLike = useCommunityStore((s) => s.toggleLike);
  const fetchUserLikes = useCommunityStore((s) => s.fetchUserLikes);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  // Mock postlar için local like state'i
  const [mockLikes, setMockLikes] = useState<Record<string, boolean>>({});

  // Sayfa yüklendiğinde DB postlarını çek
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Kullanıcı giriş yapmışsa wishlist + beğenileri çek
  useEffect(() => {
    if (user?.id) {
      fetchWishlist(user.id);
      fetchUserLikes(user.id);
    }
  }, [user?.id, fetchWishlist, fetchUserLikes]);

  const filterChips = [
    { k: "all", label: t.community.all },
    { k: "mom", label: (t.recipients as Record<string, string>)["mom"] },
    { k: "partner", label: (t.recipients as Record<string, string>)["partner"] },
    { k: "friend", label: (t.recipients as Record<string, string>)["friend"] },
    { k: "dad", label: (t.recipients as Record<string, string>)["dad"] },
    { k: "sibling", label: (t.recipients as Record<string, string>)["sibling"] },
    { k: "coworker", label: (t.recipients as Record<string, string>)["coworker"] },
    { k: "child", label: (t.recipients as Record<string, string>)["child"] },
  ];

  // ─── Mock + DB birleştirme ──────────────────────────────────────────
  const allPosts = useMemo(() => {
    const mocks: UnifiedPost[] = COMMUNITY_FEED.map((p) => mapMockToUnified(p, lang));
    const dbs: UnifiedPost[] = dbPosts.map(mapDbToUnified);

    // DB postlarını en üste koy, sonra mock'lar
    let combined = [...dbs, ...mocks];

    // Filtre uygula
    if (filter !== "all") {
      const labelTr = (t.recipients as Record<string, string>)[filter] || "";
      combined = combined.filter((p) =>
        p.forLabel.toLowerCase().includes(labelTr.toLowerCase()) ||
        p.forLabel.toLowerCase().includes(filter)
      );
    }

    // Sıralama
    if (sort === "top") {
      combined.sort((a, b) => {
        const aLikes = a.likes + (a.source === "mock" && mockLikes[a.id] ? 1 : 0);
        const bLikes = b.likes + (b.source === "mock" && mockLikes[b.id] ? 1 : 0);
        return bLikes - aLikes;
      });
    }

    return combined;
  }, [dbPosts, filter, sort, mockLikes, lang, t]);

  const handleLike = (post: UnifiedPost) => {
    if (post.source === "mock") {
      setMockLikes((l) => ({ ...l, [post.id]: !l[post.id] }));
    } else if (user?.id) {
      toggleDbLike(post.id, user.id);
    }
  };

  const isLiked = (post: UnifiedPost): boolean => {
    if (post.source === "mock") return !!mockLikes[post.id];
    return userLikes.has(post.id);
  };

  const getLikeCount = (post: UnifiedPost): number => {
    if (post.source === "mock") return post.likes + (mockLikes[post.id] ? 1 : 0);
    return post.likes;
  };

  const addToWishlist = async (p: UnifiedPost) => {
    if (!user) return;
    await addWishlistItem(user.id, {
      product_name: p.productName,
      product_link: p.productLink,
      product_image: p.productImage,
      product_description: p.feedbackText,
      reasoning: "",
      current_price: "—",
      source_store: p.store,
      source_icon: "",
      rating: null,
      thumbnails: [],
      tone: p.tone,
      note: "",
    });
  };

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 32px" }}>
          <div className="col gap-16" style={{ maxWidth: 760 }}>
            <div className="eyebrow">{t.community.eyebrow}</div>
            <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {t.community.title_a}<br />
              <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.community.title_b}</GradientText>
            </h1>
            <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 520 }}>{t.community.sub}</p>
          </div>
        </section>

        <hr className="rule" />

        <section style={{ padding: "24px 0" }}>
          <div className="row justify-between items-center wrap gap-16">
            <div className="row items-center gap-8 wrap">
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.community.filter}</span>
              {filterChips.map(c => (
                <button key={c.k} className={"chip" + (filter === c.k ? " active" : "")} onClick={() => setFilter(c.k)} style={{ padding: "6px 14px", fontSize: 13 }}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="row items-center gap-8">
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.community.sort}</span>
              <button className={"chip" + (sort === "new" ? " active" : "")} onClick={() => setSort("new")} style={{ padding: "6px 14px", fontSize: 13 }}>{t.community.sort_new}</button>
              <button className={"chip" + (sort === "top" ? " active" : "")} onClick={() => setSort("top")} style={{ padding: "6px 14px", fontSize: 13 }}>{t.community.sort_top}</button>
            </div>
          </div>
        </section>

        <hr className="rule-soft" />

        <section style={{ padding: "32px 0 80px" }}>
          {communityLoading && dbPosts.length === 0 && (
            <div className="col gap-12 items-center" style={{ padding: "40px 0" }}>
              <span className="dots"><span /><span /><span /></span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>
                {lang === "tr" ? "Topluluk postları yükleniyor…" : "Loading community posts…"}
              </span>
            </div>
          )}

          <div style={{ columnCount: 3, columnGap: 20 }}>
            {allPosts.map((p, i) => {
              const liked = isLiked(p);
              const totalLikes = getLikeCount(p);
              const saved = hasWishlistItem(p.productName);
              return (
                <div key={p.id} className="fade-up" style={{ display: "inline-block", width: "100%", marginBottom: 20, breakInside: "avoid", animationDelay: `${(i % 6) * 0.06}s` }}>
                  <TiltedCard scaleOnHover={1.02} rotateAmplitude={8}>
                    <div className="card" style={{ width: "100%", height: "100%" }}>
                      {/* Görsel: DB postu gerçek görsel, mock → placeholder */}
                      {p.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.productImage}
                          alt={p.productName}
                          style={{
                            width: "100%",
                            height: p.h,
                            objectFit: "cover",
                            display: "block",
                            borderRadius: "var(--radius, 6px) var(--radius, 6px) 0 0",
                          }}
                        />
                      ) : (
                        <ImagePlaceholder tone={p.tone} label={p.productName.toUpperCase()} h={p.h} />
                      )}
                      <div className="col gap-12" style={{ padding: "16px 18px 18px" }}>
                        <div className="row gap-8 items-center wrap">
                          <span className="tag tag-rose">{p.forLabel}</span>
                          {p.store && (
                            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>· {p.store.toUpperCase()}</span>
                          )}
                        </div>
                        <p className="serif-italic" style={{ fontSize: 18, lineHeight: 1.35, color: "var(--ink)", margin: 0 }}>"{p.feedbackText}"</p>
                        <hr className="rule-soft" />
                        <div className="row justify-between items-center">
                          <div className="row gap-8 items-center">
                            <span style={{ width: 24, height: 24, borderRadius: "50%", background: p.anon ? "var(--muted-2)" : "var(--ink)", color: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "JetBrains Mono" }}>
                              {p.anon ? "·" : p.author[0]}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.anon ? t.community.anon : p.author}</span>
                          </div>
                          <div className="row gap-4 items-center">
                            <button onClick={() => handleLike(p)} className="btn btn-ghost btn-sm" style={{ padding: "6px 10px", border: "none", color: liked ? "var(--coral)" : "var(--muted)" }}>
                              {liked ? "♥" : "♡"} <span className="mono" style={{ fontSize: 11 }}>{totalLikes}</span>
                            </button>
                            <button onClick={() => addToWishlist(p)} className="btn btn-ghost btn-sm" style={{ padding: "6px 10px", border: "none", color: saved ? "var(--sage)" : "var(--muted)" }}>
                              {saved ? "✓" : "+"} <span style={{ fontSize: 11 }}>{saved ? t.community.saved : t.community.add_wish}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TiltedCard>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
