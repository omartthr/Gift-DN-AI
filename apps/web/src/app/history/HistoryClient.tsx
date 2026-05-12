"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";
import { getSupabaseClient } from "@/lib/supabase";
import type { QuizSession, GiftSuggestion } from "@/types";
import TiltedCard from "@/components/TiltedCard";
import GradientText from "@/components/GradientText";

export default function HistoryClient() {
  const { lang } = useI18n();
  const { user } = useAuthStore();
  
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSession, setSelectedSession] = useState<QuizSession | null>(null);
  const [gifts, setGifts] = useState<GiftSuggestion[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSessions(data);
        if (data.length > 0) {
          handleSelectSession(data[0]);
        }
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  const handleSelectSession = async (session: QuizSession) => {
    setSelectedSession(session);
    setGiftsLoading(true);
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("gift_suggestions")
      .select("*")
      .eq("session_id", session.id)
      .order("rank", { ascending: true });

    if (!error && data) {
      setGifts(data);
    }
    setGiftsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="shell fade-in" style={{ paddingTop: 80 }}>
        <div className="col items-center text-center gap-16">
          <h1 className="serif" style={{ fontSize: 36 }}>{lang === 'tr' ? 'Geçmiş Sohbetler' : 'History'}</h1>
          <p style={{ color: "var(--ink-2)" }}>
            {lang === 'tr' 
              ? 'Geçmiş hediye aramalarınızı görmek için lütfen giriş yapın.' 
              : 'Please sign in to view your past gift searches.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell fade-in" style={{ paddingTop: 64, paddingBottom: 80 }}>
      <div className="row justify-between items-end" style={{ marginBottom: 40 }}>
        <div className="col gap-8">
          <h1 className="serif" style={{ fontSize: 44, letterSpacing: "-0.02em" }}>
            {lang === "tr" ? "Geçmiş" : "History"} <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{lang === "tr" ? "Aramalarınız." : "Searches."}</GradientText>
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 16 }}>
            {lang === "tr" ? "Eski sohbetleriniz ve AI hediye önerileriniz burada tutulur." : "Your past chats and AI gift suggestions are kept here."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mono" style={{ color: "var(--muted)" }}>{lang === "tr" ? "Yükleniyor..." : "Loading..."}</div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", background: "var(--bone)" }}>
          <p className="serif" style={{ fontSize: 20, color: "var(--ink-2)" }}>
            {lang === "tr" ? "Henüz tamamlanmış bir hediye aramanız yok." : "You have no completed gift searches yet."}
          </p>
        </div>
      ) : (
        <div className="row gap-48 wrap" style={{ alignItems: "flex-start" }}>
          
          {/* Left: Sessions List */}
          <div className="col gap-12" style={{ flex: "1 1 300px", maxWidth: 360 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{lang === "tr" ? "TÜM SOHBETLER" : "ALL CHATS"}</div>
            
            <div className="col gap-8" style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto", paddingRight: 8 }}>
              {sessions.map(s => {
                const isActive = selectedSession?.id === s.id;
                const recips = s.initial_chips?.recipients?.join(", ") || (lang === 'tr' ? 'Bilinmeyen' : 'Unknown');
                const budget = s.initial_chips?.budget || '';
                
                return (
                  <div 
                    key={s.id} 
                    onClick={() => handleSelectSession(s)}
                    style={{ 
                      padding: "16px", 
                      background: isActive ? "var(--cream-2)" : "var(--bone)",
                      border: isActive ? "1px solid var(--coral)" : "1px solid var(--rule)",
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div className="row justify-between items-start" style={{ marginBottom: 8 }}>
                      <span className="serif" style={{ fontSize: 18, color: isActive ? "var(--coral)" : "var(--ink)", fontWeight: isActive ? 600 : 400 }}>
                        {recips}
                      </span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{formatDate(s.created_at)}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{budget}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Gifts Detail */}
          <div className="col gap-24" style={{ flex: "2 1 400px" }}>
            {selectedSession && (
              <>
                <div className="eyebrow" style={{ marginBottom: -12 }}>
                  {lang === "tr" ? "ÖNERİLEN HEDİYELER" : "SUGGESTED GIFTS"}
                </div>
                
                {giftsLoading ? (
                  <div className="mono" style={{ color: "var(--muted)" }}>{lang === "tr" ? "Hediyeler yükleniyor..." : "Loading gifts..."}</div>
                ) : gifts.length === 0 ? (
                  <div className="card" style={{ padding: 32, background: "var(--bone)" }}>
                    <p style={{ color: "var(--ink-2)" }}>{lang === "tr" ? "Bu sohbette kayıtlı hediye bulunamadı." : "No gifts found in this chat."}</p>
                  </div>
                ) : (
                  <div className="col gap-16">
                    {gifts.map((g, idx) => (
                      <TiltedCard key={g.id} scaleOnHover={1.01} rotateAmplitude={2}>
                        <div className="card row gap-20 wrap items-start" style={{ padding: 24, background: "var(--bone)" }}>
                          {g.product_image ? (
                            <div style={{ width: 120, height: 120, borderRadius: 8, background: `url(${g.product_image}) center/cover`, flexShrink: 0 }}></div>
                          ) : (
                            <div style={{ width: 120, height: 120, borderRadius: 8, background: "var(--cream-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>NO IMAGE</span>
                            </div>
                          )}
                          
                          <div className="col gap-8" style={{ flex: 1, minWidth: 200 }}>
                            <div className="row justify-between items-start">
                              <h3 className="serif" style={{ fontSize: 22, lineHeight: 1.2 }}>{g.product_name}</h3>
                              <span className="mono" style={{ fontSize: 16, color: "var(--coral)", fontWeight: 600 }}>{g.current_price}</span>
                            </div>
                            
                            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                              {g.reasoning}
                            </p>
                            
                            <div className="row justify-between items-center" style={{ marginTop: 8 }}>
                              <span className="mono" style={{ fontSize: 11, background: "var(--cream-2)", padding: "4px 8px", borderRadius: 4 }}>
                                {g.source_store}
                              </span>
                              <a href={g.product_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                                {lang === "tr" ? "Mağazaya Git" : "Go to Store"} →
                              </a>
                            </div>
                          </div>
                        </div>
                      </TiltedCard>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
