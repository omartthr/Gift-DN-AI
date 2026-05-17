"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { useQuizStore } from "@/store/quizStore";
import { GIFT_RESULTS, type GiftResult } from "@/lib/data";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import GradientText from "@/components/GradientText";
import type { GiftSuggestion } from "@/types";

type WishlistItem = { name: string; store: string; tone: string; price: string; desc: string; note: string; link: string; image: string };

const TONES = ["sage", "rose", "clay", "sky", "cream", "coral"];

type DisplayGift = {
  rank: number;
  name: string;
  tone: string;
  desc: string;
  why: string;
  price: string;
  store: string;
  stock: string;
  link: string;
  image: string;
  rating?: number;
  sourceIcon?: string;
  thumbnails: string[];
};

function mapSuggestion(g: GiftSuggestion, i: number, lang: string): DisplayGift {
  const inStock = lang === "tr" ? "Stokta" : "In stock";

  // product_link / product_image boş gelebilir — serp_results'dan al
  const serpTop = Array.isArray(g.serp_results) && g.serp_results.length > 0 ? g.serp_results[0] : null;
  const link = g.product_link || serpTop?.link || "";
  const mainImage = g.product_image || serpTop?.thumbnail || "";
  const price = g.current_price || serpTop?.price || "";
  const store = g.source_store || serpTop?.source || "";

  const extras = (g.thumbnails || []).filter((t) => t && t !== mainImage);
  const thumbnails = mainImage ? [mainImage, ...extras] : extras;

  return {
    rank: g.rank ?? i + 1,
    name: g.product_name || "—",
    tone: TONES[i % TONES.length],
    desc: g.product_description || "",
    why: g.reasoning || "",
    price,
    store,
    stock: inStock,
    link,
    image: mainImage,
    rating: typeof g.rating === "number" ? g.rating : undefined,
    sourceIcon: g.source_icon || "",
    thumbnails,
  };
}


function mapMock(g: GiftResult): DisplayGift {
  return {
    rank: g.rank,
    name: g.name,
    tone: g.tone,
    desc: g.desc,
    why: g.why,
    price: g.price,
    store: g.store,
    stock: g.stock,
    link: "",
    image: "",
    thumbnails: [],
  };
}

