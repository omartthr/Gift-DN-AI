"use client";

import Link from "next/link";
import { useI18n } from "@/store/i18nStore";
import { useAuthStore } from "@/store/authStore";
import { TONE_BG, COMMUNITY_FEED } from "@/lib/data";
import Carousel from "@/components/Carousel";
import TiltedCard from "@/components/TiltedCard";
import GradientText from "@/components/GradientText";

function ImagePlaceholder({ tone = "sage", label, h = 240, style = {} }: { tone?: string; label?: string; h?: number; style?: React.CSSProperties }) {
  return (
    <div className="placeholder-image" style={{ background: TONE_BG[tone] || tone, height: h, ...style }}>
      {label && <span className="label">{label}</span>}
    </div>
  );
}

export default function HomeClient() {
  const { t, lang } = useI18n();
  const { profile } = useAuthStore();
  const isPro = profile?.subscription_status === 'active';

  const sampleGifts = [
    { tone: "sage", name: lang === "tr" ? "El Yapımı Çay Seti" : "Handmade Tea Set", price: "₺ 1.480", store: lang === "tr" ? "İlbey Atölye" : "İlbey Atelier" },
    { tone: "rose", name: lang === "tr" ? "Yün Battaniye" : "Wool Blanket", price: "₺ 2.250", store: "Karya" },
    { tone: "clay", name: lang === "tr" ? "Şiir Antolojisi" : "Poetry Anthology", price: "₺ 680", store: lang === "tr" ? "Hazan Sahaf" : "Hazan Books" },
  ];

  const featuredPosts = COMMUNITY_FEED.slice(0, 3);

  const carouselItems = sampleGifts.map((g, i) => ({
    id: i,
    render: () => (
      <>
        <ImagePlaceholder tone={g.tone} label={g.name.toUpperCase()} h={170} />
        <div className="col gap-4" style={{ padding: "14px 14px 16px" }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>{g.store} · 0{i + 1}/3</div>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.2 }}>{g.name}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4 }}>{g.price}</div>
        </div>
      </>
    )
  }));

  return (
    <div className="fade-in">
      <div className="shell" style={{ paddingTop: 48, paddingBottom: 56 }}>

        {/* HERO */}
        <section style={{ paddingBottom: 64 }}>
          <div className="row gap-12 items-center" style={{ marginBottom: 24 }}>
            <span className="eyebrow">{t.landing.eyebrow}</span>
            <span style={{ width: 24, height: 1, background: "var(--rule)" }}></span>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>v0.4 · PROTOTYPE</span>
          </div>

          <h1 className="serif" style={{ fontSize: "clamp(48px, 6.2vw, 92px)", lineHeight: 1.04, letterSpacing: "-0.02em", maxWidth: 820 }}>
            {t.landing.h1_a} <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{t.landing.h1_b}</GradientText> {t.landing.h1_c}
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 580, marginTop: 24 }}>{t.landing.sub}</p>

          <div className="row gap-12 items-center wrap" style={{ marginTop: 28 }}>
            <Link href="/quiz" className="btn btn-coral btn-lg">
              {t.landing.cta_start} →
            </Link>
            <Link href="/community" className="btn btn-ghost btn-sm">
              {t.landing.cta_explore} →
            </Link>
          </div>
        </section>

        <hr className="rule" />

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 0" }}>
          <div className="eyebrow" style={{ marginBottom: 28 }}>
            {lang === "tr" ? "NASIL ÇALIŞIR · 3 ADIM" : "HOW IT WORKS · 3 STEPS"}
          </div>
          <div className="row gap-32 wrap">
            {[
              { n: "01", eye: t.landing.step1_eye.split("·")[1]?.trim(), body: t.landing.step1, desc: lang === "tr" ? "Kime ve ne bütçeyle. İki saniye." : "Who for, what budget. Two seconds." },
              { n: "02", eye: t.landing.step2_eye.split("·")[1]?.trim(), body: t.landing.step2, desc: lang === "tr" ? "Beş ila yedi soru. Tarz, ilgi, geçmiş hediyeler." : "Five to seven questions. Style, interests, past gifts." },
              { n: "03", eye: t.landing.step3_eye.split("·")[1]?.trim(), body: t.landing.step3, desc: lang === "tr" ? "AI gerekçesi ve gerçek mağaza linkleriyle." : "With AI reasoning and real shop links." },
            ].map((s, i) => (
              <div key={i} className="col gap-12" style={{ flex: "1 1 220px" }}>
                <div className="row items-baseline gap-12">
                  <GradientText className="serif" animationSpeed={3} style={{ fontSize: 36 }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{s.n}</GradientText>
                  <span className="eyebrow">{s.eye}</span>
                </div>
                <div className="serif" style={{ fontSize: 24, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{s.body}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" />

        {/* EXAMPLE PREVIEW */}
        <section style={{ padding: "56px 0" }}>
          <div className="row gap-32 wrap" style={{ alignItems: "flex-start" }}>
            <div className="col gap-16" style={{ flex: "1 1 280px" }}>
              <div className="eyebrow">{lang === "tr" ? "ÖRNEK SONUÇ" : "SAMPLE RESULT"}</div>
              <h2 className="serif" style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                {lang === "tr"
                  ? <>{`Üç hediye, `}<GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>gerçek mağazalardan.</GradientText></>
                  : <>{`Three gifts, `}<GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>from real shops.</GradientText></>}
              </h2>
              <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 460 }}>
                {lang === "tr"
                  ? "Her öneri AI'ın akıl yürütmesi, gerçek bir fiyat ve gerçek bir mağaza linkiyle birlikte gelir. Yorgunluk yok."
                  : "Each suggestion comes with AI reasoning, a real price, and a real shop link. No fatigue."}
              </p>
            </div>
            <div style={{ flex: "2 1 360px", display: "flex", justifyContent: "flex-end" }}>
              <Carousel items={carouselItems} baseWidth={400} autoplay={true} autoplayDelay={3000} loop={true} />
            </div>
          </div>
        </section>

        <hr className="rule" />

        {/* PREMIUM TEASER */}
        {!isPro && (
          <>
            <section style={{ padding: "80px 0" }}>
              <div className="row gap-48 wrap" style={{ alignItems: "center" }}>
                <div className="col gap-16" style={{ flex: "1 1 320px" }}>
                  <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 32, height: 1, background: "var(--coral)" }}></span>
                    GIFT DN-AI PREMIUM
                  </div>
                  <h2 className="serif" style={{ fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                    {lang === "tr" ? "Yapay zekanın tam" : "Unlock the full"} <br />
                    <GradientText className="serif-italic" animationSpeed={3} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
                      {lang === "tr" ? "potansiyelini açın." : "potential of AI."}
                    </GradientText>
                  </h2>
                </div>
                <div className="col gap-24" style={{ flex: "1 1 320px" }}>
                  <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 440 }}>
                    {lang === "tr" 
                      ? "Ücretsiz planda hediye arama hakkınız sınırlıdır. Premium ile sevdikleriniz için sınırsız öneri alabilir, kişilik analizleri ve hatırlatıcılar ile hiçbir özel günü şansa bırakmazsınız." 
                      : "Free searches are limited. With Premium, get unlimited suggestions, personality insights, and reminders so you never leave a special occasion to chance."}
                  </p>
                  <div>
                    <Link href="/pricing" className="btn btn-coral btn-lg" style={{ display: "inline-flex", boxShadow: "0 8px 24px -6px rgba(217, 74, 41, 0.3)" }}>
                      {lang === "tr" ? "Premium'u İncele" : "Explore Premium"} →
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <hr className="rule" />
          </>
        )}

        {/* MANIFESTO + COMMUNITY TEASER */}
        <section style={{ padding: "56px 0" }}>
          <div className="row gap-48 wrap" style={{ alignItems: "flex-start" }}>
            <div className="col gap-16" style={{ flex: "1 1 320px" }}>
              <div className="eyebrow">{t.landing.manifesto_eye}</div>
              <p className="serif" style={{ fontSize: 28, lineHeight: 1.3, letterSpacing: "-0.01em" }}>"{t.landing.manifesto}"</p>
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.landing.signed}</div>
            </div>
            <div className="col gap-12" style={{ flex: "1 1 320px" }}>
              <div className="row justify-between items-baseline">
                <span className="eyebrow">{t.landing.featured}</span>
                <Link href="/community" className="btn btn-ghost btn-sm" style={{ padding: "4px 0", border: 0 }}>
                  {lang === "tr" ? "Tümü" : "All"} →
                </Link>
              </div>
              <div className="col gap-8">
                {featuredPosts.map((c, i) => (
                  <TiltedCard key={i} scaleOnHover={1.02} rotateAmplitude={6}>
                    <div className="row gap-12 items-center" style={{ padding: "10px 12px", background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 6, height: "100%" }}>
                      <div style={{ width: 48, height: 48, flexShrink: 0, background: TONE_BG[c.tone], borderRadius: 4 }}></div>
                      <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <div className="row gap-8 items-baseline">
                          <span className="tag tag-rose" style={{ fontSize: 9, padding: "2px 7px" }}>{lang === "tr" ? c.forTr : c.forEn}</span>
                          <span className="mono" style={{ fontSize: 9, letterSpacing: "0.08em", color: "var(--muted)" }}>{c.store.toUpperCase()}</span>
                        </div>
                        <span className="serif-italic" style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{lang === "tr" ? c.textTr : c.textEn}"
                        </span>
                      </div>
                    </div>
                  </TiltedCard>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
