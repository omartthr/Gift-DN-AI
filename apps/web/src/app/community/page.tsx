import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "Topluluk Akışı | Gift DN-AI",
  description: "Gerçek kullanıcı hediye deneyimlerinden ilham al.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