export default function ResultsClient() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const liveGifts = useQuizStore(s => s.gifts);
  const reset = useQuizStore(s => s.reset);
  const loadMoreGifts = useQuizStore(s => s.loadMoreGifts);
  const loadingMore = useQuizStore(s => s.loadingMore);
  const session = useQuizStore(s => s.session);

  // Defansif filtre: backend zaten geçersiz ürünleri elemeli, ama yine de
  // satış linki olmayan kart gösterme — kullanıcı boş bir hediye görmemeli.
  const validLiveGifts = liveGifts.filter(g => {
    const link = g.product_link || (Array.isArray(g.serp_results) ? g.serp_results[0]?.link : "") || "";
    return Boolean(link);
  });

  const gifts: DisplayGift[] = validLiveGifts.length
    ? [...validLiveGifts]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((g, i) => ({ ...mapSuggestion(g, i, lang), rank: i + 1 }))
    : (GIFT_RESULTS[lang] || GIFT_RESULTS["tr"]).map(mapMock);

  const totalCount = gifts.length;

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [shareGift, setShareGift] = useState<DisplayGift | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const previousCountRef = useRef(gifts.length);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleLoadMore = async () => {
    previousCountRef.current = gifts.length;
    await loadMoreGifts();
    const after = useQuizStore.getState().gifts.length;
    if (after === previousCountRef.current) {
      showToast(t.results.more_empty);
    }
  };

  const addToWishlist = (g: DisplayGift) => {
    if (!wishlist.some(w => w.name === g.name)) {
      setWishlist(w => [...w, { name: g.name, store: g.store, tone: g.tone, price: g.price, desc: g.desc, note: "", link: g.link, image: g.image }]);
      showToast(lang === "tr" ? "İstek listesine eklendi" : "Added to your wishlist");
    }
  };

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 32px" }}>
          <div className="row justify-between items-end">
            <div className="col gap-16" style={{ maxWidth: 760 }}>
              <div className="row gap-12 items-center">
                <span className="eyebrow">{t.results.eyebrow}</span>
                <span className="tag tag-sage">AI · 0.89</span>
              </div>
              <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {t.results.title_a} <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{t.results.title_b}</GradientText>
              </h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 520 }}>{t.results.sub}</p>
            </div>
            <button className="btn btn-bone btn-sm" onClick={() => { reset(); router.push("/quiz"); }}>↻ {t.results.restart}</button>
          </div>
        </section>

        <hr className="rule" />

        <section style={{ padding: "32px 0 80px" }}>
          {liveGifts.length > 0 && validLiveGifts.length === 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 24, background: "var(--cream-2)", border: "1px solid var(--rule)" }}>
              <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
                {lang === "tr"
                  ? "Önerilen hediyeler için online satış sayfası bulunamadı. Tercihlerinizi güncelleyip tekrar deneyebilirsiniz."
                  : "We couldn't find online listings for the suggested gifts. Try adjusting your preferences and starting over."}
              </p>
            </div>
          )}
          <div className="col gap-24">
            {gifts.map((g, i) => {
              const saved = wishlist.some(w => w.name === g.name);
              return (
                <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="row gap-32 wrap" style={{ alignItems: "stretch" }}>
                    <div style={{ flex: "0 0 380px" }}>
                      <GiftGallery gift={g} />
                    </div>
                    <div className="col gap-16" style={{ flex: 1, padding: "4px 0" }}>
                      <div className="row gap-12 items-baseline">
                        <GradientText className="serif" animationSpeed={3} style={{ fontSize: 48 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>0{g.rank}</GradientText>
                        <span className="eyebrow">{t.results.rank} · {g.rank}/{totalCount}</span>
                      </div>
                      <h2 className="serif" style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{g.name}</h2>
                      {typeof g.rating === "number" && (
                        <div className="row gap-6 items-center" style={{ marginTop: -4 }}>
                          <StarRating value={g.rating} />
                          <span className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>{g.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, maxWidth: 560 }}>{g.desc}</p>

                      <div className="card" style={{ padding: 18, background: "var(--cream-2)", border: "1px solid var(--rule)", maxWidth: 580 }}>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>{t.results.why}</div>
                        <p className="serif-italic" style={{ fontSize: 18, lineHeight: 1.45, color: "var(--ink)" }}>"{g.why}"</p>
                      </div>

                      <div className="row gap-24 items-baseline" style={{ marginTop: 8 }}>
                        <div className="col gap-4">
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.results.price.toUpperCase()}</span>
                          <span className="serif" style={{ fontSize: 24 }}>{g.price}</span>
                        </div>
                        <div className="col gap-4">
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.results.from.toUpperCase()}</span>
                          <span className="row gap-6 items-center" style={{ fontSize: 16 }}>
                            {g.sourceIcon && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={g.sourceIcon}
                                alt={g.store}
                                style={{ width: 18, height: 18, borderRadius: 4, objectFit: "contain", background: "var(--bone)" }}
                              />
                            )}
                            <span>{g.store}</span>
                          </span>
                        </div>
                        <div className="col gap-4">
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.results.status}</span>
                          <span style={{ fontSize: 13, color: "var(--sage)" }}>● {g.stock}</span>
                        </div>
                      </div>

                      <div className="row gap-8 items-center wrap" style={{ marginTop: 16 }}>
                        {g.link ? (
                          <a
                            className="btn btn-coral"
                            href={g.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t.results.view} ↗
                          </a>
                        ) : (
                          <button
                            className="btn btn-coral"
                            disabled
                            style={{ opacity: 0.5, cursor: "not-allowed" }}
                          >
                            {t.results.view} ↗
                          </button>
                        )}
                        <button className={"btn " + (saved ? "btn-bone" : "btn-ghost")} onClick={() => addToWishlist(g)}>
                          {saved ? "✓ " + t.results.saved : "♡ " + t.results.wishlist}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShareGift(g)}>↗ {t.results.share}</button>
                      </div>
                    </div>
                  </div>
                  {i < gifts.length - 1 && <hr className="rule-soft" style={{ marginTop: 32 }} />}
                </div>
              );
            })}
          </div>

          {validLiveGifts.length > 0 && session && (
            <div className="col gap-12 items-center" style={{ marginTop: 56, textAlign: "center" }}>
              <hr className="rule-soft" style={{ width: "100%", marginBottom: 24 }} />
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)" }}>
                {t.results.more_hint.toUpperCase()}
              </span>
              <button
                className="btn btn-bone"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ minWidth: 280, opacity: loadingMore ? 0.7 : 1, cursor: loadingMore ? "wait" : "pointer" }}
              >
                {loadingMore ? (
                  <span className="row gap-8 items-center" style={{ justifyContent: "center" }}>
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid var(--rule)",
                        borderTopColor: "var(--ink)",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>{t.results.more_loading}</span>
                  </span>
                ) : (
                  <span>+ {t.results.more}</span>
                )}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Share Modal */}
      {shareGift && (
        <ShareModal gift={shareGift} onClose={() => setShareGift(null)} onPost={() => { showToast(lang === "tr" ? "Toplulukla paylaşıldı" : "Shared with the community"); setShareGift(null); }} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fade-up" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--cream)", padding: "12px 20px", borderRadius: 999, fontSize: 13, zIndex: 60, boxShadow: "0 10px 30px rgba(27,22,17,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function GiftGallery({ gift }: { gift: DisplayGift }) {
  const [active, setActive] = useState(gift.image);
  const thumbs = gift.thumbnails.length > 1 ? gift.thumbnails.slice(0, 5) : [];
  const main = active || gift.image;

  return (
    <div className="col gap-8">
      {main ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={main}
          alt={gift.name}
          style={{ width: "100%", height: 380, objectFit: "cover", borderRadius: 8, background: "var(--bone)" }}
        />
      ) : (
        <ImagePlaceholder tone={gift.tone} label={gift.name.toUpperCase()} h={380} />
      )}
      {thumbs.length > 0 && (
        <div className="row gap-8 wrap">
          {thumbs.map((src, idx) => {
            const isActive = src === main;
            return (
              <button
                key={`${src}-${idx}`}
                onClick={() => setActive(src)}
                aria-label={`${gift.name} ${idx + 1}`}
                style={{
                  width: 60,
                  height: 60,
                  padding: 0,
                  border: isActive ? "2px solid var(--coral)" : "1px solid var(--rule)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--bone)",
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.78,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <span style={{ position: "relative", display: "inline-block", fontSize: 14, letterSpacing: 1, lineHeight: 1 }} aria-label={`${value} / 5`}>
      <span style={{ color: "#D4C5B0" }}>★★★★★</span>
      <span style={{ position: "absolute", top: 0, left: 0, overflow: "hidden", width: `${pct}%`, color: "#F5A524", whiteSpace: "nowrap" }}>★★★★★</span>
    </span>
  );
}

function ShareModal({ gift, onClose, onPost }: { gift: DisplayGift; onClose: () => void; onPost: () => void }) {
  const { t, lang } = useI18n();
  const [recipient, setRecipient] = useState(lang === "tr" ? "Annem için" : "For my mom");
  const [feedback, setFeedback] = useState("");
  const [anon, setAnon] = useState(false);

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(27,22,17,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up"
        style={{ background: "var(--cream)", borderRadius: 8, padding: "40px 48px", maxWidth: 560, width: "100%", border: "1px solid var(--rule)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: 0, fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>×</button>
        <div className="col gap-20">
          <div className="eyebrow">{t.share.title.toUpperCase()}</div>
          <h2 className="serif" style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{gift.name}</h2>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.share.sub}</p>
          <div className="col gap-12">
            <div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.share.recipient}</span>
              <input className="input" value={recipient} onChange={e => setRecipient(e.target.value)} />
            </div>
            <div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.share.feedback}</span>
              <textarea className="input" rows={3} style={{ resize: "none", borderBottom: "1px solid var(--rule)" }}
                placeholder={lang === "tr" ? "Hediye nasıl karşılandı?" : "How was it received?"}
                value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
            <label className="row gap-8 items-center" style={{ marginTop: 4, cursor: "pointer", fontSize: 13, color: "var(--ink-2)" }}>
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ accentColor: "var(--coral)" }} />
              <span>{t.share.anon}</span>
            </label>
          </div>
          <div className="row gap-8" style={{ marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>{t.share.cancel}</button>
            <button className="btn btn-coral" onClick={onPost}>↗ {t.share.post}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
