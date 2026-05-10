"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/store/i18nStore";
import type { WishlistItem } from "@/types";
import styles from "./Wishlist.module.css";

export default function WishlistClient() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    supabase.from("wishlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        setItems(data);
        const map: Record<string, string> = {};
        data.forEach(i => { if (i.note) map[i.id] = i.note; });
        setNotes(map);
      }
      setLoading(false);
    });
  }, [user]);

  const removeItem = async (id: string) => {
    const supabase = getSupabaseClient();
    await supabase.from("wishlists").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveNote = async (id: string) => {
    const supabase = getSupabaseClient();
    await supabase.from("wishlists").update({ note: notes[id] || "" }).eq("id", id);
    setToast("Not kaydedildi!");
    setTimeout(() => setToast(null), 2000);
  };

  if (loading) return <div className={styles.loadingWrap}><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={`${styles.header} animate-fade-in-up`}>
          <h1 className="gradient-text">{t.wishlist.title}</h1>
        </div>

        {items.length === 0 ? (
          <div className={`${styles.empty} animate-fade-in-up`}>
            <span style={{ fontSize: "3rem" }}>🎁</span>
            <p>{t.wishlist.empty}</p>
            <Link href="/community" className="btn btn-primary">{t.wishlist.empty_cta}</Link>
          </div>
        ) : (
          <div className={`${styles.grid} stagger-children`}>
            {items.map(item => (
              <div key={item.id} className={`card animate-fade-in-up ${styles.itemCard}`}>
                {item.product_image && (
                  <div className={styles.imageWrap}>
                    <img src={item.product_image} alt={item.product_name || ""} className={styles.image} />
                  </div>
                )}
                <div className={styles.content}>
                  <h3 className={styles.productName}>{item.product_name}</h3>
                  <textarea
                    className="input textarea"
                    placeholder={t.wishlist.note_placeholder}
                    value={notes[item.id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className={styles.actions}>
                    {item.product_link && (
                      <a href={item.product_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">🛍️ {t.wishlist.view_product}</a>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => saveNote(item.id)}>💾 Not Kaydet</button>
                    <button className={`btn btn-ghost btn-sm ${styles.removeBtn}`} onClick={() => removeItem(item.id)}>🗑️ {t.wishlist.remove}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
