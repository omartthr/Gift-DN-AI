import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Gift DN-AI | Mükemmel Hediyeyi Bul",
  description: "Yapay zeka destekli hediye öneri platformu. Doğru hediyeyi doğru kişiye bul.",
};

export default function HomePage() {
  return <HomeClient />;
}
