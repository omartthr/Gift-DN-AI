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
                <span className="serif-italic" style={{ color: "var(--coral)" }}>{t.onboarding.title_b}</span>
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
    <div className="fade-in" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div className="col gap-24 items-center text-center" style={{ maxWidth: 600 }}>
        <div className="row gap-12 items-center">
          <span className="dots"><span /><span /><span /></span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>{label}</span>
        </div>
        
        {/* Progress Story */}
        <h2 className="serif fade-up" style={{ fontSize: 24, letterSpacing: "-0.01em", color: "var(--coral)", minHeight: 32 }}>
          {story}
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
          <span className="serif-italic" style={{ color: "var(--coral)" }}>{t.quiz.finalizing}</span>
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
    const finalVal = val ?? (questionType === "multi_choice" ? multi.join(", ") : answer);
    if (!finalVal && questionType !== "single_choice") return;
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

  const isSubmitDisabled =
    submitting ||
    (questionType === "multi_choice" && !multi.length) ||
    (questionType === "text" && !answer.trim());

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
                <GradientText className="serif" animationSpeed={3} style={{ fontSize: 18 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>{confidence.toFixed(2)}</GradientText>
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
              <GradientText className="serif" animationSpeed={3} style={{ fontSize: 56 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>{String(turn).padStart(2, "0")}</GradientText>
              <span className="eyebrow">{t.quiz.ai_question}</span>
            </div>

            {/* Soru metni — ekran görüntüsündeki gibi büyük serif */}
            <h1 key={question} className="serif fade-up"
              style={{ fontSize: "clamp(36px, 5vw, 68px)", lineHeight: 1.06, letterSpacing: "-0.02em", maxWidth: 860 }}>
              {question}
            </h1>

            {/* Text tipi: underline input + chip öneriler */}
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
                  <div className="row wrap gap-8">
                    {options.map((opt, i) => (
                      <button key={i} className="chip" onClick={() => handleOptionClick(opt)} disabled={submitting}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single choice: büyük liste butonları */}
            {questionType === "single_choice" && (
              <div className="col gap-10" key={"single-" + turn}>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    disabled={submitting}
                    className="row items-center justify-between"
                    style={{
                      padding: "16px 22px",
                      background: "var(--bone)",
                      border: "1px solid var(--rule)",
                      borderRadius: 6,
                      fontFamily: "inherit",
                      fontSize: "clamp(15px, 2vw, 18px)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      width: "100%",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--ink)";
                      (e.currentTarget as HTMLElement).style.background = "var(--cream-2)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--rule)";
                      (e.currentTarget as HTMLElement).style.background = "var(--bone)";
                    }}
                  >
                    <span>{opt}</span>
                    <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Multi choice: chip grubu */}
            {questionType === "multi_choice" && (
              <div className="col gap-16" key={"multi-" + turn}>
                <div className="row wrap gap-8">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      className={"chip" + (multi.includes(opt) ? " active" : "")}
                      onClick={() => handleOptionClick(opt)}
                      disabled={submitting}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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
              {questionType !== "single_choice" && (
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
