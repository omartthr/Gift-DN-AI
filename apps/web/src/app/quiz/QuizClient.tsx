"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useQuizStore } from "@/store/quizStore";
import { useI18n } from "@/store/i18nStore";
import styles from "./Quiz.module.css";

const RECIPIENTS = ["sevgili", "anne", "baba", "arkadas", "kardes", "is_arkadasi", "cocuk", "diger"] as const;
const BUDGETS = ["0_250", "250_500", "500_1000", "1000_3000", "3000_plus"] as const;

export default function QuizClient() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const { chips, setChips, startSession, submitAnswer, currentQuestion, phase, error, session, gifts } = useQuizStore();
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (phase === "results") router.push("/results");
  }, [phase]);

  useEffect(() => {
    if (!user && typeof window !== "undefined") router.push("/auth");
  }, [user]);

  const toggleRecipient = (r: string) => {
    const cur = chips.recipients;
    setChips({ ...chips, recipients: cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r] });
  };

  const handleStart = async () => {
    if (!chips.recipients.length || !chips.budget || !user) return;
    await startSession(user.id, lang);
  };

  const handleSubmit = async () => {
    if (phase !== "quiz" || !currentQuestion) return;
    const finalAnswer = currentQuestion.question_type === "text" ? answer : selectedOptions.join(", ");
    setAnswer("");
    setSelectedOptions([]);
    await submitAnswer(finalAnswer);
  };

  const toggleOption = (opt: string) => {
    if (currentQuestion?.question_type === "single_choice") setSelectedOptions([opt]);
    else setSelectedOptions(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  };

  const progress = session ? Math.min((session.current_turn / 10) * 100, 100) : 0;

  return (
    <div className={styles.page}>
      <div className="container" style={{ maxWidth: 640 }}>

        {/* ── Chip Phase ── */}
        {phase === "chips" && (
          <div className={`card-glass animate-scale-in ${styles.card}`}>
            <div className={styles.header}>
              <h1 className="gradient-text">{t.quiz.title}</h1>
              <p>{t.quiz.subtitle}</p>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>{t.quiz.recipient_label}</label>
              <div className={styles.chipGrid}>
                {RECIPIENTS.map(r => (
                  <button key={r} className={`chip ${chips.recipients.includes(r) ? "selected" : ""}`} onClick={() => toggleRecipient(r)}>
                    {(t.quiz.recipients as any)[r]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>{t.quiz.budget_label}</label>
              <div className={styles.chipGrid}>
                {BUDGETS.map(b => (
                  <button key={b} className={`chip ${chips.budget === b ? "selected" : ""}`} onClick={() => setChips({ ...chips, budget: b })}>
                    {(t.quiz.budgets as any)[b]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handleStart} disabled={!chips.recipients.length || !chips.budget}>
              🚀 {t.quiz.start}
            </button>
          </div>
        )}

        {/* ── Loading Phase ── */}
        {phase === "loading" && (
          <div className={`card-glass animate-fade-in ${styles.card} ${styles.loadingCard}`}>
            <div className="spinner" />
            <p style={{ color: "var(--color-text-muted)" }}>{t.quiz.thinking}</p>
          </div>
        )}

        {/* ── Quiz Phase ── */}
        {phase === "quiz" && currentQuestion && (
          <div className={`card-glass animate-scale-in ${styles.card}`}>
            <div className={styles.progressHeader}>
              <span className={styles.turnLabel}>Soru {session?.current_turn || 1} / maks. 10</span>
              <span className={styles.confidenceBadge}>{Math.round((currentQuestion.confidence_score || 0) * 100)}% emin</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className={styles.questionArea}>
              <div className={styles.aiAvatar}>🤖</div>
              <p className={styles.questionText}>{currentQuestion.question}</p>
            </div>

            {currentQuestion.question_type === "text" ? (
              <textarea
                className="input textarea"
                placeholder={t.quiz.your_answer}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && answer.trim()) { e.preventDefault(); handleSubmit(); } }}
              />
            ) : (
              <div className={styles.chipGrid}>
                {currentQuestion.options?.map(opt => (
                  <button key={opt} className={`chip ${selectedOptions.includes(opt) ? "selected" : ""}`} onClick={() => toggleOption(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              onClick={handleSubmit}
              disabled={
                (currentQuestion.question_type === "text" && !answer.trim()) ||
                (currentQuestion.question_type !== "text" && !selectedOptions.length)
              }
            >
              {t.quiz.next} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
