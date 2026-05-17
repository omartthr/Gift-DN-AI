// Supabase Edge Function: quiz/generate-gifts
// Deploy: supabase functions deploy generate-gifts --project-ref YOUR_REF

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY")!;
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API hatası (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

type BudgetRange = { min: number; max: number };

function parseBudget(label: string): BudgetRange {
  if (!label) return { min: 0, max: Number.POSITIVE_INFINITY };
  const cleaned = label.replace(/[^\d\-–+]/g, "");
  if (cleaned.includes("+")) {
    const min = parseInt(cleaned.replace("+", ""), 10);
    return { min: isNaN(min) ? 0 : min, max: Number.POSITIVE_INFINITY };
  }
  const parts = cleaned.split(/[–\-]/).map((s) => parseInt(s, 10));
  const min = isNaN(parts[0]) ? 0 : parts[0];
  const max = isNaN(parts[1]) ? Number.POSITIVE_INFINITY : parts[1];
  return { min, max };
}

async function searchSerpShopping(query: string, language: string, budget: BudgetRange) {
  const serpKey = Deno.env.get("SERP_API_KEY");
  if (!serpKey) return [];

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "tr",
    hl: language,
    api_key: serpKey,
    num: "20",
  });

  if (budget.min > 0 || budget.max !== Number.POSITIVE_INFINITY) {
    const tbsParts = ["mr:1", "price:1"];
    if (budget.min > 0) tbsParts.push(`ppr_min:${budget.min}`);
    if (budget.max !== Number.POSITIVE_INFINITY) tbsParts.push(`ppr_max:${budget.max}`);
    params.set("tbs", tbsParts.join(","));
  }

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await res.json();
    return data.shopping_results || [];
  } catch {
    return [];
  }
}

// Bilet, kurs, abonelik, deneyim paketi gibi Google Shopping'de görünmeyen
// ama online satılan/rezerve edilen öğeler için web araması.
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function searchSerpWeb(query: string, language: string) {
  const serpKey = Deno.env.get("SERP_API_KEY");
  if (!serpKey) return [];

  const params = new URLSearchParams({
    engine: "google",
    q: `${query} satın al fiyat`,
    gl: "tr",
    hl: language,
    api_key: serpKey,
    num: "10",
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await res.json();
    const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
    // shopping_results şekline normalize et
    return organic.map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      product_link: r.link || "",
      thumbnail: r.thumbnail || "",
      price: r.price || "",
      extracted_price: typeof r.extracted_price === "number" ? r.extracted_price : undefined,
      source: r.source || extractDomain(r.link || ""),
      source_icon: r.favicon || "",
      rating: typeof r.rating === "number" ? r.rating : undefined,
      thumbnails: r.thumbnail ? [r.thumbnail] : [],
    }));
  } catch {
    return [];
  }
}

// Shopping'i dene → boşsa web aramasına düş
async function searchSerpAPI(query: string, language: string, budget: BudgetRange) {
  const shopping = await searchSerpShopping(query, language, budget);
  if (shopping.length > 0) return shopping;
  return await searchSerpWeb(query, language);
}

