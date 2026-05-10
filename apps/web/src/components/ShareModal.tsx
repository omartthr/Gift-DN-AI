"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/store/i18nStore";
import type { GiftSuggestion } from "@/types";

interface Props {
  gift: GiftSuggestion;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShareModal({ gift, sessionId, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [feedback, setFeedback] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!user || !feedback.trim()) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from("community_posts").insert({
        user_id: user.id,
        session_id: sessionId,
        suggestion_id: gift.id,
        product_name: gift.product_name,
        product_image: gift.product_image,
        product_link: gift.product_link,
        feedback_text: feedback,
        recipient_label: recipientLabel,
        is_anonymous: isAnonymous,
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 24, fontWeight: 700 }}>📤 {t.community.share_modal_title}</h2>

        {gift.product_image && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <img src={gift.product_image} alt={gift.product_name} style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, background: "var(--color-surface-2)" }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{gift.product_name}</p>
              {gift.current_price && <p style={{ color: "var(--color-primary)", fontSize: "0.85rem" }}>{gift.current_price}</p>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="input" placeholder={t.community.recipient_placeholder} value={recipientLabel} onChange={e => setRecipientLabel(e.target.value)} />
          <textarea className="input textarea" placeholder={t.community.feedback_placeholder} value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} />
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            {t.community.share_anon}
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{t.common.cancel}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={!feedback.trim() || loading} onClick={handleShare}>
              {loading ? "..." : `📤 ${t.community.share_submit}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
