"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { useWishlistStore, type WishlistRow } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import GradientText from "@/components/GradientText";

function StarRating({ value }: { value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <span style={{ position: "relative", display: "inline-block", fontSize: 14, letterSpacing: 1, lineHeight: 1 }} aria-label={`${value} / 5`}>
      <span style={{ color: "#D4C5B0" }}>★★★★★</span>
      <span style={{ position: "absolute", top: 0, left: 0, overflow: "hidden", width: `${pct}%`, color: "#F5A524", whiteSpace: "nowrap" }}>★★★★★</span>
    </span>
  );
}

function WishlistGallery({ item }: { item: WishlistRow }) {
  const thumbs: string[] = Array.isArray(item.thumbnails) ? item.thumbnails : [];
  const [active, setActive] = useState(item.product_image);
  const displayThumbs = thumbs.length > 1 ? thumbs.slice(0, 5) : [];
  const main = active || item.product_image;

  return (
    <div className="col gap-8">
      {main ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={main}
          alt={item.product_name}
          style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 8, background: "var(--bone)" }}
        />
      ) : (
        <ImagePlaceholder tone={item.tone || "sage"} label={item.product_name?.toUpperCase()} h={320} />
      )}
      {displayThumbs.length > 0 && (
        <div className="row gap-8 wrap">
          {displayThumbs.map((src, idx) => {
            const isActive = src === main;
            return (
              <button
                key={`${src}-${idx}`}
                onClick={() => setActive(src)}
                aria-label={`${item.product_name} ${idx + 1}`}
                style={{
                  width: 52,
                  height: 52,
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

export default function WishlistClient() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user } = useAuthStore();

  const items = useWishlistStore((s) => s.items);
  const loading = useWishlistStore((s) => s.loading);
  const fetchItems = useWishlistStore((s) => s.fetchItems);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const updateNote = useWishlistStore((s) => s.updateNote);
  const clearAll = useWishlistStore((s) => s.clearAll);

  const [toast, setToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Kullanıcı giriş yapmışsa DB'den çek
  useEffect(() => {
    if (user?.id) fetchItems(user.id);
  }, [user?.id, fetchItems]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleRemove = async (id: string) => {
    await removeItem(id);
    showToast(lang === "tr" ? "Listeden kaldırıldı" : "Removed from wishlist");
  };

  const handleClearAll = async () => {
    if (!user) return;
    await clearAll(user.id);
    setConfirmClear(false);
    showToast(lang === "tr" ? "İstek listesi temizlendi" : "Wishlist cleared");
  };

  // Note debounce — her tuşta DB'ye yazmamak için
  const [noteTimers, setNoteTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const handleNoteChange = (id: string, note: string) => {
    // Optimistic: store'da anında güncelle
    // (updateNote zaten optimistic, ama biz sadece debounce ile DB'ye yazıyoruz)
    if (noteTimers[id]) clearTimeout(noteTimers[id]);
    const timer = setTimeout(() => {
      updateNote(id, note);
    }, 600);
    setNoteTimers((prev) => ({ ...prev, [id]: timer }));

    // Store'daki anlık değişikliği de yansıt (optimistic)
    useWishlistStore.setState({
      items: items.map((w) => (w.id === id ? { ...w, note } : w)),
    });
  };

  const empty = items.length === 0;

  // Giriş yapmamış kullanıcı → giriş CTA
  if (!user) {
    return (
      <div className="fade-in">
        <div className="shell">
          <section style={{ padding: "56px 0 32px" }}>
            <div className="col gap-16" style={{ maxWidth: 760 }}>
              <div className="eyebrow">{t.wishlist.eyebrow}</div>
              <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {t.wishlist.title_a}<br />
                <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.wishlist.title_b}</GradientText>
              </h1>
            </div>
          </section>
          <hr className="rule" />
          <section style={{ padding: "40px 0 80px" }}>
            <div className="col gap-16 items-center text-center" style={{ padding: "60px 0" }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: "var(--bone)", border: "2px dashed var(--rule)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, color: "var(--muted-2)",
              }}>
                🔒
              </div>
              <p className="serif" style={{ fontSize: 32, lineHeight: 1.2, maxWidth: 520, marginTop: 16 }}>
                {lang === "tr" ? "İstek listene erişmek için giriş yap." : "Sign in to access your wishlist."}
              </p>
              <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 440 }}>
                {lang === "tr"
                  ? "Giriş yaptığında hediye önerilerini kaydedebilir ve her cihazdan erişebilirsin."
                  : "Sign in to save gift recommendations and access them from any device."}
              </p>
              <button className="btn btn-coral" onClick={() => router.push("/auth?next=/wishlist")} style={{ marginTop: 8 }}>
                {lang === "tr" ? "Giriş Yap" : "Sign In"} →
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Loading durumu
  if (loading && empty) {
    return (
      <div className="fade-in">
        <div className="shell">
          <section style={{ padding: "56px 0 32px" }}>
            <div className="col gap-16" style={{ maxWidth: 760 }}>
              <div className="eyebrow">{t.wishlist.eyebrow}</div>
              <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {t.wishlist.title_a}<br />
                <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.wishlist.title_b}</GradientText>
              </h1>
            </div>
          </section>
          <hr className="rule" />
          <section style={{ padding: "60px 0 80px" }}>
            <div className="col gap-16 items-center text-center">
              <span className="dots"><span /><span /><span /></span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>
                {lang === "tr" ? "İstek listen yükleniyor…" : "Loading your wishlist…"}
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 32px" }}>
          <div className="row justify-between items-end">
            <div className="col gap-16" style={{ maxWidth: 760 }}>
              <div className="eyebrow">{t.wishlist.eyebrow}</div>
              <h1 className="serif" style={{ fontSize: "clamp(52px, 7vw, 96px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {t.wishlist.title_a}<br />
                <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.wishlist.title_b}</GradientText>
              </h1>
            </div>
            <div className="col gap-8 items-end">
              {!empty && (
                <>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>
                    {items.length} {t.wishlist.items}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmClear(true)}
                    style={{ fontSize: 12, color: "var(--coral)" }}
                  >
                    {lang === "tr" ? "Tümünü temizle" : "Clear all"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <hr className="rule" />

        <section style={{ padding: "40px 0 80px" }}>
          {empty ? (
            <div className="col gap-16 items-center text-center" style={{ padding: "60px 0" }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: "var(--bone)", border: "2px dashed var(--rule)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, color: "var(--muted-2)",
              }}>
                ♡
              </div>
              <p className="serif" style={{ fontSize: 32, lineHeight: 1.2, maxWidth: 520, marginTop: 16 }}>{t.wishlist.empty_a}</p>
              <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 440 }}>{t.wishlist.empty_b}</p>
              <button className="btn btn-coral" onClick={() => router.push("/quiz")} style={{ marginTop: 8 }}>
                {t.wishlist.empty_cta} →
              </button>
            </div>
          ) : (
            <div className="col gap-24">
              {items.map((w, i) => (
                <div key={w.id} className="fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="row gap-32 wrap" style={{ alignItems: "stretch" }}>
                    {/* Product Gallery */}
                    <div style={{ flex: "0 0 340px" }}>
                      <WishlistGallery item={w} />
                    </div>

                    {/* Product Details */}
                    <div className="col gap-16" style={{ flex: 1, padding: "4px 0" }}>
                      {/* Title */}
                      <h2 className="serif" style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{w.product_name}</h2>

                      {/* Rating */}
                      {typeof w.rating === "number" && w.rating > 0 && (
                        <div className="row gap-6 items-center" style={{ marginTop: -4 }}>
                          <StarRating value={w.rating} />
                          <span className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>{w.rating.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Description */}
                      {w.product_description && (
                        <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, maxWidth: 560 }}>{w.product_description}</p>
                      )}

                      {/* AI Reasoning */}
                      {w.reasoning && (
                        <div className="card" style={{ padding: 18, background: "var(--cream-2)", border: "1px solid var(--rule)", maxWidth: 580 }}>
                          <div className="eyebrow" style={{ marginBottom: 8 }}>
                            {lang === "tr" ? "NEDEN BU HEDİYE" : "WHY THIS GIFT"}
                          </div>
                          <p className="serif-italic" style={{ fontSize: 16, lineHeight: 1.45, color: "var(--ink)" }}>"{w.reasoning}"</p>
                        </div>
                      )}

                      {/* Price / Store / Status */}
                      <div className="row gap-24 items-baseline" style={{ marginTop: 4 }}>
                        {w.current_price && (
                          <div className="col gap-4">
                            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                              {lang === "tr" ? "FİYAT" : "PRICE"}
                            </span>
                            <span className="serif" style={{ fontSize: 22 }}>{w.current_price}</span>
                          </div>
                        )}
                        {w.source_store && (
                          <div className="col gap-4">
                            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                              {lang === "tr" ? "MAĞAZA" : "SHOP"}
                            </span>
                            <span className="row gap-6 items-center" style={{ fontSize: 15 }}>
                              {w.source_icon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={w.source_icon}
                                  alt={w.source_store}
                                  style={{ width: 18, height: 18, borderRadius: 4, objectFit: "contain", background: "var(--bone)" }}
                                />
                              )}
                              <span>{w.source_store}</span>
                            </span>
                          </div>
                        )}
                        <div className="col gap-4">
                          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                            {lang === "tr" ? "DURUM" : "STATUS"}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--sage)" }}>● {lang === "tr" ? "Stokta" : "In stock"}</span>
                        </div>
                      </div>

                      {/* Note */}
                      <input
                        className="input"
                        style={{ fontSize: 14, fontStyle: "italic", color: "var(--muted)", maxWidth: 500 }}
                        placeholder={t.wishlist.note}
                        value={w.note || ""}
                        onChange={(e) => handleNoteChange(w.id, e.target.value)}
                      />

                      {/* Actions */}
                      <div className="row gap-8 items-center wrap" style={{ marginTop: 4 }}>
                        {w.product_link ? (
                          <a
                            className="btn btn-coral"
                            href={w.product_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t.wishlist.view} ↗
                          </a>
                        ) : (
                          <button
                            className="btn btn-coral"
                            disabled
                            style={{ opacity: 0.5, cursor: "not-allowed" }}
                          >
                            {t.wishlist.view} ↗
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemove(w.id)}
                          style={{ color: "var(--coral)" }}
                        >
                          × {t.wishlist.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                  {i < items.length - 1 && <hr className="rule-soft" style={{ marginTop: 32 }} />}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Clear All Confirmation Modal */}
      {confirmClear && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="card fade-up" style={{ padding: 32, maxWidth: 400, width: "90%", background: "var(--cream)", border: "1px solid var(--rule)", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.1)" }}>
            <h3 className="serif" style={{ fontSize: 24, marginBottom: 12, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {lang === "tr" ? "Emin misiniz?" : "Are you sure?"}
            </h3>
            <p style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.5 }}>
              {lang === "tr"
                ? "İstek listenizdeki tüm ürünler kaldırılacak. Bu işlem geri alınamaz."
                : "All items in your wishlist will be removed. This action cannot be undone."}
            </p>
            <div className="row gap-12 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>
                {lang === "tr" ? "Vazgeç" : "Cancel"}
              </button>
              <button className="btn btn-coral" onClick={handleClearAll}>
                {lang === "tr" ? "Temizle" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
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
