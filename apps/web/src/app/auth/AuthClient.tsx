"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { useI18n } from "@/store/i18nStore";
import styles from "./Auth.module.css";

export default function AuthClient() {
  const { t } = useI18n();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div className={styles.page}>
      <div className={`card-glass animate-scale-in ${styles.card}`}>
        <div className={styles.logo}>
          <span>🎁</span>
          <span className="gradient-text">Gift DN-AI</span>
        </div>

        <h1 className={styles.title}>{isLogin ? t.auth.login_title : t.auth.register_title}</h1>

        <button className={`btn btn-secondary ${styles.googleBtn}`} onClick={handleGoogle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="G" />
          {t.auth.google}
        </button>

        <div className={styles.divider}><span>veya</span></div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <input className="input" type="text" placeholder={t.auth.name} value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input className="input" type="email" placeholder={t.auth.email} value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder={t.auth.password} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <p className={styles.error}>{error}</p>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "..." : isLogin ? t.auth.login : t.auth.register}
          </button>
        </form>

        <button className={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? t.auth.no_account : t.auth.has_account}
        </button>
      </div>
    </div>
  );
}
