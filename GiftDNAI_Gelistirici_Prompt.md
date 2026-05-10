# Gift DN-AI — Full-Stack Geliştirici Promptu
> Hackathon Build Promptu · React Web + React Native · Supabase · LangChain.js · OpenAI · SerpAPI

---

## 1. Proje Genel Bakış

**Gift DN-AI**, karar yorgunluğunu ortadan kaldıran, iki dilli (Türkçe / İngilizce) yapay zeka destekli bir hediye öneri platformudur. Sistem, adaptif bir AI anketi aracılığıyla kullanıcıyı tanır ve SerpAPI üzerinden Google Shopping'den çekilen gerçek ürün linkleriyle birlikte en uygun 3 hediyeyi önerir. Platform aynı zamanda kullanıcıların hediye deneyimlerini paylaştığı bir Topluluk Akışı (Community Feed) içerir.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Web Frontend | React.js (Vite) |
| Mobil Frontend | React Native (Expo) |
| Paylaşılan Mantık | Monorepo içinde ortak hook/util (`/packages/shared`) |
| Backend & Veritabanı | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI Orkestrasyon | LangChain.js + OpenAI API (GPT-4o) |
| Ürün Arama | SerpAPI — Google Shopping endpoint |
| Çoklu Dil | i18next (TR / EN) |
| State Yönetimi | Zustand |
| Stil (Web) | Tailwind CSS |
| Stil (Mobil) | NativeWind (React Native için Tailwind) |

---

## 3. Monorepo Yapısı

```
gift-dnai/
├── apps/
│   ├── web/                  # React.js (Vite)
│   └── mobile/               # React Native (Expo)
├── packages/
│   └── shared/
│       ├── hooks/            # useQuiz, useCommunity, useAuth
│       ├── services/         # langchain.service.ts, serp.service.ts, supabase.ts
│       ├── store/            # Zustand store'ları
│       ├── types/            # Ortak TypeScript tipleri
│       └── i18n/             # TR + EN çeviri dosyaları
├── supabase/
│   ├── migrations/           # Veritabanı şema migration'ları
│   └── functions/            # Edge Function'lar
└── package.json              # Workspace kökü
```

---

## 4. Kimlik Doğrulama (Auth)

**Supabase Auth** kullan.

- Desteklenen yöntemler: E-posta/Şifre + Google OAuth
- Kayıt sonrası Supabase `on_auth_user_created` trigger'ı ile `profiles` tablosuna otomatik satır oluştur.
- Korumalı sayfalar: Tüm anket, sonuçlar, topluluk gönderisi oluşturma ve istek listesi sayfaları giriş gerektirir.
- Açık sayfalar: Ana sayfa, Topluluk Akışı (yalnızca okuma).
- Oturum yönetimi için Supabase'in dahili mekanizmasını hem web hem mobilde kullan.

---

## 5. Veritabanı Şeması

Aşağıdaki migration'ları Supabase'de çalıştır:

```sql
-- profiller
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  language text default 'tr',
  created_at timestamptz default now()
);

-- anket oturumları
create table quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  initial_chips jsonb,         -- { recipient: ["anne","baba"], budget: "500-1000" }
  conversation_history jsonb,  -- LangChain için { role, content } dizisi
  current_turn int default 0,
  confidence_score float default 0,
  status text default 'active', -- active | completed | abandoned
  language text default 'tr',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- hediye önerileri
create table gift_suggestions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade,
  product_name text,
  product_description text,
  reasoning text,              -- AI'ın bu hediyeyi neden seçtiği
  serp_results jsonb,          -- Ham SerpAPI yanıtı
  product_link text,
  product_image text,
  current_price text,
  source_store text,
  rank int,                    -- 1, 2, 3
  created_at timestamptz default now()
);

-- topluluk gönderileri
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_id uuid references quiz_sessions(id),
  suggestion_id uuid references gift_suggestions(id),
  product_name text,
  product_image text,
  product_link text,
  feedback_text text,
  recipient_label text,        -- "Annem için" / "Arkadaşım için"
  is_anonymous boolean default false,
  likes_count int default 0,
  created_at timestamptz default now()
);

-- gönderi beğenileri (tekrar beğeniyi önlemek için)
create table post_likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- istek listeleri
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id),
  product_name text,
  product_link text,
  product_image text,
  note text,
  created_at timestamptz default now()
);
```

Tüm tablolarda **Row Level Security (RLS)** aktif et. Her kullanıcı yalnızca kendi satırlarını okuyup yazabilir; `community_posts` herkese açık (read-only) olur.

---

## 6. Temel Özellik: Adaptif AI Anketi

