"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/store/i18nStore";
import { QUIZ_BANK, type QuizQuestion } from "@/lib/data";
import GradientText from "@/components/GradientText";

export default function QuizClient() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bank: QuizQuestion[] = QUIZ_BANK[lang] || QUIZ_BANK["tr"];

  const initialRecipient = searchParams.get("recipients") || "";
  const initialBudget = searchParams.get("budget") || "";

  // Onboarding phase
  const [phase, setPhase] = useState<"onboarding" | "quiz" | "finalizing">(
    initialRecipient && initialBudget ? "quiz" : "onboarding"
  );

  const recipientKeys = ["partner", "mom", "dad", "friend", "sibling", "coworker", "child", "other"] as const;
  const budgetKeys = ["b1", "b2", "b3", "b4", "b5"] as const;
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(initialRecipient ? [initialRecipient] : []);
  const [selectedBudget, setSelectedBudget] = useState(initialBudget);
  const canContinue = selectedRecipients.length > 0 && !!selectedBudget;

  // Quiz phase
  const [turn, setTurn] = useState(0);
  const [answer, setAnswer] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const confidence = Math.min(0.95, 0.18 + turn * 0.14);
  const current = bank[turn] || bank[bank.length - 1];

  useEffect(() => {
    setAnswer("");
    setMulti([]);
    if (inputRef.current && phase === "quiz") inputRef.current.focus();
  }, [turn, phase]);

  const toggleRecipient = (k: string) => {
    setSelectedRecipients(cur => cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]);
  };

  const submit = (val?: string) => {
    const finalVal = val ?? (current.type === "multi" ? multi.join(", ") : answer);
    if (!finalVal && current.type !== "single") return;
    setThinking(true);
    const newHistory = [...history, { q: current.q, a: finalVal }];
    setHistory(newHistory);
    setTimeout(() => {
      setThinking(false);
      if (turn >= 5) {
        setPhase("finalizing");
        setTimeout(() => {
          router.push("/results");
        }, 2200);
      } else {
        setTurn(t => t + 1);
      }
    }, 950);
  };

  const onPickOption = (opt: string) => {
    if (current.type === "multi") {
      setMulti(m => m.includes(opt) ? m.filter(x => x !== opt) : [...m, opt]);
    } else if (current.type === "single") {
      submit(opt);
    } else {
      setAnswer(opt);
    }
  };

  // FINALIZING screen
  if (phase === "finalizing") {
    return (
      <div className="fade-in" style={{ minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="col gap-24 items-center text-center" style={{ maxWidth: 560, padding: "0 24px" }}>
          <div className="eyebrow">{t.quiz.eyebrow}</div>
          <h1 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{t.quiz.finalizing}</GradientText>
          </h1>
          <div className="row gap-12 items-center">
            <span className="dots"><span></span><span></span><span></span></span>
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>OPENAI · GPT-4o · SERPAPI</span>
          </div>
          <div className="col gap-8" style={{ width: "100%", maxWidth: 420, marginTop: 16 }}>
            {t.quiz.steps.map((step: string, i: number) => (
              <div key={i} className="row gap-12 items-center fade-up" style={{ padding: "10px 14px", background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 6, animationDelay: `${i * 0.4}s` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--coral)", display: "inline-block" }}></span>
                <span style={{ fontSize: 13 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING screen
  if (phase === "onboarding") {
    return (
      <div className="fade-in">
        <div className="shell">
          <section style={{ padding: "56px 0 40px" }}>
            <div className="row gap-64 wrap" style={{ alignItems: "flex-start" }}>
              <div className="col gap-24" style={{ flex: "1.2" }}>
                <div className="eyebrow">{t.onboarding.eyebrow}</div>
                <h1 className="serif" style={{ fontSize: "clamp(48px, 6.5vw, 88px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
                  {t.onboarding.title_a}<br />
                  <GradientText className="serif-italic" animationSpeed={3} colors={["#F95738", "#FF9F1C", "#F95738"]}>{t.onboarding.title_b}</GradientText>
                </h1>
                <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 520 }}>{t.onboarding.sub}</p>

                <div className="col gap-12" style={{ marginTop: 24 }}>
                  <div className="row items-baseline gap-12">
                    <span className="eyebrow">{t.onboarding.q1}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>· {t.onboarding.q1_hint}</span>
                  </div>
                  <div className="row wrap gap-8">
                    {recipientKeys.map(k => (
                      <button key={k} className={"chip" + (selectedRecipients.includes(k) ? " active" : "")} onClick={() => toggleRecipient(k)}>
                        {(t.recipients as Record<string, string>)[k]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col gap-12" style={{ marginTop: 16 }}>
                  <div className="row items-baseline gap-12">
                    <span className="eyebrow">{t.onboarding.q2}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>· {t.onboarding.q2_hint}</span>
                  </div>
                  <div className="row wrap gap-8">
                    {budgetKeys.map(k => (
                      <button key={k} className={"chip coral" + (selectedBudget === k ? " active" : "")} onClick={() => setSelectedBudget(k)}>
                        {(t.budget as Record<string, string>)[k]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row gap-12 items-center" style={{ marginTop: 32 }}>
                  <button className="btn btn-ghost" onClick={() => router.push("/")}> ← {t.onboarding.back}</button>
                  <button className="btn btn-coral btn-lg" disabled={!canContinue} onClick={() => setPhase("quiz")} style={{ opacity: canContinue ? 1 : 0.4 }}>
                    {t.onboarding.cont} →
                  </button>
                </div>
              </div>

              {/* Right preview card */}
              <div className="col gap-16" style={{ flex: 1, minWidth: 300 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div className="eyebrow" style={{ marginBottom: 16 }}>{t.onboarding.your_picks}</div>
                  <div className="col gap-16">
                    <div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{t.onboarding.for_whom}</div>
                      <div className="serif" style={{ fontSize: 24, lineHeight: 1.15, minHeight: 32 }}>
                        {selectedRecipients.length
                          ? selectedRecipients.map(k => (t.recipients as Record<string, string>)[k]).join(", ")
                          : <span style={{ color: "var(--muted-2)" }}>—</span>}
                      </div>
                    </div>
                    <hr className="rule-soft" />
                    <div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>{t.onboarding.budget}</div>
                      <div className="serif" style={{ fontSize: 24, lineHeight: 1.15, minHeight: 32 }}>
                        {selectedBudget ? (t.budget as Record<string, string>)[selectedBudget] : <span style={{ color: "var(--muted-2)" }}>—</span>}
                      </div>
                    </div>
                    <hr className="rule-soft" />
                    <div className="row gap-8 items-center" style={{ color: "var(--muted)", fontSize: 13 }}>
                      <span className="dots"><span></span><span></span><span></span></span>
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

  // QUIZ screen
  return (
    <div className="fade-in">
      {/* Sticky progress */}
      <div style={{ position: "sticky", top: 0, background: "var(--cream)", zIndex: 5 }}>
        <div className="shell">
          <div className="row items-center justify-between" style={{ padding: "20px 0 12px" }}>
            <div className="row gap-12 items-baseline">
              <span className="eyebrow">{t.quiz.eyebrow}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>·</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>
                {t.quiz.turn} {turn + 1} <span style={{ color: "var(--muted-2)" }}>{t.quiz.of}</span>
              </span>
            </div>
            <div className="row gap-16 items-center">
              <div className="col" style={{ alignItems: "flex-end" }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{t.quiz.confidence}</span>
                <GradientText className="serif" animationSpeed={3} style={{ fontSize: 18 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>{confidence.toFixed(2)}</GradientText>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPhase("onboarding")}>← {t.onboarding.back}</button>
            </div>
          </div>
          <div className="progress"><span style={{ width: `${((turn + 1) / 10) * 100}%` }}></span></div>
        </div>
      </div>

      <div className="shell">
        <div className="row gap-64 wrap" style={{ padding: "60px 0", alignItems: "flex-start" }}>
          {/* Main question column */}
          <div className="col gap-32" style={{ flex: "1.6" }}>
            <div className="row items-baseline gap-12">
              <GradientText className="serif" animationSpeed={3} style={{ fontSize: 56 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>{String(turn + 1).padStart(2, "0")}</GradientText>
              <span className="eyebrow">{t.quiz.ai_question}</span>
            </div>
            <h1 key={turn} className="serif fade-up" style={{ fontSize: "clamp(40px, 5.5vw, 72px)", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 920 }}>
              {current.q}
            </h1>

            {current.type === "text" && (
              <div className="col gap-16" key={"text" + turn}>
                <input ref={inputRef} className="input serif" style={{ fontSize: 28, paddingBottom: 14, fontStyle: "italic", color: "var(--ink)" }}
                  placeholder={t.quiz.placeholder} value={answer} onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submit(); }} />
                <div className="row wrap gap-8">
                  {current.options.map((opt, i) => (
                    <button key={i} className="chip" onClick={() => onPickOption(opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {current.type === "single" && (
              <div className="col gap-12" key={"single" + turn}>
                {current.options.map((opt, i) => (
                  <button key={i} onClick={() => onPickOption(opt)}
                    className="row items-center justify-between"
                    style={{ padding: "18px 24px", background: "var(--bone)", border: "1px solid var(--rule)", borderRadius: 6, fontFamily: "inherit", fontSize: 18, color: "var(--ink)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease", width: "100%" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ink)"; (e.currentTarget as HTMLElement).style.background = "var(--cream-2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--rule)"; (e.currentTarget as HTMLElement).style.background = "var(--bone)"; }}>
                    <span>{opt}</span>
                    <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>{String.fromCharCode(65 + i)}</span>
                  </button>
                ))}
              </div>
            )}

            {current.type === "multi" && (
              <div className="col gap-16" key={"multi" + turn}>
                <div className="row wrap gap-8">
                  {current.options.map((opt, i) => (
                    <button key={i} className={"chip" + (multi.includes(opt) ? " active" : "")} onClick={() => onPickOption(opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="row gap-12 items-center" style={{ marginTop: 16 }}>
              <button className="btn btn-coral btn-lg" onClick={() => submit()}
                disabled={(current.type === "multi" && !multi.length) || (current.type === "text" && !answer.trim()) || thinking}
                style={{ opacity: thinking ? 0.5 : 1 }}>
                {thinking ? <span className="dots"><span></span><span></span><span></span></span> : <>{t.quiz.submit} →</>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setTurn(t => t + 1)} disabled={thinking}>{t.quiz.skip}</button>
              {current.type === "text" && <span className="mono" style={{ fontSize: 11, color: "var(--muted)", marginLeft: 12 }}>↵ ENTER</span>}
            </div>
          </div>

          {/* Right column — AI reasoning */}
          <div className="col gap-16" style={{ flex: 1, minWidth: 300, position: "sticky", top: 90 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{t.quiz.reasoning}</div>
              <p key={turn} className="fade-in" style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>"{current.reason}"</p>
              <hr className="rule-soft" style={{ margin: "16px 0" }} />
              <div className="row gap-8 items-center">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: thinking ? "var(--coral)" : "var(--sage)", display: "inline-block" }}></span>
                <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)" }}>
                  {thinking ? t.quiz.thinking : t.quiz.ai_ready}
                </span>
              </div>
            </div>

            {history.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>{t.quiz.so_far}</div>
                <div className="col gap-12">
                  {history.slice(-3).map((h, i) => (
                    <div key={i} className="col gap-4">
                      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>Q{history.length - 2 + i}</span>
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{h.q.length > 52 ? h.q.slice(0, 52) + "…" : h.q}</span>
                      <GradientText className="serif-italic" animationSpeed={3} style={{ fontSize: 14 }} colors={["#F95738", "#FF9F1C", "#F95738"]}>"{h.a.length > 40 ? h.a.slice(0, 40) + "…" : h.a}"</GradientText>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="row gap-8 items-center" style={{ padding: "0 4px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--coral)", display: "inline-block" }}></span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
                {selectedRecipients.map(k => (t.recipients as Record<string, string>)[k]).join(", ")} · {selectedBudget ? (t.budget as Record<string, string>)[selectedBudget] : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
