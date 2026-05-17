"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";
import GradientText from "@/components/GradientText";

export default function AuthClient() {
  const { t, lang } = useI18n();
  const { signIn, signInWithGoogle } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      // signIn başarılıysa user store'da set edilmiş olacak
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(nextPath);
      } else {
        setError(lang === "tr" ? "E-posta veya şifre hatalı." : "Invalid email or password.");
      }
    } catch {
      setError(lang === "tr" ? "Bir hata oluştu, tekrar deneyin." : "Something went wrong, try again.");
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fade-up" style={{ background: "var(--cream)", borderRadius: 8, padding: "48px 56px", maxWidth: 520, width: "100%", border: "1px solid var(--rule)" }}>
        <div className="col gap-20">
          <div className="eyebrow">GIFT · DN-AI</div>
          <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {t.auth.title_a}<br />
            <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.auth.title_b}</GradientText>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{t.auth.sub}</p>

          <div className="col gap-12" style={{ marginTop: 8 }}>
            <input className="input" placeholder={t.auth.email} value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
            <input className="input" type="password" placeholder={t.auth.pass} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }} />

            {error && (
              <p style={{ fontSize: 13, color: "var(--coral)", margin: 0, padding: "4px 0" }}>{error}</p>
            )}

            <button className="btn btn-coral btn-lg" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
              {loading ? <span className="dots"><span></span><span></span><span></span></span> : t.auth.cont}
            </button>

            <div className="row items-center gap-12" style={{ margin: "6px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }}></span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.auth.or.toUpperCase()}</span>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }}></span>
            </div>

            <button className="btn btn-bone btn-lg" onClick={signInWithGoogle} style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.auth.google}
            </button>
          </div>

          <div className="row gap-8" style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
            <span>{t.auth.noaccount}</span>
            <GradientText onClick={() => setIsLogin(!isLogin)} animationSpeed={3} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
              {t.auth.signup}
            </GradientText>
          </div>
        </div>
      </div>
    </div>
  );
}

