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

async function searchSerpAPI(query: string, language: string) {
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
    num: "3",
  });

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

    const giftPrompt = `Bu konuşmaya dayanarak tam olarak 3 hediye öner.
Alıcı: ${JSON.stringify(chips.recipients || [])}, Bütçe: ${chips.budget || "belirtilmedi"}
Dil: ${session.language}

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
        const serpResults = await searchSerpAPI(gift.search_query, session.language);
        const top = serpResults[0] || {};

        const suggestion = {
          session_id,
          product_name: top.title || gift.product_name,
          product_description: gift.description,
          reasoning: gift.reasoning,
          serp_results: serpResults.slice(0, 3),
          product_link: top.link || "",
          product_image: top.thumbnail || "",
          current_price: top.price || "",
          source_store: top.source || "",
          rank: gift.rank,
        };

        const { data: saved } = await supabase
          .from("gift_suggestions")
          .insert(suggestion)
          .select()
          .single();

        return saved || { ...suggestion, id: crypto.randomUUID() };
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
