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

async function searchSerpAPI(query: string, language: string, budget: BudgetRange) {
  const serpKey = Deno.env.get("SERP_API_KEY");
  if (!serpKey) {
    // SerpAPI key yoksa mock sonuç döndür (geliştirme için)
    return [];
  }

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "tr",
    hl: language,
    api_key: serpKey,
    num: "20",
  });

  // SerpAPI fiyat filtresi (Google Shopping)
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id } = await req.json();

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

    const giftPrompt = `Bu konuşmaya dayanarak tam olarak 3 hediye öner.
Alıcı: ${JSON.stringify(chips.recipients || [])}
Bütçe: ${budgetText}
Dil: ${session.language}

KATI KISITLAR:
- Önerdiğin 3 ürünün PERAKENDE FİYATI mutlaka ${budgetConstraint} olmalı.
- Bütçe aralığının dışında kalacak ürünler ÖNERME (lüks, premium, koleksiyon edisyon vb.).
- "search_query" alanı Türkiye'de bu bütçe ile gerçekten bulunabilecek ürünleri hedeflemeli; gerekirse "uygun fiyatlı", "ekonomik" gibi modifier kullan.
- Ürün adları aşırı niş veya sadece üst segmentte bulunan markalar olmasın.

Konuşma:
${historyText}

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

    // Her hediye için SerpAPI çağrısı
    const enrichedGifts = await Promise.all(
      gifts.map(async (gift: any) => {
        const serpResults = await searchSerpAPI(gift.search_query, session.language, budget);

        // Bütçe aralığına düşen ilk sonucu seç; yoksa aralığa en yakın olanı al
        const inRange = serpResults.filter((r: any) => {
          const p = typeof r.extracted_price === "number" ? r.extracted_price : NaN;
          return !isNaN(p) && p >= budget.min && p <= budget.max;
        });
        const fallback = [...serpResults]
          .filter((r: any) => typeof r.extracted_price === "number")
          .sort((a: any, b: any) => {
            const dist = (p: number) =>
              p < budget.min ? budget.min - p : p > budget.max ? p - budget.max : 0;
            return dist(a.extracted_price) - dist(b.extracted_price);
          });
        const top = inRange[0] || fallback[0] || serpResults[0] || {};

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
          serp_results: (inRange.length ? inRange : serpResults).slice(0, 3),
          product_link: top.product_link || top.link || "",
          product_image: top.thumbnail || "",
          current_price: top.price || "",
          source_store: top.source || "",
          rank: gift.rank,
        };

        const extras = {
          source_icon: sourceIcon,
          rating,
          thumbnails,
        };

        const { data: saved } = await supabase
          .from("gift_suggestions")
          .insert(dbRow)
          .select()
          .single();

        return { ...(saved || { ...dbRow, id: crypto.randomUUID() }), ...extras };
      })
    );

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
