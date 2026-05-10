import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "İstek Listesi | Gift DN-AI",
};

export default function WishlistPage() {
  return <WishlistClient />;
}
