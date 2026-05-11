import type { Metadata } from "next";
import ResultsClient from "./ResultsClient";

export const metadata: Metadata = {
  title: "Hediye Önerileri · Gift DN-AI",
  description: "AI tarafından seçilmiş kişiye özel hediye önerileri.",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