async function regenerateGift(
  failed: { product_name: string; description?: string; reasoning?: string; rank: number },
  chips: any,
  historyText: string,
  language: string,
  budgetText: string,
  budgetConstraint: string,
  excludeList: string[] = [],
) {
  const excludeBlock = excludeList.length > 0
    ? `\n\nŞu ürünleri önerme (kullanıcıya zaten gösterildi): ${excludeList.map((n) => `"${n}"`).join(", ")}`
    : "";
  const prompt = `Önceki hediye önerisi "${failed.product_name}" için Türkiye'de online satın alınabilir bir sayfa bulunamadı (Google Shopping ve web aramasında sonuç yok).

Aynı temada ama daha kolay bulunabilir, somut ve online satışta olan ALTERNATİF bir hediye öner.

Alıcı: ${JSON.stringify(chips.recipients || [])}
Bütçe: ${budgetText} (${budgetConstraint})
Dil: ${language}

Konuşma:
${historyText}${excludeBlock}

KATI KURALLAR:
- Türkiye'de online satın alınabilen veya rezerve edilebilen SOMUT bir öğe olmalı.
- search_query Google'da gerçek satış sayfasını bulduracak kadar spesifik olmalı (marka, model, sanatçı adı, kurs adı gibi).
- Soyut fikirler ("birlikte vakit geçirme", "sürpriz parti", "el yazısı mektup") YASAK.

YALNIZCA aşağıdaki JSON nesnesini döndür:
{
  "rank": ${failed.rank},
  "product_name": "...",
  "search_query": "...",
  "reasoning": "...",
  "description": "..."
}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw);
    return { ...parsed, rank: failed.rank };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id, exclude_names } = await req.json();
    const excludeList: string[] = Array.isArray(exclude_names)
      ? exclude_names.filter((n: unknown): n is string => typeof n === "string" && n.length > 0)
      : [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (error || !session) throw new Error("Session not found");

    const chips = session.initial_chips || {};

    // Konuşma geçmişini metin olarak formatla
    const historyText = (session.conversation_history || [])
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`
      )
      .join("\n");

    const budget = parseBudget(chips.budget || "");
    const budgetText = chips.budget || "belirtilmedi";
    const budgetConstraint = budget.max === Number.POSITIVE_INFINITY
      ? `En az ${budget.min} TL`
      : `${budget.min} TL ile ${budget.max} TL arasında`;

    const excludeBlock = excludeList.length > 0
      ? `\n\nDAHA ÖNCE GÖSTERİLEN HEDİYELER (KESİNLİKLE ÖNERME, BUNLARDAN TAMAMEN FARKLI 3 ALTERNATİF SUN):\n${excludeList.map((n) => `- ${n}`).join("\n")}\n- Aynı ürünün farklı modeli/rengi/varyantı da YASAK.\n- Mümkünse farklı kategoriden/temadan öneriler getir ki kullanıcı yeni seçenekler keşfetsin.`
      : "";

    const giftPrompt = `Bu konuşmaya dayanarak tam olarak 3 hediye öner.
Alıcı: ${JSON.stringify(chips.recipients || [])}
Bütçe: ${budgetText}
Dil: ${session.language}

KATI KISITLAR:
- Önerdiğin 3 ürünün PERAKENDE FİYATI mutlaka ${budgetConstraint} olmalı.
- Bütçe aralığının dışında kalacak ürünler ÖNERME (lüks, premium, koleksiyon edisyon vb.).
- "search_query" alanı Türkiye'de bu bütçe ile gerçekten bulunabilecek ürünleri hedeflemeli; gerekirse "uygun fiyatlı", "ekonomik" gibi modifier kullan.
- Ürün adları aşırı niş veya sadece üst segmentte bulunan markalar olmasın.

ULAŞILABİLİRLİK KURALI (ÇOK ÖNEMLİ):
Önerdiğin her hediye, Türkiye'de online olarak SATIN ALINABİLEN veya REZERVE EDİLEBİLEN somut bir öğe olmalı. Şunlar uygundur:
  • Fiziksel ürünler (Hepsiburada, Trendyol, Amazon TR, n11, Çiçeksepeti vb.)
  • Etkinlik biletleri (Biletix, Passo, Bubilet, Mobilet — örn. "Cem Yılmaz bilet 2026", "Fenerbahçe maç bileti")
  • Online kurslar (Udemy, Coursera, BAU+, MEF IT — spesifik kurs adıyla)
  • Dijital abonelik / hediye kartı (Spotify, Netflix, Steam, Apple kart)
  • Deneyim paketleri (Tatilbudur, Hediyemo, Sermo, Decathlon Spor Akademisi — spesifik paket)
  • Spa, restoran, otel rezervasyonu (sadece spesifik bir mekan adıyla; örn. "Cinci Han Hamamı rezervasyon", "Mikla restoran tasting menu")

"search_query" alanı, bu öğenin satış/rezervasyon sayfasını Google'da bulduracak kadar SPESİFİK olmalı: marka, sanatçı, kurs adı, mekan adı dahil et. Örnekler:
  - "Cem Yılmaz Erkekler Ağlamaz bilet"
  - "JBL Tune 510BT kablosuz kulaklık"
  - "Udemy Python Bootcamp hediye kart"
  - "Bursa Saitabat Şelalesi günübirlik tur"

YASAK:
  • Soyut fikirler: "birlikte vakit geçirme", "sürpriz parti düzen", "el yazısı mektup yaz", "fotoğraf albümü hazırla" gibi YAPILMASI gereken eylemler.
  • Genel/jenerik kategoriler: "bir kitap", "bir parfüm", "konser bileti" (spesifik kitap/parfüm/konser adı OLMADAN).
  • Sadece bir kişiye özel üretilen şeyler: "ona özel tasarlanmış X" (online SKU'su yoksa).

Konuşma:
${historyText}${excludeBlock}

YALNIZCA aşağıdaki yapıda geçerli bir JSON nesnesi döndür (dizi "gifts" key'i altında):
{
  "gifts": [
    {
      "rank": 1,
      "product_name": "Arama için spesifik ürün adı",
      "search_query": "Google Shopping için optimize edilmiş Türkçe arama sorgusu",
      "reasoning": "Bu hediyenin bu kişiye neden uygun olduğu — konuşmadan somut referanslarla",
      "description": "Kısa hediye açıklaması (1-2 cümle)"
    },
    {
      "rank": 2,
      "product_name": "...",
      "search_query": "...",
      "reasoning": "...",
      "description": "..."
    },
    {
      "rank": 3,
      "product_name": "...",
      "search_query": "...",
      "reasoning": "...",
      "description": "..."
    }
  ]
}`;

    const rawText = await callGemini(giftPrompt);
    const parsed = JSON.parse(rawText);
    const gifts = Array.isArray(parsed) ? parsed : (parsed.gifts || []);

    // Bir gift'i SerpAPI ile zenginleştir; geçerli bir satış sayfası bulamazsa null döndür.
    async function enrichOne(gift: any): Promise<any | null> {
      const serpResults = await searchSerpAPI(gift.search_query, session.language, budget);
      if (!serpResults.length) return null;

      // Bütçe ±%20 tolerans (örn. 500–1000 TL aralığı için 400–1200 TL kabul)
      const BUDGET_TOLERANCE = 0.2;
      const tolMin = budget.min > 0 ? budget.min * (1 - BUDGET_TOLERANCE) : 0;
      const tolMax = budget.max !== Number.POSITIVE_INFINITY
        ? budget.max * (1 + BUDGET_TOLERANCE)
        : Number.POSITIVE_INFINITY;

      // Tam bütçe içi
      const inRange = serpResults.filter((r: any) => {
        const p = typeof r.extracted_price === "number" ? r.extracted_price : NaN;
        return !isNaN(p) && p >= budget.min && p <= budget.max;
      });
      // Tolerans dahilindeki fiyatlı ürünler (bütçeye en yakından sıralı)
      const inTolerance = serpResults
        .filter((r: any) => {
          const p = typeof r.extracted_price === "number" ? r.extracted_price : NaN;
          return !isNaN(p) && p >= tolMin && p <= tolMax;
        })
        .sort((a: any, b: any) => {
          const dist = (p: number) =>
            p < budget.min ? budget.min - p : p > budget.max ? p - budget.max : 0;
          return dist(a.extracted_price) - dist(b.extracted_price);
        });
      // Fiyatı olmayan sonuçlar (genelde bilet/kurs sayfaları) — bütçe doğrulanamaz
      // ama Gemini bütçeyi prompt'ta gördüğü için elemiyoruz; gizleme yerine gösteriyoruz.
      const unpriced = serpResults.filter((r: any) => typeof r.extracted_price !== "number");

      const top = inRange[0] || inTolerance[0] || unpriced[0] || null;
      // Bütçeyi %20'den fazla aşan veya altında kalan fiyatlı ürün varsa eleme — kartı gizle
      if (!top) return null;

      const link = top.product_link || top.link || "";
      // Bilet/kurs/deneyim için fiyat web aramasında bazen boş gelir;
      // ama tıklanabilir bir link şart — yoksa kart yarım görünür.
      if (!link) return null;

      const thumbnails = Array.isArray(top.thumbnails)
        ? top.thumbnails.filter((t: unknown): t is string => typeof t === "string")
        : [];
      const rating = typeof top.rating === "number" ? top.rating : undefined;
      const sourceIcon = typeof top.source_icon === "string" ? top.source_icon : "";

      const dbRow = {
        session_id,
        product_name: top.title || gift.product_name,
        product_description: gift.description,
        reasoning: gift.reasoning,
        serp_results: (inRange.length ? inRange : inTolerance.length ? inTolerance : unpriced)
          .slice(0, 3)
          .map((r: any) => ({
          title: r.title || "",
          link: r.product_link || r.link || "",
          thumbnail: r.thumbnail || "",
          price: r.price || "",
          source: r.source || "",
        })),
        product_link: link,
        product_image: top.thumbnail || "",
        current_price: top.price || "",
        source_store: top.source || "",
        rank: gift.rank,
      };

      const { data: saved } = await supabase
        .from("gift_suggestions")
        .insert(dbRow)
        .select()
        .single();

      return {
        ...(saved || { ...dbRow, id: crypto.randomUUID() }),
        source_icon: sourceIcon,
        rating,
        thumbnails,
      };
    }

    // İlk tur: tüm gift'leri paralel olarak zenginleştir
    const firstPass = await Promise.all(gifts.map((g: any) => enrichOne(g)));

    // Başarısız olanlar için tek seferlik Gemini retry (aynı temada alternatif öneri)
    const finalGifts = await Promise.all(
      firstPass.map(async (result, i) => {
        if (result) return result;
        const failed = gifts[i];
        const alt = await regenerateGift(
          {
            product_name: failed.product_name,
            description: failed.description,
            reasoning: failed.reasoning,
            rank: failed.rank ?? i + 1,
          },
          chips,
          historyText,
          session.language,
          budgetText,
          budgetConstraint,
          excludeList,
        );
        if (!alt) return null;
        return await enrichOne(alt);
      })
    );

    // Geçerli ürünleri rank'e göre sırala; ulaşılamayan öneriler tamamen elenir
    const enrichedGifts = finalGifts
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    return new Response(
      JSON.stringify({ gifts: enrichedGifts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
