"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/store/i18nStore";
import { COMMUNITY_FEED, TONE_BG, type CommunityPost } from "@/lib/data";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import TiltedCard from "@/components/TiltedCard";
import GradientText from "@/components/GradientText";

type WishlistItem = { name: string; store: string; tone: string; price: string; desc: string; note: string };

export default function CommunityClient() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

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

  const items = useMemo(() => {
    let arr = [...COMMUNITY_FEED];
    if (filter !== "all") {
      const labelTr = (t.recipients as Record<string, string>)[filter] || "";
      arr = arr.filter(p => (p.forTr + " " + p.forEn).toLowerCase().includes(labelTr.toLowerCase()) || (p.forTr + " " + p.forEn).toLowerCase().includes(filter));
    }
    if (sort === "top") arr.sort((a, b) => (b.likes + (likes[b.id] ? 1 : 0)) - (a.likes + (likes[a.id] ? 1 : 0)));
    return arr;
  }, [filter, sort, likes, lang, t]);

  const toggleLike = (id: string) => setLikes(l => ({ ...l, [id]: !l[id] }));
  const addToWishlist = (p: CommunityPost) => {
    if (!wishlist.some(w => w.name === p.productName)) {
      setWishlist(w => [...w, { name: p.productName, store: p.store, tone: p.tone, price: "—", desc: lang === "tr" ? p.textTr : p.textEn, note: "" }]);
    }
  };

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 32px" }}>
          <div className="col gap-16" style={{ maxWidth: 760 }}>
            <div className="eyebrow">{t.community.eyebrow}</div>
            <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {t.community.title_a}<br />
              <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{t.community.title_b}</GradientText>
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
          <div style={{ columnCount: 3, columnGap: 20 }}>
            {items.map((p, i) => {
              const liked = !!likes[p.id];
              const totalLikes = p.likes + (liked ? 1 : 0);
              const saved = wishlist.some(w => w.name === p.productName);
              return (
                <div key={p.id} className="fade-up" style={{ display: "inline-block", width: "100%", marginBottom: 20, breakInside: "avoid", animationDelay: `${(i % 6) * 0.06}s` }}>
                  <TiltedCard scaleOnHover={1.02} rotateAmplitude={8}>
                    <div className="card" style={{ width: "100%", height: "100%" }}>
                      <ImagePlaceholder tone={p.tone} label={p.productName.toUpperCase()} h={p.h} />
                      <div className="col gap-12" style={{ padding: "16px 18px 18px" }}>
                        <div className="row gap-8 items-center wrap">
                          <span className="tag tag-rose">{lang === "tr" ? p.forTr : p.forEn}</span>
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>· {p.store.toUpperCase()}</span>
                        </div>
                        <p className="serif-italic" style={{ fontSize: 18, lineHeight: 1.35, color: "var(--ink)", margin: 0 }}>"{lang === "tr" ? p.textTr : p.textEn}"</p>
                        <hr className="rule-soft" />
                        <div className="row justify-between items-center">
                          <div className="row gap-8 items-center">
                            <span style={{ width: 24, height: 24, borderRadius: "50%", background: p.anon ? "var(--muted-2)" : "var(--ink)", color: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "JetBrains Mono" }}>
                              {p.anon ? "·" : p.author[0]}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.anon ? t.community.anon : p.author}</span>
                          </div>
                          <div className="row gap-4 items-center">
                            <button onClick={() => toggleLike(p.id)} className="btn btn-ghost btn-sm" style={{ padding: "6px 10px", border: "none", color: liked ? "var(--coral)" : "var(--muted)" }}>
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
