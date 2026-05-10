import type { Metadata } from "next";
import ResultsClient from "./ResultsClient";

export const metadata: Metadata = {
  title: "Hediye Önerileri | Gift DN-AI",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
