"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";

export default function AuthClient() {
  const { t, lang } = useI18n();
  const { signIn } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
    router.push(nextPath);  // ?next=/quiz varsa oraya dön
  };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="fade-up" style={{ background: "var(--cream)", borderRadius: 8, padding: "48px 56px", maxWidth: 520, width: "100%", border: "1px solid var(--rule)" }}>
        <div className="col gap-20">
          <div className="eyebrow">GIFT · DN-AI</div>
          <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {t.auth.title_a}<br />
            <span className="serif-italic" style={{ color: "var(--coral)" }}>{t.auth.title_b}</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{t.auth.sub}</p>

          <div className="col gap-12" style={{ marginTop: 8 }}>
            <input className="input" placeholder={t.auth.email} value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder={t.auth.pass} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }} />
            <button className="btn btn-coral btn-lg" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
              {loading ? <span className="dots"><span></span><span></span><span></span></span> : t.auth.cont}
            </button>

            <div className="row items-center gap-12" style={{ margin: "6px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }}></span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.auth.or.toUpperCase()}</span>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }}></span>
            </div>

            <button className="btn btn-bone btn-lg" onClick={handleSubmit} style={{ width: "100%", justifyContent: "center" }}>
              G  {t.auth.google}
            </button>
          </div>

          <div className="row gap-8" style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
            <span>{t.auth.noaccount}</span>
            <span style={{ color: "var(--coral)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
              onClick={() => setIsLogin(!isLogin)}>
              {t.auth.signup}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
