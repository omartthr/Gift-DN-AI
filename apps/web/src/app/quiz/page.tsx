import type { Metadata } from "next";
import { Suspense } from "react";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Hediye Bul · Gift DN-AI",
  description: "AI destekli hediye anketi. Kişiye özel mükemmel hediyeyi bul.",
};

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="fade-in" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="col gap-16 items-center">
          <span className="dots"><span></span><span></span><span></span></span>
          <span className="eyebrow">Yükleniyor…</span>
        </div>
      </div>
    }>
      <QuizClient />
    </Suspense>
  );
}
