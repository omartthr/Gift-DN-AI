"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { useQuizStore } from "@/store/quizStore";
import { useAuthStore } from "@/store/authStore";
import { DID_YOU_KNOW, LOADING_STORIES } from "@/lib/loadingContent";
import GradientText from "@/components/GradientText";

// ─── Chip seçimi: Onboarding ───────────────────────────────────────────────

const recipientKeys = ["partner", "mom", "dad", "friend", "sibling", "coworker", "child", "other"] as const;
const budgetKeys = ["b1", "b2", "b3", "b4", "b5"] as const;
// Cinsiyeti belirsiz alıcılar — anne ve baba bu listede YOK
const GENDER_AMBIGUOUS = new Set(["partner", "friend", "sibling", "coworker", "child", "other"]);

function OnboardingScreen() {
  const { t, lang } = useI18n();
  const { chips, setChips, startSession, error } = useQuizStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(chips.recipients || []);
  const [selectedBudget, setSelectedBudget] = useState(chips.budget || "");
  const [selectedGender, setSelectedGender] = useState<string>(chips.recipientGender || "");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [starting, setStarting] = useState(false);

  const isCustomBudget = selectedBudget === "b_custom";
  const customBudgetValid = isCustomBudget ? (!!customMin && !!customMax && Number(customMin) < Number(customMax)) : true;
  const canContinue = selectedRecipients.length > 0 && !!selectedBudget && customBudgetValid;
  const showGenderPicker = selectedRecipients.length > 0 && GENDER_AMBIGUOUS.has(selectedRecipients[0]);

  const selectRecipient = (k: string) => {
    setSelectedRecipients([k]);
    if (!GENDER_AMBIGUOUS.has(k)) setSelectedGender("");
  };

  const handleStart = async () => {
    if (!canContinue) return;

    const budgetValue = isCustomBudget ? `${customMin}–${customMax} TL` : selectedBudget;
    const newChips: typeof chips = {
      recipients: selectedRecipients,
      budget: budgetValue,
      ...(showGenderPicker && selectedGender ? { recipientGender: selectedGender } : {}),
    };
    setChips(newChips);

    if (!user) {
      // Seçimleri store'a kaydet, sonra auth'a yönlendir
      router.push("/auth?next=/quiz");
      return;
    }

    setStarting(true);
    await startSession(user.id, lang);
    setStarting(false);
  };

  return (
    <div className="fade-in">
      <div className="shell">
        <section style={{ padding: "56px 0 40px" }}>
          <div className="row gap-64 wrap" style={{ alignItems: "flex-start" }}>
            {/* Sol: Chip seçimleri */}
            <div className="col gap-24" style={{ flex: "1.2" }}>
              <div className="eyebrow">{t.onboarding.eyebrow}</div>
              <h1 className="serif" style={{ fontSize: "clamp(48px, 6.5vw, 88px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
                {t.onboarding.title_a}<br />
                <GradientText className="serif-italic" animationSpeed={8} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
                  {t.onboarding.title_b}
                </GradientText>
              </h1>
              <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 520 }}>{t.onboarding.sub}</p>

              {/* Kime */}
              <div className="col gap-12" style={{ marginTop: 24 }}>
                <div className="row items-baseline gap-12">
                  <span className="eyebrow">{t.onboarding.q1}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>· {t.onboarding.q1_hint}</span>
                </div>
                <div className="row wrap gap-8">
                  {recipientKeys.map(k => (
                    <button
                      key={k}
                      className={"chip" + (selectedRecipients.includes(k) ? " active" : "")}
                      onClick={() => selectRecipient(k)}
                    >
                      {(t.recipients as Record<string, string>)[k]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cinsiyet seçici — sadece cinsiyet belirsiz alıcı seçilince */}
              <div style={{
                overflow: "hidden",
                maxHeight: showGenderPicker ? 120 : 0,
                opacity: showGenderPicker ? 1 : 0,
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}>
                <div className="col gap-12" style={{ paddingTop: 8 }}>
                  <div className="row items-baseline gap-12">
                    <span className="eyebrow">{(t.onboarding as Record<string, string>).q_gender}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>· {(t.onboarding as Record<string, string>).q_gender_hint}</span>
                  </div>
                  <div className="row wrap gap-8">
                    {(["male", "female", "nonbinary"] as const).map(g => (
                      <button
                        key={g}
                        className={"chip" + (selectedGender === g ? " active" : "")}
                        onClick={() => setSelectedGender(selectedGender === g ? "" : g)}
                      >
                        {(t.onboarding as Record<string, string>)["gender_" + g]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bütçe */}
              <div className="col gap-12" style={{ marginTop: 8 }}>
                <div className="row items-baseline gap-12">
                  <span className="eyebrow">{t.onboarding.q2}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>· {t.onboarding.q2_hint}</span>
                </div>
                <div className="row wrap gap-8">
                  {budgetKeys.map(k => (
                    <button
                      key={k}
                      className={"chip coral" + (selectedBudget === k ? " active" : "")}
                      onClick={() => setSelectedBudget(k)}
                    >
                      {(t.budget as Record<string, string>)[k]}
                    </button>
                  ))}
                  <button
                    className={"chip coral" + (isCustomBudget ? " active" : "")}
                    onClick={() => setSelectedBudget("b_custom")}
                  >
                    {(t.onboarding as Record<string, string>).budget_custom}
                  </button>
                </div>
                {isCustomBudget && (
                  <div className="row gap-8 items-center" style={{ marginTop: 4 }}>
                    <input
                      type="number"
                      className="input"
                      placeholder={(t.onboarding as Record<string, string>).budget_min}
                      value={customMin}
                      onChange={e => setCustomMin(e.target.value)}
                      style={{ width: 120, fontSize: 15, padding: "8px 12px" }}
                      min={0}
                    />
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>–</span>
                    <input
                      type="number"
                      className="input"
                      placeholder={(t.onboarding as Record<string, string>).budget_max}
                      value={customMax}
                      onChange={e => setCustomMax(e.target.value)}
                      style={{ width: 120, fontSize: 15, padding: "8px 12px" }}
                      min={0}
                    />
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>₺</span>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: "rgba(217,74,41,0.08)", border: "1px solid rgba(217,74,41,0.2)", borderRadius: 6, fontSize: 13, color: "var(--coral)" }}>
                  {error}
                </div>
              )}

              <div className="row gap-12 items-center" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => router.push("/")}>← {t.onboarding.back}</button>
                <button
                  className="btn btn-coral btn-lg"
                  disabled={!canContinue || starting}
                  onClick={handleStart}
                  style={{ opacity: (!canContinue || starting) ? 0.4 : 1, minWidth: 160 }}
                >
                  {starting
                    ? <span className="dots"><span /><span /><span /></span>
                    : user
                      ? <>{t.onboarding.cont} →</>
                      : <>Giriş yap ve devam et →</>
                  }
                </button>
              </div>
            </div>

            {/* Sağ: Önizleme kartı */}
            <div className="col gap-16" style={{ flex: 1, minWidth: 280 }}>
              <div className="card" style={{ padding: 24 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>{t.onboarding.your_picks}</div>
                <div className="col gap-16">
                  <div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{t.onboarding.for_whom}</div>
                    <div className="serif" style={{ fontSize: 22, lineHeight: 1.15, minHeight: 28 }}>
                      {selectedRecipients.length
                        ? selectedRecipients.map(k => (t.recipients as Record<string, string>)[k]).join(", ")
                        : <span style={{ color: "var(--muted-2)" }}>—</span>}
                    </div>
                  </div>
                  <hr className="rule-soft" />
                  <div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{t.onboarding.budget}</div>
                    <div className="serif" style={{ fontSize: 22, lineHeight: 1.15, minHeight: 28 }}>
                      {isCustomBudget
                        ? (customMin && customMax ? `${customMin} – ${customMax} ₺` : <span style={{ color: "var(--muted-2)" }}>—</span>)
                        : selectedBudget
                          ? (t.budget as Record<string, string>)[selectedBudget]
                          : <span style={{ color: "var(--muted-2)" }}>—</span>}
                    </div>
                  </div>
                  {showGenderPicker && (
                    <>
                      <hr className="rule-soft" />
                      <div>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{(t.onboarding as Record<string, string>).gender_label}</div>
                        <div className="serif" style={{ fontSize: 22, lineHeight: 1.15, minHeight: 28 }}>
                          {selectedGender
                            ? (t.onboarding as Record<string, string>)["gender_" + selectedGender]
                            : <span style={{ color: "var(--muted-2)" }}>—</span>}
                        </div>
                      </div>
                    </>
                  )}
                  <hr className="rule-soft" />
                  <div className="row gap-8 items-center" style={{ color: "var(--muted)", fontSize: 13 }}>
                    <span className="dots"><span /><span /><span /></span>
                    <span>{t.onboarding.ai_ready}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Güven skoru geçiş animasyonu ──────────────────────────────────────────

function ConfidenceTransition() {
  const { lang } = useI18n();
  const previousConfidence = useQuizStore(s => s.previousConfidence);
  const newQuestionPending = useQuizStore(s => s.newQuestionPending);
  const commitQuestion = useQuizStore(s => s.commitQuestion);

  const [displayValue, setDisplayValue] = useState(previousConfidence);
  const [animDone, setAnimDone] = useState(false);
  const target = newQuestionPending?.confidence_score ?? previousConfidence;
  const delta = target - previousConfidence;
  const isIncrease = delta > 0.0005;
  const isDecrease = delta < -0.0005;

  useEffect(() => {
    if (!newQuestionPending) {
      setDisplayValue(previousConfidence);
      setAnimDone(false);
      return;
    }

    const from = previousConfidence;
    const to = newQuestionPending.confidence_score;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setAnimDone(true);
        // Sayı oturduktan sonra kısa bir nefes payı ver, sonra quiz'e geç
        setTimeout(() => commitQuestion(), 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [newQuestionPending, previousConfidence, commitQuestion]);

  const waiting = !newQuestionPending;
  const pct = Math.max(0, Math.min(1, displayValue)) * 100;
  const prevPct = Math.max(0, Math.min(1, previousConfidence)) * 100;

  const accent = isDecrease ? "var(--coral)" : "var(--sage, #6b8e63)";
  const deltaSign = isIncrease ? "+" : isDecrease ? "−" : "±";
  const deltaLabel = `${deltaSign}${Math.abs(delta).toFixed(2)}`;
  const showDelta = !!newQuestionPending && (isIncrease || isDecrease);

  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <div className="row items-baseline" style={{ gap: 10, justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)" }}>
          {lang === "tr" ? "GÜVEN" : "CONFIDENCE"}
        </span>
        <span className="row items-baseline" style={{ gap: 8 }}>
          <span
            className="serif"
            style={{
              fontSize: 22,
              lineHeight: 1,
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {displayValue.toFixed(2)}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: showDelta ? accent : "transparent",
              fontVariantNumeric: "tabular-nums",
              transition: "color 0.4s ease",
              minWidth: 44,
              textAlign: "right",
            }}
          >
            {showDelta ? deltaLabel : "·"}
          </span>
        </span>
      </div>

      {/* Hairline bar */}
      <div
        style={{
          position: "relative",
          marginTop: 8,
          height: 2,
          background: "var(--rule)",
          borderRadius: 999,
          overflow: "visible",
        }}
      >
        {/* Eski değer için ince hayalet işaret */}
        {newQuestionPending && Math.abs(delta) > 0.0005 && (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${prevPct}%`,
              background: "var(--muted-2)",
              opacity: 0.3,
              borderRadius: 999,
            }}
          />
        )}
        {/* Aktif bar */}
        <span
          className={waiting ? "conf-pulse" : undefined}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: accent,
            borderRadius: 999,
            transition: waiting ? "none" : "background 0.3s ease",
          }}
        />
        {/* Mevcut değer üzerine küçük nokta (modern dashboard görünümü) */}
        <span
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--cream)",
            border: `1.5px solid ${accent}`,
            boxShadow: animDone ? `0 0 0 4px ${isDecrease ? "rgba(217,74,41,0.12)" : "rgba(107,142,99,0.14)"}` : "none",
            transition: "box-shadow 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Yükleniyor (AI düşünüyor) ─────────────────────────────────────────────

function LoadingScreen({ label = "AI düşünüyor…" }: { label?: string }) {
  const { lang } = useI18n();
  const [fact, setFact] = useState("");
  const [story, setStory] = useState("");

  useEffect(() => {
    // Pick random initial values
    setFact(DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
    setStory(LOADING_STORIES[Math.floor(Math.random() * LOADING_STORIES.length)]);

    // Cycle every 6 seconds
    const interval = setInterval(() => {
      setFact(DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
      setStory(LOADING_STORIES[Math.floor(Math.random() * LOADING_STORIES.length)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fade-in" style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div className="col gap-24 items-center text-center" style={{ maxWidth: 600, width: "100%" }}>
        <div className="row gap-12 items-center">
          <span className="dots"><span /><span /><span /></span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>{label}</span>
        </div>

        {/* Güven skoru geçişi */}
        <ConfidenceTransition />

        {/* Progress Story */}
        <h2 className="serif fade-up" style={{ fontSize: 24, letterSpacing: "-0.01em", minHeight: 32 }}>
          <GradientText animationSpeed={8} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
            {story}
          </GradientText>
        </h2>

        {/* Did You Know Fact */}
        <div className="card fade-in" style={{ padding: 24, background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 12, marginTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {lang === 'tr' ? 'BİLİYOR MUYDUNUZ?' : 'DID YOU KNOW?'}
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}>
            {fact}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Finalizing: AI hediye üretiyor ───────────────────────────────────────

function FinalizingScreen() {
  const { t, lang } = useI18n();
  const [fact, setFact] = useState("");
  const [story, setStory] = useState("");

  useEffect(() => {
    setFact(DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
    setStory(LOADING_STORIES[Math.floor(Math.random() * LOADING_STORIES.length)]);

    const interval = setInterval(() => {
      setFact(DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
      setStory(LOADING_STORIES[Math.floor(Math.random() * LOADING_STORIES.length)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fade-in" style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="col gap-24 items-center text-center" style={{ maxWidth: 560, padding: "0 24px" }}>
        <div className="eyebrow">{t.quiz.eyebrow}</div>
        <h1 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          <GradientText className="serif-italic" animationSpeed={8} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>
            {t.quiz.finalizing}
          </GradientText>
        </h1>
        <div className="row gap-12 items-center">
          <span className="dots"><span /><span /><span /></span>
        </div>

        {/* Dynamic Story */}
        <div className="serif fade-in" style={{ fontSize: 20, color: "var(--ink)", marginTop: 16, minHeight: 32 }}>
          {story}
        </div>

        {/* Dynamic Fact */}
        <div className="card fade-in" style={{ padding: 24, background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 12, marginTop: 16, width: "100%" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            {lang === 'tr' ? 'BİLİYOR MUYDUNUZ?' : 'DID YOU KNOW?'}
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}>
            {fact}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tutarlı seçenek listesi (Onedio tarzı) ───────────────────────────────

function OptionList({
  options,
  selected,
  onClick,
  disabled,
  multi,
}: {
  options: string[];
  selected: string[];
  onClick: (opt: string) => void;
  disabled?: boolean;
  multi?: boolean;
}) {
  return (
    <div className="col gap-10" style={{ width: "100%" }}>
      {options.map((opt, i) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={i}
            onClick={() => onClick(opt)}
            disabled={disabled}
            className="row items-center justify-between"
            style={{
              padding: "16px 22px",
              background: isSelected ? "var(--cream-2)" : "var(--bone)",
              border: `1px solid ${isSelected ? "var(--ink)" : "var(--rule)"}`,
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "var(--ink)",
              cursor: disabled ? "default" : "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              width: "100%",
              gap: 16,
            }}
            onMouseEnter={e => {
              if (disabled || isSelected) return;
              (e.currentTarget as HTMLElement).style.borderColor = "var(--ink)";
              (e.currentTarget as HTMLElement).style.background = "var(--cream-2)";
            }}
            onMouseLeave={e => {
              if (disabled || isSelected) return;
              (e.currentTarget as HTMLElement).style.borderColor = "var(--rule)";
              (e.currentTarget as HTMLElement).style.background = "var(--bone)";
            }}
          >
            <span className="row items-center" style={{ gap: 14, flex: 1, minWidth: 0 }}>
              <span
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: isSelected ? "var(--ink)" : "var(--cream-2)",
                  color: isSelected ? "var(--cream)" : "var(--muted)",
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{opt}</span>
            </span>
            {multi && (
              <span
                aria-hidden
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `1.5px solid ${isSelected ? "var(--ink)" : "var(--muted-2)"}`,
                  background: isSelected ? "var(--ink)" : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Ana Quiz Ekranı ───────────────────────────────────────────────────────

function QuizScreen() {
  const { t, lang } = useI18n();
  const { currentQuestion, chips, submitAnswer, phase, error, reset } = useQuizStore();
  const { user } = useAuthStore();

  const [answer, setAnswer] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const turn = currentQuestion?.turn ?? 1;
  const question = currentQuestion?.question ?? "";
  const questionType = currentQuestion?.question_type ?? "text";
  const options = currentQuestion?.options ?? [];
  const confidence = currentQuestion?.confidence_score ?? 0;
  const reasoning = currentQuestion?.reasoning ?? "";

  // Yeni soru gelince sıfırla
  useEffect(() => {
    setAnswer("");
    setMulti([]);
    if (inputRef.current && questionType === "text") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [question, questionType]);

  const handleSubmit = useCallback(async (val?: string) => {
    let finalVal = val;
    if (!finalVal) {
      if (questionType === "multi_choice") {
        finalVal = multi.join(", ");
        if (answer.trim()) finalVal += (finalVal ? " - Ek bilgi: " : "") + answer.trim();
      } else {
        finalVal = answer.trim();
      }
    } else {
      if (answer.trim()) finalVal += " - Ek bilgi: " + answer.trim();
    }

    if (!finalVal) return; // Boş gönderimi engelle (Atla hariç, o özel bir değer yolluyor)
    setSubmitting(true);
    await submitAnswer(finalVal);
    setSubmitting(false);
  }, [answer, multi, questionType, submitAnswer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOptionClick = (opt: string) => {
    if (questionType === "multi_choice") {
      setMulti(m => m.includes(opt) ? m.filter(x => x !== opt) : [...m, opt]);
    } else if (questionType === "single_choice") {
      handleSubmit(opt);
    } else {
      setAnswer(opt);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const isSubmitDisabled = submitting || (
    questionType === "multi_choice" ? (!multi.length && !answer.trim()) :
      !answer.trim()
  );

  const progressPct = Math.min(((turn) / 10) * 100, 100);
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="fade-in">
      {/* Sticky progress bar */}
      <div style={{ position: "sticky", top: 0, background: "var(--cream)", zIndex: 5 }}>
        <div className="shell">
          <div className="row items-center justify-between" style={{ padding: "20px 0 12px" }}>
            <div className="row gap-12 items-baseline">
              <span className="eyebrow">{t.quiz.eyebrow}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>
                {t.quiz.turn} {turn} <span style={{ color: "var(--muted-2)" }}>{t.quiz.of}</span>
              </span>
            </div>
            <div className="row gap-16 items-center">
              <div className="col" style={{ alignItems: "flex-end" }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.quiz.confidence}</span>
                <GradientText className="serif" animationSpeed={3} style={{ fontSize: 18 }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{confidence.toFixed(2)}</GradientText>
              </div>
            </div>
          </div>
          <div className="progress"><span style={{ width: `${progressPct}%` }} /></div>
        </div>
      </div>

      <div className="shell">
        <div className="row gap-64 wrap" style={{ padding: "60px 0", alignItems: "flex-start" }}>

          {/* Ana soru kolonu */}
          <div className="col gap-32" style={{ flex: "1.6" }}>
            {/* Soru numarası + eyebrow */}
            <div className="row items-baseline gap-12">
              <GradientText className="serif" animationSpeed={3} style={{ fontSize: 56 }} colors={["#5A0F0F", "#8F2C0E", "#C44900", "#5A0F0F"]}>{String(turn).padStart(2, "0")}</GradientText>
              <span className="eyebrow">{t.quiz.ai_question}</span>
            </div>

            {/* Soru metni — ekran görüntüsündeki gibi büyük serif */}
            <h1 key={question} className="serif fade-up"
              style={{ fontSize: "clamp(36px, 5vw, 68px)", lineHeight: 1.06, letterSpacing: "-0.02em", maxWidth: 860 }}>
              {question}
            </h1>

            {/* Text tipi: underline input (opsiyonel öneriler aşağıda aynı formatta) */}
            {(questionType === "text" || (!questionType)) && (
              <div className="col gap-16" key={"text-" + turn}>
                <input
                  ref={inputRef}
                  className="input"
                  style={{ fontSize: "clamp(18px, 2.5vw, 26px)", paddingBottom: 14, color: "var(--ink)", fontFamily: "inherit" }}
                  placeholder={t.quiz.placeholder}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitting}
                />
                {options.length > 0 && (
                  <div className="col gap-8">
                    <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                      {lang === "tr" ? "VEYA SEÇENEKLERDEN BİRİNİ SEÇ" : "OR PICK ONE BELOW"}
                    </span>
                    <OptionList
                      options={options}
                      selected={answer ? [answer] : []}
                      onClick={handleOptionClick}
                      disabled={submitting}
                      multi={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Single choice: tek seçim */}
            {questionType === "single_choice" && (
              <div className="col gap-10" key={"single-" + turn}>
                <OptionList
                  options={options}
                  selected={[]}
                  onClick={handleOptionClick}
                  disabled={submitting}
                  multi={false}
                />
              </div>
            )}

            {/* Multi choice: çoklu seçim, aynı format */}
            {questionType === "multi_choice" && (
              <div className="col gap-10" key={"multi-" + turn}>
                <OptionList
                  options={options}
                  selected={multi}
                  onClick={handleOptionClick}
                  disabled={submitting}
                  multi={true}
                />
              </div>
            )}

            {/* Ek Bilgi Kutucuğu (Single ve Multi choice için) */}
            {(questionType === "single_choice" || questionType === "multi_choice") && (
              <div className="col gap-8" style={{ marginTop: 16 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                  {lang === "tr" ? "VEYA EK BİLGİ EKLEYİN (OPSİYONEL)" : "OR ADD EXTRA INFO (OPTIONAL)"}
                </span>
                <input
                  className="input"
                  style={{ fontSize: "16px", padding: "12px 16px", color: "var(--ink)", fontFamily: "inherit", borderRadius: 8 }}
                  placeholder={lang === "tr" ? "Şıklar uymadıysa veya eklemek istediğiniz bir şey varsa buraya yazın..." : "If options don't fit or you want to add more..."}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Hata mesajı */}
            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(217,74,41,0.08)", border: "1px solid rgba(217,74,41,0.2)", borderRadius: 6, fontSize: 13, color: "var(--coral)" }}>
                {error}
              </div>
            )}

            {/* Alt butonlar — ekran görüntüsündeki gibi: "Devam et →", "Geç", "↵ ENTER" */}
            <div className="row gap-12 items-center" style={{ marginTop: 8 }}>
              {(questionType !== "single_choice" || answer.trim().length > 0) && (
                <button
                  className="btn btn-coral btn-lg"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitDisabled}
                  style={{ opacity: isSubmitDisabled ? 0.4 : 1 }}
                >
                  {submitting
                    ? <span className="dots"><span /><span /><span /></span>
                    : <>{t.quiz.submit} →</>
                  }
                </button>
              )}
              <button
                className="btn btn-bone btn-sm"
                style={{ borderRadius: 999 }}
                onClick={() => handleSubmit("—")}
                disabled={submitting}
              >
                {t.quiz.skip}
              </button>
              {questionType === "text" && (
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                  ↵ ENTER
                </span>
              )}
            </div>
          </div>

          {/* Sağ kolon: AI reasoning + seçimler özeti */}
          <div className="col gap-16" style={{ flex: 1, minWidth: 280, position: "sticky", top: 90 }}>
            {reasoning && (
              <div className="card" style={{ padding: 20 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>{t.quiz.reasoning}</div>
                <p key={question} className="fade-in" style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  "{reasoning}"
                </p>
                <hr className="rule-soft" style={{ margin: "16px 0" }} />
                <div className="row gap-8 items-center">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: submitting ? "var(--coral)" : "var(--sage)", display: "inline-block" }} />
                  <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>
                    {submitting ? t.quiz.thinking : t.quiz.ai_ready}
                  </span>
                </div>
              </div>
            )}

            {/* Bağlam özeti */}
            <div className="card" style={{ padding: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>BAĞLAM</div>
              <div className="col gap-8">
                <div className="row gap-8 items-center">
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>KİM</span>
                  <span style={{ fontSize: 13 }}>
                    {(chips.recipients || []).map(r => (t.recipients as Record<string, string>)[r] || r).join(", ")}
                  </span>
                </div>
                <div className="row gap-8 items-center">
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>BÜTÇE</span>
                  <span style={{ fontSize: 13 }}>{(t.budget as Record<string, string>)[chips.budget] || chips.budget}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Başa Dön Butonu */}
      <button
        onClick={() => setShowRestartConfirm(true)}
        className="btn btn-bone btn-sm fade-in"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, borderRadius: 999, padding: "8px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1px solid var(--rule)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span style={{ verticalAlign: "middle" }}>{lang === "tr" ? "Başa Dön" : "Restart"}</span>
      </button>

      {/* Özel Onay Modalı */}
      {showRestartConfirm && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="card fade-up" style={{ padding: 32, maxWidth: 400, width: "90%", background: "var(--cream)", border: "1px solid var(--rule)", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.1)" }}>
            <h3 className="serif" style={{ fontSize: 24, marginBottom: 12, color: "var(--ink)", letterSpacing: "-0.01em" }}>{lang === "tr" ? "Emin misiniz?" : "Are you sure?"}</h3>
            <p style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.5 }}>
              {lang === "tr" ? "Başa dönmek üzeresiniz. Şimdiye kadarki tüm ilerlemeniz kaybolacak." : "You are about to start over. All your progress so far will be lost."}
            </p>
            <div className="row gap-12 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowRestartConfirm(false)}>{lang === "tr" ? "Vazgeç" : "Cancel"}</button>
              <button className="btn btn-coral" onClick={() => reset()}>{lang === "tr" ? "Başa Dön" : "Restart"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana bileşen: Phase yönetimi ───────────────────────────────────────────

export default function QuizClient() {
  const { phase, currentQuestion } = useQuizStore();
  const { lang } = useI18n();
  const router = useRouter();

  // Sonuçlar hazır olunca yönlendir
  useEffect(() => {
    if (phase === "results") {
      router.push("/results");
    }
  }, [phase, router]);

  if (phase === "chips") return <OnboardingScreen />;

  if (phase === "loading") {
    return <LoadingScreen label={lang === "tr" ? "AI düşünüyor…" : "AI thinking…"} />;
  }

  if (phase === "generating" || (phase === "quiz" && !currentQuestion)) {
    return <FinalizingScreen />;
  }

  if (phase === "quiz" && currentQuestion) {
    return <QuizScreen />;
  }

  return <LoadingScreen />;
}
