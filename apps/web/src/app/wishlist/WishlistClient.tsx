"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { TONE_BG } from "@/lib/data";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import GradientText from "@/components/GradientText";

type WishlistItem = { name: string; store: string; tone: string; price: string; desc: string; note: string };

const MOCK_WISHLIST: WishlistItem[] = [];

export default function WishlistClient() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>(MOCK_WISHLIST);
  const empty = !wishlist.length;

  const updateNote = (i: number, note: string) => setWishlist(wishlist.map((w, idx) => idx === i ? { ...w, note } : w));
  const remove = (i: number) => setWishlist(wishlist.filter((_, idx) => idx !== i));

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 32px" }}>
          <div className="row justify-between items-end">
            <div className="col gap-16" style={{ maxWidth: 760 }}>
              <div className="eyebrow">{t.wishlist.eyebrow}</div>
              <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {t.wishlist.title_a}<br />
                <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{t.wishlist.title_b}</GradientText>
              </h1>
            </div>
            {!empty && (
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>
                {wishlist.length} {t.wishlist.items}
              </span>
            )}
          </div>
        </section>

        <hr className="rule" />

        <section style={{ padding: "40px 0 80px" }}>
          {empty ? (
            <div className="col gap-16 items-center text-center" style={{ padding: "60px 0" }}>
              <ImagePlaceholder tone="cream" label="EMPTY · NOTHING YET" h={180} style={{ width: 280 }} />
              <p className="serif" style={{ fontSize: 32, lineHeight: 1.2, maxWidth: 520, marginTop: 16 }}>{t.wishlist.empty_a}</p>
              <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 440 }}>{t.wishlist.empty_b}</p>
              <button className="btn btn-coral" onClick={() => router.push("/quiz")} style={{ marginTop: 8 }}>
                {t.wishlist.empty_cta} →
              </button>
            </div>
          ) : (
            <div className="col gap-20">
              {wishlist.map((w, i) => (
                <div key={i} className="row gap-24 fade-up" style={{ alignItems: "stretch", padding: "20px", background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 6 }}>
                  <div style={{ flex: "0 0 180px" }}>
                    <ImagePlaceholder tone={w.tone || "sage"} label={w.name.toUpperCase()} h={160} />
                  </div>
                  <div className="col gap-8" style={{ flex: 1 }}>
                    <div className="row items-baseline gap-12">
                      <h3 className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>{w.name}</h3>
                      {w.price && <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{w.price}</span>}
                    </div>
                    {w.store && <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{w.store}</span>}
                    {w.desc && <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 540 }}>{w.desc}</p>}
                    <input className="input" style={{ fontSize: 14, marginTop: 8, fontStyle: "italic", color: "var(--muted)" }}
                      placeholder={t.wishlist.note} value={w.note || ""} onChange={e => updateNote(i, e.target.value)} />
                    <div className="row gap-8" style={{ marginTop: 8 }}>
                      <button className="btn btn-bone btn-sm" onClick={() => window.open("about:blank", "_blank")}>{t.wishlist.view} ↗</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(i)}>× {t.wishlist.remove}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
