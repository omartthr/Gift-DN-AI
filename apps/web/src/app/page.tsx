import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Gift DN-AI · AI Gift Editor",
  description: "Gift DN-AI — Yapay zeka destekli hediye öneri platformu. Doğru hediyeyi doğru kişiye bul.",
};

export default function HomePage() {
  return <HomeClient />;
}
