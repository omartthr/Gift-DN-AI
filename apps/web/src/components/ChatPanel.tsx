"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/store/i18nStore";

type Message = {
  role: "ai" | "user";
  text: string;
  italic?: boolean;
  withRecipients?: boolean;
  withBudget?: boolean;
  recipient?: string;
  resumeCta?: boolean;
};

const RECIPIENT_KEYS = ["partner", "mom", "dad", "friend", "sibling", "coworker"] as const;
const BUDGET_KEYS = ["b2", "b3", "b4", "b5"] as const;

export default function ChatPanel() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: lang === "tr"
        ? "Merhaba! Ben Gift DN-AI. Sana iyi bir hediye fikri bulmama yardımcı olur musun?"
        : "Hi! I'm Gift DN-AI. Mind helping me find a great gift idea for you?",
      italic: true,
    },
    {
      role: "ai",
      text: lang === "tr" ? "Önce — kime hediye alıyorsun?" : "First — who's the gift for?",
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startFlow = (recipient: string) => {
    const label = (t.recipients as Record<string, string>)[recipient];
    setMessages(m => [...m, { role: "user", text: label }]);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: lang === "tr"
          ? `Harika, ${label.toLowerCase()} için. Bütçen ne kadar?`
          : `Great — for ${label.toLowerCase()}. What's your budget?`,
        withBudget: true,
        recipient,
      }]);
    }, 600);
  };

  const pickBudget = (recipient: string, budget: string) => {
    const label = (t.budget as Record<string, string>)[budget];
    setMessages(m => [...m, { role: "user", text: label }]);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: lang === "tr"
          ? "Mükemmel. Şimdi birkaç akıllı soruyla devam edelim →"
          : "Perfect. Let's continue with a few smart questions →",
        italic: true,
      }]);
      setTimeout(() => {
        router.push(`/quiz?recipients=${recipient}&budget=${budget}`);
      }, 1100);
    }, 500);
  };

  const send = (text?: string) => {
    const val = text || input.trim();
    if (!val) return;
    setMessages(m => [...m, { role: "user", text: val }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai",
        text: lang === "tr"
          ? "Anladım. Önce hızlıca kime hediye alacağını öğreneyim — aşağıdan seçebilirsin."
          : "Got it. Let me know who the gift is for — pick below.",
        withRecipients: true,
      }]);
    }, 600);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="row gap-12 items-center">
          <span className="ai-dot"></span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{lang === "tr" ? "AI Hediye Asistanı" : "AI Gift Assistant"}</span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
              {lang === "tr" ? "ÇEVRİMİÇİ · GEMINI 2.5 FLASH" : "ONLINE · GEMINI 2.5 FLASH"}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-msgs" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i}>
            <div className={"msg " + m.role + (m.italic ? " serif-italic" : "")}>{m.text}</div>
            {m.withRecipients && (
              <div className="chat-quick">
                {RECIPIENT_KEYS.map(k => (
                  <button key={k} onClick={() => startFlow(k)}>{(t.recipients as Record<string, string>)[k]}</button>
                ))}
              </div>
            )}
            {m.withBudget && (
              <div className="chat-quick">
                {BUDGET_KEYS.map(k => (
                  <button key={k} onClick={() => pickBudget(m.recipient!, k)}>{(t.budget as Record<string, string>)[k]}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {messages.length === 2 && (
          <div className="chat-quick" style={{ marginTop: 0 }}>
            {RECIPIENT_KEYS.map(k => (
              <button key={k} onClick={() => startFlow(k)}>{(t.recipients as Record<string, string>)[k]}</button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-input">
        <div className="chat-input-row">
          <input
            placeholder={lang === "tr" ? "Bir şey yaz veya yukarıdan seç…" : "Type something or pick above…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
          />
          <button className="send" onClick={() => send()} title="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
        <div className="chat-meta">
          <span>AI · POWERED BY GEMINI</span>
          <span>⌘K</span>
        </div>
      </div>
    </div>
  );
}
