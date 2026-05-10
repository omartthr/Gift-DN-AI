# 🎁 Gift DN-AI

**Gift DN-AI**, karar yorgunluğunu ortadan kaldıran, iki dilli (🇹🇷 Türkçe / 🇬🇧 İngilizce) yapay zeka destekli hediye öneri platformudur. Sistem, adaptif bir AI anketi aracılığıyla kullanıcıyı tanır ve Google Shopping'den çekilen gerçek ürün linkleriyle birlikte en uygun 3 hediyeyi önerir.

---

## 🚀 Proje Vizyonu

Gift DN-AI, kullanıcıların doğru hediyeyi doğru zamanda bulmalarını sağlayan üç temel direk üzerine inşa edilmiştir:

- 🤖 **Adaptif AI Anketi** — Maks. 10 soru ile kişiye özel hediye analizi (Güven Eşiği Algoritması)
- 🛍️ **Gerçek Ürünler** — SerpAPI + Google Shopping ile anlık fiyat ve bağlantılar
- 💬 **Sosyal Keşfet** — Gerçek kullanıcı deneyimlerinden ilham al (Community Feed)

---

## 💻 Teknoloji Yığını

| Katman | Teknoloji |
| :--- | :--- |
| **Web Frontend** | React.js (Vite) + TypeScript |
| **Mobil Frontend** | React Native (Expo) |
| **Backend & Veritabanı** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI Orkestrasyon** | OpenAI GPT-4o |
| **Ürün Arama** | SerpAPI — Google Shopping |
| **Çoklu Dil** | i18next (TR / EN) |
| **State Yönetimi** | Zustand |
| **Stil (Web)** | Vanilla CSS (Dark Theme) |

---

## 📁 Proje Yapısı

```
gift-dnai/
├── apps/
│   └── web/                  # React.js (Vite) — Web Uygulaması
│       └── src/
│           ├── components/   # Navbar, ShareModal
│           ├── pages/        # Home, Auth, Quiz, Results, Community, Wishlist
│           ├── store/        # Zustand: authStore, quizStore
│           └── lib/          # Supabase client
├── packages/
│   └── shared/
│       ├── i18n/             # tr.json + en.json çeviri dosyaları
│       ├── services/         # Supabase client
│       └── types/            # TypeScript tipleri
└── supabase/
    ├── migrations/           # 001_initial_schema.sql
    └── functions/
        ├── next-question/    # Adaptif Anket Edge Function
        ├── generate-gifts/   # Hediye Üretim + SerpAPI Edge Function
        └── community-like/   # Beğeni Toggle Edge Function
```

---

## ⚙️ Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd apps/web
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`apps/web/.env.local` dosyası oluştur (`.env.example`'ı kopyala):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_URL=http://localhost:5173
```

### 3. Supabase Veritabanını Kur

Supabase SQL Editor'da şu dosyayı çalıştır:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Edge Function'ları Deploy Et

```bash
supabase functions deploy next-question
supabase functions deploy generate-gifts
supabase functions deploy community-like
```

Edge Function'lar için secrets ayarla:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SERP_API_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### 5. Uygulamayı Başlat

```bash
cd apps/web
npm run dev
# → http://localhost:5173
```

---

## 🗄️ Veritabanı Şeması

| Tablo | Açıklama |
| :--- | :--- |
| `profiles` | Kullanıcı profilleri (auth trigger ile otomatik oluşur) |
| `quiz_sessions` | Anket oturumları, konuşma geçmişi, güven skoru |
| `gift_suggestions` | AI tarafından üretilen hediye önerileri + SerpAPI verileri |
| `community_posts` | Topluluk paylaşımları |
| `post_likes` | Beğeni kayıtları (tekrar beğeniyi önlemek için) |
| `wishlists` | Kullanıcı istek listeleri |

---

## 🌐 Sayfalar

| Sayfa | Yol | Erişim |
| :--- | :--- | :--- |
| Ana Sayfa | `/` | Herkese açık |
| Giriş / Kayıt | `/auth` | Herkese açık |
| Hediye Anketi | `/quiz` | Giriş gerekli |
| Sonuçlar | `/results` | Giriş gerekli |
| Topluluk Akışı | `/community` | Herkese açık |
| İstek Listesi | `/wishlist` | Giriş gerekli |

---

## 🔒 Güvenlik

- Tüm tablolarda **Row Level Security (RLS)** aktif
- API anahtarları `.env.local` içinde saklanır (Git'e eklenmez)
- Edge Function'lar `SUPABASE_SERVICE_ROLE_KEY` kullanır (yalnızca sunucu tarafında)

---

*Gift DN-AI — Hackathon Projesi © 2026*
