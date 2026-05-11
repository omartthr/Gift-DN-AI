import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "Topluluk · Gift DN-AI",
  description: "Gerçek hediyeler, gerçek anılar. Topluluk üyelerinin paylaştığı hediye deneyimleri.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
