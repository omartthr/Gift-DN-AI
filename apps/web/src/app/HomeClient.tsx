"use client";

import Link from "next/link";
import { useI18n } from "@/store/i18nStore";
import styles from "./Home.module.css";

export default function HomeClient() {
  const { t } = useI18n();

  return (
    <div className={styles.home}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.orbs}>
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>
        <div className={`container ${styles.heroContent} animate-fade-in-up`}>
          <div className={styles.badge}>
            <span>✨</span>
            <span>AI Powered Gift Discovery</span>
          </div>
          <h1 className={styles.title}>
            {t.home.title}
            <br />
            <span className="gradient-text">Gift DN-AI</span>
          </h1>
          <p className={styles.subtitle}>{t.home.subtitle}</p>
          <div className={styles.actions}>
            <Link href="/quiz" className="btn btn-primary btn-lg">🎁 {t.home.cta}</Link>
            <Link href="/community" className="btn btn-secondary btn-lg">👀 {t.nav.community}</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className={`${styles.featuresGrid} stagger-children`}>
            {[
              { icon: "🤖", title: t.home.features.ai, desc: t.home.features.ai_desc },
              { icon: "🛍️", title: t.home.features.real, desc: t.home.features.real_desc },
              { icon: "💬", title: t.home.features.community, desc: t.home.features.community_desc },
            ].map((f, i) => (
              <div key={i} className={`card animate-fade-in-up ${styles.featureCard}`}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={`card-glass ${styles.ctaCard}`}>
            <h2>Hediyen hazır, sen değil misin?</h2>
            <p>3 dakikada mükemmel hediyeyi bul. Ücretsiz, hızlı ve kişisel.</p>
            <Link href="/quiz" className="btn btn-primary btn-lg">🚀 Şimdi Başla</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
