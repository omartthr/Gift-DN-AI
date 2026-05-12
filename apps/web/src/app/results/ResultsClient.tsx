"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { GIFT_RESULTS, type GiftResult } from "@/lib/data";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import GradientText from "@/components/GradientText";

type WishlistItem = { name: string; store: string; tone: string; price: string; desc: string; note: string };

export default function ResultsClient() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const gifts: GiftResult[] = GIFT_RESULTS[lang] || GIFT_RESULTS["tr"];
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [shareGift, setShareGift] = useState<GiftResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const addToWishlist = (g: GiftResult) => {
    if (!wishlist.some(w => w.name === g.name)) {
      setWishlist(w => [...w, { name: g.name, store: g.store, tone: g.tone, price: g.price, desc: g.desc, note: "" }]);
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
            <button className="btn btn-bone btn-sm" onClick={() => router.push("/quiz")}>↻ {t.results.restart}</button>
          </div>
        </section>

        <hr className="rule" />

        <section style={{ padding: "32px 0 80px" }}>
          <div className="col gap-24">
            {gifts.map((g, i) => {
              const saved = wishlist.some(w => w.name === g.name);
              return (
                <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="row gap-32 wrap" style={{ alignItems: "stretch" }}>
                    <div style={{ flex: "0 0 380px" }}>
                      <ImagePlaceholder tone={g.tone} label={g.name.toUpperCase()} h={380} />
                    </div>
                    <div className="col gap-16" style={{ flex: 1, padding: "4px 0" }}>
                      <div className="row gap-12 items-baseline">
                        <GradientText className="serif" animationSpeed={3} style={{ fontSize: 48 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>0{g.rank}</GradientText>
                        <span className="eyebrow">{t.results.rank} · {g.rank}/3</span>
                      </div>
                      <h2 className="serif" style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{g.name}</h2>
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
                          <span style={{ fontSize: 16 }}>{g.store}</span>
                        </div>
                        <div className="col gap-4">
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.results.status}</span>
                          <span style={{ fontSize: 13, color: "var(--sage)" }}>● {g.stock}</span>
                        </div>
                      </div>

                      <div className="row gap-8 items-center wrap" style={{ marginTop: 16 }}>
                        <button className="btn btn-coral" onClick={() => window.open("about:blank", "_blank")}>{t.results.view} ↗</button>
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

function ShareModal({ gift, onClose, onPost }: { gift: GiftResult; onClose: () => void; onPost: () => void }) {
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
