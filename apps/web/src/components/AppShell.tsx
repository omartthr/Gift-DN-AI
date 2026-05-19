"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useI18n } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";
import { useQuizStore } from "@/store/quizStore";
import GradientText from "@/components/GradientText";

function Icon({ name }: { name: string }) {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home": return <svg {...props}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>;
    case "discover": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>;
    case "community": return <svg {...props}><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M14 18c.3-1.8 2-3 4-3s3 1 3 2.5"/></svg>;
    case "wishlist": return <svg {...props}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    case "history": return <svg {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
    case "star": return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "globe": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    default: return null;
  }
}

interface AppShellProps { children: React.ReactNode; }

export default function AppShell({ children }: AppShellProps) {
  const { t, lang, setLang, initLang } = useI18n();
  const { user, profile, signOut } = useAuthStore();
  const resetQuiz = useQuizStore((s) => s.reset);
  const pathname = usePathname();
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | false>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mobil drawer açıkken sayfa scroll'unu kilitle
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Sayfa değişince mobil drawer'ı kapat
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    resetQuiz();
    await signOut();
    router.push("/");
  };

  useEffect(() => {
    initLang();
  }, [initLang]);

  const items = [
    { k: "/",          icon: "home",      label: t.nav.home },
    { k: "/quiz",      icon: "discover",  label: t.nav.discover },
    { k: "/community", icon: "community", label: t.nav.community },
    { k: "/wishlist",  icon: "wishlist",  label: t.nav.wishlist },
    { k: "/history",   icon: "history",   label: lang === "tr" ? "Geçmiş" : "History" },
    { k: "/pricing",   icon: "star",      label: "Premium" },
  ];

  const isActive = (k: string) => {
    if (k === "/") return pathname === "/";
    return pathname.startsWith(k);
  };

  return (
    <>
      {/* Mobile hamburger — sadece <=880px görünür */}
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="Menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(v => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {mobileOpen ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M3 7h18" />
              <path d="M3 12h18" />
              <path d="M3 17h18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="leftrail-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Left Rail */}
      <div
        className={"leftrail" + (hover ? " expanded" : "") + (mobileOpen ? " open" : "")}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Link href="/" className="lr-brand" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="lr-brand-glyph">G</div>
          <div className="lr-brand-text">Gift<GradientText className="dnai" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>DN-AI</GradientText></div>
        </Link>

        <div className="lr-items">
          {items.map(it => (
            <Link key={it.k} href={it.k} className={"lr-item" + (isActive(it.k) ? " active" : "")} title={it.label}>
              <span className="lr-icon"><Icon name={it.icon} /></span>
              <span className="lr-label">{it.label}</span>
            </Link>
          ))}
        </div>

        <div className="lr-foot">
          <button className="lr-item" onClick={() => setLang(lang === "tr" ? "en" : "tr")} title="Language" style={{ border: 0 }}>
            <span className="lr-icon"><Icon name="globe" /></span>
            <span className="lr-label">{lang === "tr" ? "Türkçe" : "English"}</span>
          </button>
          {user ? (
            <button className="lr-item" onClick={() => setShowLogoutConfirm(true)} title={t.nav.logout} style={{ border: 0 }}>
              <span className="lr-icon" style={{ width: 22, height: 22, background: "#5A0F0F", color: "var(--bone)", borderRadius: "50%", fontSize: 11, fontFamily: "JetBrains Mono", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {user.email?.[0]?.toUpperCase() || "U"}
              </span>
              <span className="lr-label" style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                {user.email?.split("@")[0]}
                {profile?.subscription_status === "active" && (
                  <span style={{
                    background: "linear-gradient(90deg, #5A0F0F, #C44900)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>PRO</span>
                )}
              </span>
            </button>
          ) : (
            <div className="lr-item lr-signin" title={t.nav.signin} style={{ border: 0, padding: "11px 13px" }}>
              <span className="lr-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 4v16"/>
                </svg>
              </span>
              <span className="lr-label" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span onClick={() => setAuthMode("signin")} style={{ cursor: "pointer" }}>{lang === "tr" ? "Giriş Yap" : "Sign in"}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <GradientText onClick={() => setAuthMode("signup")} animationSpeed={3} style={{ cursor: "pointer" }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{lang === "tr" ? "Kayıt Ol" : "Sign up"}</GradientText>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="layout-with-rail">
        {children}

        {/* Footer */}
        <div className="shell">
          <div className="footer">
            <div className="col gap-8">
              <div className="eyebrow">GIFT DN-AI · {lang === "tr" ? "BİR YAPAY ZEKA HEDİYE EDİTÖRÜ" : "AN AI GIFT EDITOR"}</div>
              <div className="serif" style={{ fontSize: 18, color: "var(--ink)" }}>{lang === "tr" ? "Hediye arama. Hikayesini anlat, biz bulalım." : "Don't search for a gift. Tell the story, we'll find it."}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {authMode && <AuthModalInline initialMode={authMode} onClose={() => setAuthMode(false)} />}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div
          className="fade-in"
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(27,22,17,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-up"
            style={{ background: "var(--cream)", borderRadius: 8, padding: "40px 48px", maxWidth: 420, width: "100%", border: "1px solid var(--rule)", position: "relative" }}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: 0, fontSize: 18, cursor: "pointer", color: "var(--muted)" }}
            >×</button>
            <div className="col gap-20">
              <div className="eyebrow">GIFT · DN-AI</div>
              <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {lang === "tr" ? "Çıkış Yap" : "Sign Out"}
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
                {lang === "tr"
                  ? "Oturumunuzu kapatmak istediğinizden emin misiniz? Mevcut quiz oturumunuz sıfırlanacaktır."
                  : "Are you sure you want to sign out? Your current quiz session will be reset."}
              </p>
              <div className="row gap-12" style={{ marginTop: 8 }}>
                <button
                  className="btn btn-bone btn-lg"
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {lang === "tr" ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  className="btn btn-coral btn-lg"
                  onClick={handleLogout}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {lang === "tr" ? "Çıkış Yap" : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AuthModalInline({ initialMode, onClose }: { initialMode: "signin" | "signup"; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { signIn, signUp, signInWithGoogle } = useAuthStore();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth = async () => {
    if (!email || !pass) return;
    setErrorMsg("");
    if (isSignUp) {
      if (!firstName || !lastName) return;
      const fullName = `${firstName} ${lastName}`.trim();
      if (signUp) {
        const { error } = await signUp(email, pass, fullName);
        if (error) {
          setErrorMsg(lang === "tr" ? "Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin." : "Sign up failed. Please check your details.");
          return;
        }
      }
    } else {
      const { error } = await signIn(email, pass);
      if (error) {
        setErrorMsg(lang === "tr" ? "E-posta veya şifre yanlış" : "Email or password incorrect");
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(27,22,17,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up"
        style={{ background: "var(--cream)", borderRadius: 8, padding: "48px 56px", maxWidth: 520, width: "100%", border: "1px solid var(--rule)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 22, background: "transparent", border: 0, fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>×</button>
        <div className="col gap-20">
          <div className="eyebrow">GIFT · DN-AI</div>
          <h2 className="serif" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {isSignUp ? (lang === "tr" ? "Hesap Oluştur" : "Create Account") : t.auth.title_a}<br />
            {!isSignUp && <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.auth.title_b}</GradientText>}
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
            {isSignUp 
              ? (lang === "tr" ? "Yapay zeka ile kişiselleştirilmiş hediye önerileri için aramıza katıl." : "Join us for AI-personalized gift recommendations.")
              : t.auth.sub}
          </p>
          <div className="col gap-12" style={{ marginTop: 8 }}>
            {isSignUp && (
              <div className="row gap-12">
                <input className="input" placeholder={lang === "tr" ? "Ad" : "First Name"} value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input className="input" placeholder={lang === "tr" ? "Soyad" : "Last Name"} value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            )}
            <input className="input" placeholder={t.auth.email} value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(""); }} />
            <input className="input" type="password" placeholder={t.auth.pass} value={pass} onChange={e => { setPass(e.target.value); setErrorMsg(""); }} />
            {errorMsg && (
              <div style={{ color: "var(--coral)", fontSize: 13, marginTop: -4 }}>{errorMsg}</div>
            )}
            <button className="btn btn-coral btn-lg" onClick={handleAuth} style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
              {isSignUp ? (lang === "tr" ? "Kayıt Ol" : "Sign Up") : t.auth.cont}
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
          <div className="row gap-8 items-center" style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
            <span>{isSignUp ? (lang === "tr" ? "Zaten hesabın var mı?" : "Already have an account?") : t.auth.noaccount}</span>
            <GradientText onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }} animationSpeed={3} style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
              {isSignUp ? (lang === "tr" ? "Giriş Yap" : "Sign In") : t.auth.signup}
            </GradientText>
          </div>
        </div>
      </div>
    </div>
  );
}
