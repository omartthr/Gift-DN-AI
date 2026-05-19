# Gift DN-AI

> **Karar yorgunluğuna son.** Adaptif yapay zeka anketiyle alıcıyı tanıyan, Google Shopping üzerinden gerçek ürünleri öneren, iki dilli (TR / EN) hediye keşif platformu.

Gift DN-AI; web (Next.js) ve mobil (Expo) istemcileri, Supabase tabanlı bir backend ve Gemini + SerpAPI ile çalışan Edge Function'lar üzerine kurulmuş tam yığın bir hediye öneri sistemidir. Kullanıcıya en fazla 10 soruluk uyarlanabilir bir anket sunar, güven eşiği aşıldığında durur ve gerçek satın alma linkleriyle birlikte 3 kişiselleştirilmiş öneri üretir.

---

## İçindekiler

- [Öne Çıkan Özellikler](#öne-çıkan-özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Mimari Bakış](#mimari-bakış)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Supabase Kurulumu](#supabase-kurulumu)
- [Edge Function Deploy](#edge-function-deploy)
- [Mobil Uygulama](#mobil-uygulama)
- [Veritabanı Şeması](#veritabanı-şeması)
- [Sayfalar ve Yollar](#sayfalar-ve-yollar)
- [Ödeme ve Abonelik](#ödeme-ve-abonelik)
- [Güvenlik](#güvenlik)
- [Geliştirme Komutları](#geliştirme-komutları)

---

## Öne Çıkan Özellikler

- **Adaptif AI Anketi** — Gemini 2.5 Flash, kullanıcının önceki cevaplarına göre bir sonraki soruyu üretir; güven skoru eşiği aştığında veya 10 soruya ulaşıldığında anket durur.
- **Gerçek Ürün Önerileri** — SerpAPI / Google Shopping entegrasyonu ile anlık fiyat, görsel ve satın alma linkleri.
- **Topluluk Akışı** — Kullanıcılar hediye deneyimlerini paylaşır, beğenir ve ilham alır.
- **İstek Listesi** — Beğenilen önerileri kaydet, sonra geri dön.
- **Çift Dil Desteği** — i18next ile Türkçe / İngilizce.
- **Çapraz Platform** — Aynı backend üzerinde çalışan Next.js web ve Expo mobil istemcileri.
- **Stripe Abonelik** — Pro plan üzerinden sınırsız anket ve premium özellikler.

---

## Teknoloji Yığını

| Katman | Teknoloji |
| :--- | :--- |
| Web Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Stil | Tailwind CSS 4 + Motion (animasyon) + OGL (WebGL efektler) |
| Mobil | Expo 54 + Expo Router 6 + React Native 0.81 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| AI | Google Gemini 2.5 Flash |
| Ürün Arama | SerpAPI — Google Shopping |
| Ödeme | Stripe (Checkout + Webhooks) |
| State | Zustand |
| i18n | i18next + react-i18next |

---

## Mimari Bakış

```
┌──────────────┐      ┌──────────────┐
│  Web (Next)  │      │ Mobile (Expo)│
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ▼
       ┌────────────────────┐
       │ Supabase Auth + DB │
       │   (RLS politikalı) │
       └─────────┬──────────┘
                 │
                 ▼
       ┌────────────────────┐
       │   Edge Functions   │
       │ next-question      │──► Gemini 2.5 Flash
       │ generate-gifts     │──► Gemini + SerpAPI
       │ community-like     │
       └────────────────────┘
```

İstemciler doğrudan Supabase'e bağlanır (Auth + DB); AI ve harici API çağrıları Edge Function'lar üzerinden, Service Role Key ile sunucu tarafında yapılır.

---

## Proje Yapısı

```
Gift-DN-AI/
├── apps/
│   ├── web/                      # Next.js 16 (App Router)
│   │   └── src/
│   │       ├── app/              # Route'lar: /, /auth, /quiz, /results,
│   │       │                     #   /community, /wishlist, /history,
│   │       │                     #   /pricing, /success, /api/*
│   │       ├── components/       # Navbar, ShareModal, UI parçaları
│   │       ├── store/            # Zustand: authStore, quizStore
│   │       ├── lib/              # Supabase client, helpers
│   │       └── types/            # TypeScript tipleri
│   └── mobile/                   # Expo + Expo Router
│       ├── app/                  # Mobil route'lar
│       ├── components/
│       └── lib/
├── packages/
│   └── shared/                   # Ortak i18n, tipler, servisler
│       ├── i18n/                 # tr.json, en.json
│       ├── services/
│       └── types/
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_fix_rls_policies.sql
    │   ├── 003_add_stripe_columns.sql
    │   └── 004_extend_wishlists.sql
    └── functions/
        ├── next-question/        # Adaptif soru üretimi
        ├── generate-gifts/       # Hediye + SerpAPI
        └── community-like/       # Beğeni toggle
```

---

## Kurulum

### Önkoşullar

- Node.js 20+
- npm 10+ (workspaces destekli)
- Supabase CLI (Edge Function deploy için)
- Expo CLI (mobil geliştirme için, opsiyonel)

### 1) Bağımlılıkları Yükle

Repo bir npm workspace projesidir:

```bash
git clone <repo-url>
cd Gift-DN-AI
npm install
```

### 2) Web Uygulamasını Başlat

```bash
npm run dev:web
# → http://localhost:3000
```

---

## Ortam Değişkenleri

`apps/web/.env.local` dosyası oluştur:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (Pro abonelik için)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
```

Edge Function secrets (sunucu tarafı, repo'ya **eklenmez**):

```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set SERP_API_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Supabase Kurulumu

1. [supabase.com](https://supabase.com) üzerinden yeni bir proje oluştur.
2. SQL Editor'de migration'ları **sırayla** çalıştır:

   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_fix_rls_policies.sql
   supabase/migrations/003_add_stripe_columns.sql
   supabase/migrations/004_extend_wishlists.sql
   ```

3. Authentication → Providers'tan Email auth'u etkinleştir.
4. Project URL ve `anon` key değerlerini `.env.local` dosyana ekle.

---

## Edge Function Deploy

```bash
supabase login
supabase link --project-ref <project-ref>

supabase functions deploy next-question
supabase functions deploy generate-gifts
supabase functions deploy community-like
```

| Function | Görev |
| :--- | :--- |
| `next-question` | Konuşma geçmişine bakarak bir sonraki soruyu üretir, güven skoru hesaplar. |
| `generate-gifts` | Profil + cevaplardan 3 hediye üretir, SerpAPI ile gerçek ürün eşler. |
| `community-like` | Beğeni toggle (idempotent, RLS uyumlu). |

---

## Mobil Uygulama

```bash
cd apps/mobile
npm run start          # Expo dev server
npm run ios            # iOS simulator
npm run android        # Android emulator
```

Mobil için Supabase ortam değişkenleri `apps/mobile/lib/` altındaki config dosyalarından okunur. Detay için [apps/mobile/README.md](apps/mobile/README.md).

---

## Veritabanı Şeması

| Tablo | Açıklama |
| :--- | :--- |
| `profiles` | Kullanıcı profili — auth trigger ile otomatik oluşturulur. Stripe abonelik alanları içerir. |
| `quiz_sessions` | Anket oturumları, konuşma geçmişi (jsonb), güven skoru. |
| `gift_suggestions` | AI tarafından üretilen öneriler + SerpAPI ürün verileri. |
| `community_posts` | Topluluk paylaşımları. |
| `post_likes` | Beğeniler — `(user_id, post_id)` unique. |
| `wishlists` | Kullanıcının kayıtlı hediyeleri (4. migration ile genişletildi). |

Tüm tablolarda **Row Level Security (RLS)** aktiftir; politika dosyaları `002_fix_rls_policies.sql` içindedir.

---

## Sayfalar ve Yollar

| Sayfa | Yol | Erişim |
| :--- | :--- | :--- |
| Ana Sayfa | `/` | Herkese açık |
| Giriş / Kayıt | `/auth` | Herkese açık |
| Hediye Anketi | `/quiz` | Giriş gerekli |
| Sonuçlar | `/results` | Giriş gerekli |
| Geçmiş | `/history` | Giriş gerekli |
| Topluluk | `/community` | Herkese açık |
| İstek Listesi | `/wishlist` | Giriş gerekli |
| Fiyatlandırma | `/pricing` | Herkese açık |
| Başarılı Ödeme | `/success` | Giriş gerekli |

---

## Ödeme ve Abonelik

- **Stripe Checkout** ile Pro plan satışı (`/pricing`).
- Webhook endpoint: `/api/webhooks/stripe` — abonelik durumunu `profiles` tablosuna yazar.
- Pro kullanıcılar sınırsız anket ve gelişmiş öneri kalitesi alır.

---

## Güvenlik

- Tüm tablolarda Row Level Security (RLS) aktif.
- `SUPABASE_SERVICE_ROLE_KEY` yalnızca Edge Function'larda kullanılır; istemciye gönderilmez.
- API anahtarları `.env.local` ve `supabase secrets` üzerinden yönetilir, repo'ya commit'lenmez.
- Stripe webhook imzaları doğrulanır.

---

## Geliştirme Komutları

| Komut | Açıklama |
| :--- | :--- |
| `npm run dev` | Web uygulamasını başlatır (alias `dev:web`). |
| `npm run dev:web` | Next.js dev server (port 3000). |
| `npm run build:web` | Next.js production build. |
| `npm --workspace=apps/web run lint` | ESLint çalıştırır. |
| `npm --workspace=apps/mobile run start` | Expo dev server. |

---

*Gift DN-AI — Hackathon Projesi © 2026*
