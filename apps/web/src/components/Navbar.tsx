"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/store/i18nStore";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleLang = () => setLang(lang === "tr" ? "en" : "tr");

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <span>🎁</span>
          <span className="gradient-text">Gift DN-AI</span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={`${styles.link} ${pathname === "/" ? styles.active : ""}`}>{t.nav.home}</Link>
          <Link href="/community" className={`${styles.link} ${pathname === "/community" ? styles.active : ""}`}>{t.nav.community}</Link>
          {user && (
            <Link href="/wishlist" className={`${styles.link} ${pathname === "/wishlist" ? styles.active : ""}`}>{t.nav.wishlist}</Link>
          )}
        </div>

        <div className={styles.actions}>
          <button className="btn btn-ghost btn-sm" onClick={toggleLang}>
            {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
          </button>
          {user ? (
            <>
              <Link href="/quiz" className="btn btn-primary btn-sm">🎁 {t.nav.quiz}</Link>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>{t.nav.logout}</button>
            </>
          ) : (
            <Link href="/auth" className="btn btn-primary btn-sm">{t.nav.login}</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