### 6.1 Başlangıç Chip'leri (Sabit Sorular)

AI anketi başlamadan önce chip tabanlı seçiciler göster. Bunlar **çoklu seçime** izin verir.

**Kime hediye alınıyor (çoklu seçim):**
`Sevgili`, `Anne`, `Baba`, `Arkadaş`, `Kardeş`, `İş Arkadaşı`, `Çocuk`, `Diğer`

**Bütçe (tekli seçim):**
`0–250 TL`, `250–500 TL`, `500–1000 TL`, `1000–3000 TL`, `3000+ TL`

Seçimler `quiz_sessions.initial_chips` alanına kaydedilir.

### 6.2 LangChain Adaptif Anket Motoru

`/packages/shared/services/langchain.service.ts` içinde uygula.

Anket **Güven Eşiği (Confidence Threshold) Algoritması** ile çalışır:

- Maksimum **10 dinamik soru** sorulur.
- Her yanıttan sonra LLM bir `confidence_score` (0–1) hesaplar.
- `confidence_score >= 0.85` ise anket erken bitirilir, hediye önerileri üretilir.
- Tur sayısı 10'a ulaşırsa mevcut verilerle zorla çıkış yapılır ve hediyeler üretilir.

#### Sistem Promptu Şablonu:

```
Sen Gift DN-AI adlı bir hediye öneri asistanısın.
Amacın, akıllı ve kişiselleştirilmiş sorular sorarak hediye alınacak kişiyi derinlemesine tanımaktır.

Bağlam:
- Alıcı tipi: {recipients}
- Bütçe: {budget}
- Dil: {language} (yalnızca bu dilde yanıt ver)
- Mevcut tur: {current_turn} / 10
- Önceki yanıtlar: {conversation_history}

Yanıtın MUTLAKA aşağıdaki yapıda geçerli bir JSON nesnesi olmalıdır:
{
  "question": "Bir sonraki sorun (yeterince emin isen null)",
  "question_type": "text | single_choice | multi_choice",
  "options": ["seçenek1", "seçenek2"] veya null,
  "confidence_score": 0.0 ile 1.0 arasında,
  "reasoning": "Bu soruyu neden sorduğuna dair kısa bir not"
}

Kurallar:
1. confidence_score >= 0.85 VEYA tur >= 10 ise → question alanını null yap (hediye üretimini tetikler)
2. Her soru bir öncekinden farklı olmalıdır
3. Sorular doğal, sıcak ve sohbet tonunda olmalıdır
4. Genelden özele doğru ilerle
5. Yalnızca {language} dilinde yanıt ver
```

#### Hediye Üretim Promptu (anket bitince tetiklenir):

```
Bu konuşmaya dayanarak tam olarak 3 hediye öner.
Alıcı: {recipients}, Bütçe: {budget}
Konuşma: {conversation_history}
Dil: {language}

YALNIZCA aşağıdaki yapıda geçerli bir JSON dizisi döndür:
[
  {
    "rank": 1,
    "product_name": "Arama için spesifik ürün adı",
    "search_query": "Google Shopping için optimize edilmiş arama sorgusu",
    "reasoning": "Bu hediyenin bu kişiye neden uygun olduğu",
    "description": "Kısa hediye açıklaması"
  },
  ...
]
```

### 6.3 SerpAPI Google Shopping Entegrasyonu

`/packages/shared/services/serp.service.ts` içinde uygula.

Hediye üretimi tamamlandıktan sonra 3 hediyenin her biri için SerpAPI çağrısı yap:

```typescript
const params = {
  engine: "google_shopping",
  q: gift.search_query,
  gl: "tr",          // Türkiye
  hl: language,      // tr veya en
  api_key: SERP_API_KEY,
  num: 3
};
// Endpoint: https://serpapi.com/search.json
```

Yanıttan şunları çıkar:
- `title` → product_name
- `link` → product_link
- `thumbnail` → product_image
- `price` → current_price
- `source` → source_store

Her hediye için en iyi sonucu `gift_suggestions` tablosuna kaydet. Ham 3 sonucu kullanıcıya göster, kullanıcı istediğini seçebilsin.

---

## 7. Sonuçlar Sayfası

Anket bittikten sonra 3 hediye kartını göster. Her kart şunları içerir:

