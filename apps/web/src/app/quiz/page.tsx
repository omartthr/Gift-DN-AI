import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Hediye Bul | Gift DN-AI",
  description: "AI destekli anket ile mükemmel hediyeyi bul.",
};

export default function QuizPage() {
  return <QuizClient />;
}
