'use client';

import { useState } from 'react';
import { useI18n } from '@/store/i18nStore';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const PLAN_PRICE_ID = 'price_1TWMAGI2xgJzmCxZxUTCwbtf';

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { lang } = useI18n();
  const { profile } = useAuthStore();
  const isPro = profile?.subscription_status === 'active';

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      // Oturum token'ını client-side'dan al
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert(lang === 'tr' ? 'Lütfen önce giriş yapın.' : 'Please sign in first.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId: PLAN_PRICE_ID }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Ödeme başlatılamadı.');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Geçerli bir ödeme adresi alınamadı.');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Abonelik başlatılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = lang === 'tr' ? [
    "Sınırsız yapay zeka destekli hediye önerisi",
    "Detaylı kişilik ve analiz algoritmaları",
    "Gelecek özel günler için önceden hazırlık",
    "Öncelikli premium müşteri desteği",
    "Reklamsız ve kesintisiz deneyim"
  ] : [
    "Unlimited AI-powered gift suggestions",
    "Detailed personality & analysis algorithms",
    "Advanced preparation for upcoming events",
    "Priority premium customer support",
    "Ad-free & seamless experience"
  ];

  return (
    <div className="shell fade-in" style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* Header Section */}
      <div className="col items-center text-center fade-up" style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>GIFT DN-AI PREMIUM</div>
        <h1 className="serif" style={{ fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 700, marginBottom: 12 }}>
          {lang === 'tr' ? 'Sınırları kaldırın. En iyi hediyeyi her zaman bulun.' : 'Remove limits. Always find the perfect gift.'}
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 540, lineHeight: 1.5 }}>
          {lang === 'tr'
            ? 'Hediye bulma stresine son. Yapay zeka ile sevdikleriniz için nokta atışı öneriler almaya sınırsız şekilde devam edin.'
            : 'End the stress of finding gifts. Get endless, spot-on AI recommendations for your loved ones.'}
        </p>
      </div>

      {/* Pricing Card or Active Subscription Message */}
      {isPro ? (
        <div className="fade-up stagger-2" style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              maxWidth: 600,
              width: "100%",
              padding: "48px",
              background: "var(--bone)",
              borderRadius: 20,
              border: "1px solid var(--rule)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #F95738, #FF9F1C)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 12 }}>
                {lang === 'tr' ? 'Harika! Zaten Premium Üyesiniz.' : 'Awesome! You are already Premium.'}
              </h2>
              <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.5 }}>
                {lang === 'tr'
                  ? 'Gift DN-AI Pro ayrıcalıklarından sınırsız şekilde yararlanabilirsiniz. Hediyelerinizi bulmaya devam edin.'
                  : 'You can enjoy unlimited Gift DN-AI Pro features. Keep finding the perfect gifts.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-up stagger-2" style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              maxWidth: 860,
              width: "100%",
              padding: "48px",
              position: "relative",
              border: "2px solid var(--coral)",
              boxShadow: "0 24px 60px -12px rgba(217, 74, 41, 0.15)",
              background: "var(--bone)",
              borderRadius: 20,
              overflow: "visible",
              display: "flex",
              flexDirection: "row",
              gap: "48px",
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            {/* Badge */}
            <div
              className="eyebrow"
              style={{
                position: "absolute",
                top: -12,
                left: 48,
                background: "linear-gradient(to right, #5A0F0F, #8F2C0E, #C44900, #5A0F0F)",
                backgroundSize: "200% 100%",
                animation: "gradientMove 3s linear infinite",
                color: "white",
                padding: "4px 14px",
                borderRadius: 999,
                letterSpacing: "0.1em",
                fontSize: 10,
                whiteSpace: "nowrap",
                zIndex: 10
              }}
            >
              {lang === 'tr' ? 'EN ÇOK TERCİH EDİLEN' : 'MOST POPULAR'}
            </div>

            {/* Left Column: Features */}
            <div className="col" style={{ flex: "1 1 360px" }}>
              <h2 className="serif" style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 24 }}>Gift DN-AI Pro</h2>

              <ul className="col gap-16" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {features.map((feature, i) => (
                  <li key={i} className="row items-start gap-12">
                    <div style={{
                      background: "var(--cream-2)",
                      color: "var(--coral)",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, lineHeight: 1.4, color: "var(--ink-2)" }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider (visible only on wide screens) */}
            <div style={{ width: 1, height: "100%", minHeight: 200, background: "var(--rule)", opacity: 0.6 }} className="hide-on-mobile"></div>

            {/* Right Column: Price & Action */}
            <div className="col items-center text-center" style={{ flex: "1 1 240px", padding: "12px 0" }}>
              <div className="row items-baseline justify-center gap-4" style={{ marginBottom: 8 }}>
                <span className="serif" style={{ fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em" }}>$2.99</span>
                <span style={{ color: "var(--muted)", fontSize: 16 }}>/ {lang === 'tr' ? 'ay' : 'month'}</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>
                {lang === 'tr' ? 'İstediğiniz zaman iptal edebilirsiniz.' : 'Cancel anytime.'}
              </p>

              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="btn btn-coral"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "16px 24px",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px -6px rgba(217, 74, 41, 0.4)"
                }}
              >
                {isLoading
                  ? (lang === 'tr' ? 'Yönlendiriliyor...' : 'Redirecting...')
                  : (lang === 'tr' ? 'Hemen Abone Ol' : 'Subscribe Now')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges / Info */}
      <div className="row justify-center gap-24 wrap" style={{ marginTop: 32, opacity: 0.6 }}>
        <div className="row items-center gap-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.05em" }}>{lang === 'tr' ? 'GÜVENLİ ÖDEME' : 'SECURE PAYMENT'}</span>
        </div>
        <div className="row items-center gap-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 14 14"></polyline></svg>
          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.05em" }}>{lang === 'tr' ? 'ANINDA AKTİVASYON' : 'INSTANT ACTIVATION'}</span>
        </div>
      </div>
    </div>
  );
}
