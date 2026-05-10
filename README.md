# 🎁 Gift DN-AI

**Gift DN-AI**, karar yorgunluğunu ortadan kaldıran, %100 gizlilik odaklı (URL/Eklenti gerektirmeyen) kapalı devre bir yapay zeka asistanıdır. Platform, hem bireysel bir hediye bulma aracı hem de yaşayan bir sosyal alışveriş ekosistemi olarak tasarlanmıştır.

## 🚀 Proje Vizyonu
Gift DN-AI, kullanıcıların doğru hediyeyi doğru zamanda bulmalarını sağlayan üç temel direk üzerine inşa edilmiştir:
- **Adaptif AI Anketi:** Kullanıcıyı yormayan, dinamik soru akışı.
- **Sosyal Keşfet Vitrini:** Gerçek kullanıcı deneyimlerinden ilham alan akış.
- **Akıllı Fiyat Asistanı:** E-ticaret indirim döngülerini takip eden tasarruf mekanizması.

## 🛠️ Temel Modüller

### 1. AI Hediye Kaşifi (Adaptif Anket)
LangChain tabanlı ve "Emin Olma (Confidence)" algoritmasıyla çalışan dinamik bir sistemdir.
- **Maksimum 10 Soru:** Sabit anketler yerine, her adımda önceki cevaba göre şekillenen sohbet akışı.
- **Erken Çıkış:** Eğer AI 3. veya 4. soruda hedefi netleştirirse (Skor > %85), analizi bitirir.
- **Sosyal Kanıt:** Ürünler, müşteri yorumları analiziyle puanlanarak sunulur.

### 2. Doğru Zamanda Al (Akıllı Fiyat & Hatırlatıcı)
Kullanıcıyı anında satın alma baskısından kurtarır ve doğru zamanda alım yapması için uyarır.
- **İndirim Takibi:** 11.11, Efsane Cuma gibi döngüleri tarar.
- **Tahminleme:** "Bu ürünü şimdi alma, Eylül'de yenisi çıkınca eskisi %25 düşecek" gibi tavsiyeler verir.
- **Hatırlatıcı:** Supabase `pg_cron` ile otomatik hatırlatıcılar ve bildirimler gönderir.

### 3. Sosyal Keşfet (Community Feed)
Kullanıcıların AI analiz sonuçlarını ve aldıkları hediyeleri paylaştığı "Pinterest-vari" bir ilham akışıdır. Kullanıcılar başarılı "hediye reçetelerini" doğrudan kendi İstek Listelerine (Wishlist) ekleyebilirler.

## 💻 Teknoloji Yığını (Tech Stack)

| Katman | Teknolojiler |
| :--- | :--- |
| **Frontend** | React.js (Web), React Native (Mobil) |
| **Backend & Veritabanı** | Supabase (PostgreSQL, Auth, Edge Functions, pg_cron) |
| **AI & Orkestrasyon** | LangChain.js, OpenAI API |

## 📊 Veritabanı Şeması
Proje kapsamında kullanılan temel tablolar:
- `profiles`: Kullanıcı bilgileri.
- `quiz_sessions`: Dinamik anket döngüleri ve güven skorları.
- `gift_suggestions`: Üretilen hediye önerileri.
- `reminders`: Fiyat ve zaman alarm kayıtları.
- `community_posts`: Sosyal keşfet gönderileri.
- `wishlists`: Kullanıcı favorileri.

---
*Gift DN-AI Master Proje Raporu © 2026*
