"use client";

const tr = {
  common: { loading: "Yükleniyor...", error: "Bir hata oluştu.", retry: "Tekrar Dene", save: "Kaydet", cancel: "İptal", close: "Kapat", anonymous: "Anonim" },
  nav: { home: "Ana Sayfa", quiz: "Hediye Bul", community: "Topluluk", wishlist: "İstek Listesi", login: "Giriş Yap", logout: "Çıkış Yap" },
  home: { title: "Mükemmel Hediyeyi Bul", subtitle: "Yapay zeka destekli hediye önerisiyle doğru kişiye doğru hediyeyi seç", cta: "Hemen Başla", features: { ai: "Akıllı AI Anketi", ai_desc: "Kişiselleştirilmiş sorularla hediye alınacak kişiyi tanıyoruz", real: "Gerçek Ürünler", real_desc: "Google Shopping'den anlık fiyat ve ürün bilgileri", community: "Topluluk Deneyimleri", community_desc: "Başkalarının hediye deneyimlerinden ilham al" } },
  quiz: {
    title: "Hediye Kaşifi", subtitle: "Kim için hediye arıyorsun?", recipient_label: "Hediye Alınacak Kişi (Çoklu seçim)", budget_label: "Bütçe",
    start: "Ankete Başla", thinking: "AI düşünüyor...", your_answer: "Cevabınızı yazın...", next: "Devam Et",
    recipients: { sevgili: "Sevgili", anne: "Anne", baba: "Baba", arkadas: "Arkadaş", kardes: "Kardeş", is_arkadasi: "İş Arkadaşı", cocuk: "Çocuk", diger: "Diğer" },
    budgets: { "0_250": "0 – 250 ₺", "250_500": "250 – 500 ₺", "500_1000": "500 – 1.000 ₺", "1000_3000": "1.000 – 3.000 ₺", "3000_plus": "3.000+ ₺" },
  },
  results: { title: "İşte Önerilen Hediyeler!", subtitle: (n: number) => `AI sana özel ${n} hediye seçti`, view_product: "Ürünü Görüntüle", add_wishlist: "İstek Listesine Ekle", share_community: "Toplulukla Paylaş", added_wishlist: "İstek listesine eklendi!", rank: (r: number) => `${r}. Öneri`, why: "Neden bu hediye?" },
  community: { title: "Topluluk Akışı", subtitle: "Gerçek kullanıcı deneyimlerinden ilham al", filter_all: "Tümü", sort_newest: "En Yeni", sort_popular: "En Popüler", add_wishlist: "İstek Listesine Ekle", share_modal_title: "Deneyimini Paylaş", feedback_placeholder: "Bu hediye nasıldı?", recipient_placeholder: "Kim için? (ör. Annem için)", share_anon: "Anonim paylaş", share_submit: "Paylaş" },
  wishlist: { title: "İstek Listesi", empty: "Henüz bir şey eklemedin.", empty_cta: "Topluluk Akışını Keşfet", note_placeholder: "Not ekle...", view_product: "Ürüne Git", remove: "Listeden Kaldır" },
  auth: { login_title: "Hoş Geldin", register_title: "Hesap Oluştur", email: "E-posta", password: "Şifre", name: "Ad Soyad", login: "Giriş Yap", register: "Kayıt Ol", google: "Google ile Devam Et", no_account: "Hesabın yok mu? Kayıt ol", has_account: "Zaten hesabın var mı? Giriş yap" },
};

const en = {
  common: { loading: "Loading...", error: "Something went wrong.", retry: "Retry", save: "Save", cancel: "Cancel", close: "Close", anonymous: "Anonymous" },
  nav: { home: "Home", quiz: "Find a Gift", community: "Community", wishlist: "Wishlist", login: "Login", logout: "Logout" },
  home: { title: "Find the Perfect Gift", subtitle: "AI-powered gift suggestions to find the right gift for the right person", cta: "Get Started", features: { ai: "Smart AI Quiz", ai_desc: "Personalized questions to understand the recipient", real: "Real Products", real_desc: "Live prices from Google Shopping", community: "Community Experiences", community_desc: "Get inspired by others' gift experiences" } },
  quiz: {
    title: "Gift Explorer", subtitle: "Who are you shopping for?", recipient_label: "Gift Recipient (Multiple choice)", budget_label: "Budget",
    start: "Start Quiz", thinking: "AI is thinking...", your_answer: "Type your answer...", next: "Continue",
    recipients: { sevgili: "Partner", anne: "Mom", baba: "Dad", arkadas: "Friend", kardes: "Sibling", is_arkadasi: "Colleague", cocuk: "Child", diger: "Other" },
    budgets: { "0_250": "0 – 250 ₺", "250_500": "250 – 500 ₺", "500_1000": "500 – 1,000 ₺", "1000_3000": "1,000 – 3,000 ₺", "3000_plus": "3,000+ ₺" },
  },
  results: { title: "Here Are Your Gift Suggestions!", subtitle: (n: number) => `AI picked ${n} gifts just for you`, view_product: "View Product", add_wishlist: "Add to Wishlist", share_community: "Share with Community", added_wishlist: "Added to wishlist!", rank: (r: number) => `Suggestion #${r}`, why: "Why this gift?" },
  community: { title: "Community Feed", subtitle: "Get inspired by real user experiences", filter_all: "All", sort_newest: "Newest", sort_popular: "Most Popular", add_wishlist: "Add to Wishlist", share_modal_title: "Share Your Experience", feedback_placeholder: "How was this gift?", recipient_placeholder: "For whom? (e.g. For my mom)", share_anon: "Share anonymously", share_submit: "Share" },
  wishlist: { title: "Wishlist", empty: "You haven't added anything yet.", empty_cta: "Explore Community Feed", note_placeholder: "Add a note...", view_product: "Go to Product", remove: "Remove from List" },
  auth: { login_title: "Welcome Back", register_title: "Create Account", email: "Email", password: "Password", name: "Full Name", login: "Login", register: "Sign Up", google: "Continue with Google", no_account: "Don't have an account? Sign up", has_account: "Already have an account? Login" },
};

export type Lang = "tr" | "en";
export type Translations = typeof tr;

const translations = { tr, en };

import { create } from "zustand";

interface I18nStore {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

export const useI18n = create<I18nStore>((set) => ({
  lang: (typeof window !== "undefined" ? localStorage.getItem("gift-lang") as Lang : null) || "tr",
  t: translations.tr,
  setLang: (lang) => {
    if (typeof window !== "undefined") localStorage.setItem("gift-lang", lang);
    set({ lang, t: translations[lang] });
  },
}));
