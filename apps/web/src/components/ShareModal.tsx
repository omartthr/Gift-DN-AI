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
  const { t, lang } = useI18n();
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
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(27,22,17,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up"
        style={{ background: "var(--cream)", borderRadius: 8, padding: "40px 48px", maxWidth: 560, width: "100%", border: "1px solid var(--rule)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: 0, fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>×</button>
        <div className="col gap-20">
          <div className="eyebrow">{t.share.title.toUpperCase()}</div>
          <h2 className="serif" style={{ fontSize: 28, lineHeight: 1.1 }}>{gift.product_name}</h2>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.share.sub}</p>
          <div className="col gap-12">
            <div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.share.recipient}</span>
              <input className="input" value={recipientLabel} onChange={e => setRecipientLabel(e.target.value)} />
            </div>
            <div>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{t.share.feedback}</span>
              <textarea className="input" rows={3} style={{ resize: "none", borderBottom: "1px solid var(--rule)" }}
                placeholder={lang === "tr" ? "Hediye nasıl karşılandı?" : "How was it received?"}
                value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
            <label className="row gap-8 items-center" style={{ marginTop: 4, cursor: "pointer", fontSize: 13, color: "var(--ink-2)" }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ accentColor: "var(--coral)" }} />
              <span>{t.share.anon}</span>
            </label>
          </div>
          <div className="row gap-8" style={{ marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>{t.share.cancel}</button>
            <button className="btn btn-coral" disabled={!feedback.trim() || loading} onClick={handleShare}>
              {loading ? <span className="dots"><span></span><span></span><span></span></span> : `↗ ${t.share.post}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
