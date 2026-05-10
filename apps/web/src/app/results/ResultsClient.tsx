"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuizStore } from "@/store/quizStore";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/store/i18nStore";
import { getSupabaseClient } from "@/lib/supabase";
import type { GiftSuggestion } from "@/types";
import ShareModal from "@/components/ShareModal";
import styles from "./Results.module.css";

export default function ResultsClient() {
  const { t } = useI18n();
  const { gifts, session, reset } = useQuizStore();
  const { user } = useAuthStore();
  const [toast, setToast] = useState<string | null>(null);
  const [shareGift, setShareGift] = useState<GiftSuggestion | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addToWishlist = async (gift: GiftSuggestion) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    await supabase.from("wishlists").insert({
      user_id: user.id,
      product_name: gift.product_name,
      product_link: gift.product_link,
      product_image: gift.product_image,
    });
    showToast(t.results.added_wishlist);
  };

  if (!gifts.length) {
    return (
      <div className={styles.empty}>
        <p>Henüz sonuç yok.</p>
        <Link href="/quiz" className="btn btn-primary">Ankete Başla</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={`${styles.header} animate-fade-in-up`}>
          <h1 className="gradient-text">{t.results.title}</h1>
          <p>{t.results.subtitle(gifts.length)}</p>
        </div>

        <div className={`${styles.grid} stagger-children`}>
          {gifts.map(gift => (
            <div key={gift.id} className={`card animate-fade-in-up ${styles.giftCard}`}>
              <div className={styles.rankBadge}>
                {gift.rank === 1 ? "🥇" : gift.rank === 2 ? "🥈" : "🥉"}
                <span>{t.results.rank(gift.rank)}</span>
              </div>
              {gift.product_image && (
                <div className={styles.imageWrap}>
                  <img src={gift.product_image} alt={gift.product_name} className={styles.image} />
                </div>
              )}
              <div className={styles.content}>
                <h3 className={styles.productName}>{gift.product_name}</h3>
                <p className={styles.desc}>{gift.product_description}</p>
                {gift.current_price && (
                  <div className={styles.meta}>
                    <span className={styles.price}>{gift.current_price}</span>
                    {gift.source_store && <span className={styles.store}>{gift.source_store}</span>}
                  </div>
                )}
                <div className={styles.reasoning}>
                  <span className={styles.reasoningLabel}>💡 {t.results.why}</span>
                  <p>{gift.reasoning}</p>
                </div>
                <div className={styles.actions}>
                  {gift.product_link && (
                    <a href={gift.product_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      🛍️ {t.results.view_product}
                    </a>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => addToWishlist(gift)}>❤️ {t.results.add_wishlist}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShareGift(gift)}>📤 {t.results.share_community}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottomActions}>
          <button className="btn btn-secondary" onClick={reset}>🔄 Yeni Anket</button>
          <Link href="/community" className="btn btn-ghost">👀 Topluluğu Keşfet</Link>
        </div>
      </div>

      {shareGift && session && (
        <ShareModal gift={shareGift} sessionId={session.id} onClose={() => setShareGift(null)} onSuccess={() => { setShareGift(null); showToast("Toplulukla paylaşıldı! 🎉"); }} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
