-- ================================================================
-- Gift DN-AI — wishlists tablosunu genişlet
-- Supabase SQL Editor'da bu dosyayı çalıştır
-- ================================================================

-- Ürün açıklaması
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS product_description text;

-- AI gerekçesi ("Neden bu hediye")
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS reasoning text;

-- Fiyat bilgisi
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS current_price text;

-- Satıcı / mağaza adı
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS source_store text;

-- Mağaza favicon URL'si
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS source_icon text;

-- Yıldız puanı (0–5)
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS rating float;

-- Ek görseller dizisi (JSON array of URL strings)
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS thumbnails jsonb default '[]'::jsonb;

-- UI renk tonu (sage, rose, clay…)
ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS tone text;
