import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Giriş Yap | Gift DN-AI",
  description: "Gift DN-AI hesabınıza giriş yapın veya kayıt olun.",
};

export default function AuthPage() {
  return <AuthClient />;
}