- Ürün görseli (SerpAPI'dan)
- Ürün adı
- AI'ın gerekçesi (bu hediye neden seçildi)
- Güncel fiyat + mağaza adı
- "Ürünü Görüntüle" butonu (product_link'i açar)
- "İstek Listesine Ekle" butonu
- "Toplulukla Paylaş" butonu (geri bildirim metni + anonim seçeneği olan bir modal açar)

---

## 8. Topluluk Akışı (Sosyal Keşfet)

Tüm kullanıcıların gönderilerini gösteren Pinterest tarzı bir masonry grid akışı.

Her gönderi kartı şunları gösterir:

- Ürün görseli
- Ürün adı + mağaza
- Alıcı etiketi (ör. "Annem için")
- Kullanıcının geri bildirim metni
- Yazar (anonim ise "Anonim")
- Beğeni sayısı + Beğeni butonu
- "İstek Listesine Ekle" butonu

**Filtreleme:** Akışın üstünde alıcı tipi chip'leriyle filtreleme.

**Sıralama:** En Yeni / En Çok Beğenilen

**Sayfalama:** Supabase cursor tabanlı sonsuz kaydırma (infinite scroll).

---

## 9. İstek Listesi Sayfası

Kullanıcının Sonuçlar veya Topluluk Akışı'ndan kaydettiği hediyelerin listelendiği kişisel sayfa. Her öğede not alanı ve kaldırma butonu bulunur.

---

## 10. Çoklu Dil (i18n)

Web için `i18next` + `react-i18next`, mobil için eşdeğerini kullan.

Desteklenen diller: `tr` (varsayılan), `en`

Dil tercihi `profiles.language` alanına ve localStorage/AsyncStorage'a kaydedilir.

Tüm arayüz metinleri, chip etiketleri ve AI yanıtları seçilen dile göre şekillenmelidir.

Çeviri dosyalarını şu konumlara oluştur: `/packages/shared/i18n/tr.json` ve `/packages/shared/i18n/en.json`

---

## 11. Supabase Edge Function'ları

Aşağıdaki Edge Function'ları oluştur (Deno runtime):

### `POST /quiz/next-question`
Girdi: `{ session_id, user_answer }`
- Yanıtı `conversation_history`'e ekler
- LangChain aracılığıyla OpenAI'ı çağırır
- Şunu döndürür: `{ question, question_type, options, confidence_score }`
- Güven >= 0.85 veya tur >= 10 ise hediye üretim akışını tetikler

### `POST /quiz/generate-gifts`
Girdi: `{ session_id }`
- OpenAI'ı çağırarak 3 hediye nesnesi üretir
- Her biri için SerpAPI'yi çağırır
- `gift_suggestions` tablosuna ekler
- Tam verilerle zenginleştirilmiş 3 öneriyi döndürür

### `POST /community/like`
Girdi: `{ post_id }`
- Oturum açmış kullanıcı için beğeniyi aç/kapat
- `community_posts` tablosundaki `likes_count` alanını günceller

---

## 12. UI/UX Yönergeleri

- **Tasarım dili:** Temiz, sıcak, modern. Yuvarlak kartlar, soft gölgeler, mercan/sıcak tonlarda birincil renk paleti.
- **Marka:** "Gift DN-AI" logo metni, küçük bir hediye/DNA ikonu ile.
- **Anket UX'i:** İlerleme göstergesi göster (ör. "Soru 3 / maks. 10"). Sorular arasında kayma/solma geçiş animasyonu.
- **Sonuçlar UX'i:** Kartları kademeli (staggered) animasyonla teker teker göster.
- **Topluluk Akışı:** Web'de masonry grid (2–3 sütun), mobilde tek sütun.
- **Yükleme durumları:** AI düşünürken iskelet (skeleton) yükleyiciler kullan.
- **Hata durumları:** Yeniden deneme seçeneğiyle birlikte kullanıcı dostu hata mesajları.

---

## 13. Ortam Değişkenleri

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Yalnızca Edge Function'lar için

# OpenAI
OPENAI_API_KEY=

# SerpAPI
SERP_API_KEY=

# Uygulama
VITE_APP_URL=http://localhost:5173
```

---

## 14. MVP Kapsamı (Hackathon)

Aşağıdaki öncelik sırasına göre geliştir:

1. ✅ Supabase proje kurulumu + DB şeması + Auth
2. ✅ Başlangıç chip'leri arayüzü (web)
3. ✅ Adaptif anket arayüzü + LangChain Edge Function
4. ✅ SerpAPI entegrasyonu + Sonuçlar sayfası
5. ✅ Topluluk Akışı (okuma + gönderi + beğeni)
6. ✅ İstek Listesi
7. ✅ i18n (TR/EN dil geçişi)
8. ✅ React Native mobil (Expo) — aynı ekranlar, ortak mantık
9. ⬜ Animasyon ve responsive tasarım cilası

---

## 15. Kapsam Dışı (Hackathon Sonrası)

- Push bildirimleri / hatırlatıcılar
- Affiliate link monetizasyonu
- Gelişmiş analitik dashboard
