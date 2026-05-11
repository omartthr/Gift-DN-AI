import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "İstek Listem · Gift DN-AI",
  description: "Kaydettiğin hediye önerileri.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}
