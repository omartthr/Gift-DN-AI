// Supabase Edge Function: quiz/generate-gifts
// Deploy: supabase functions deploy generate-gifts --project-ref YOUR_REF

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function searchSerpAPI(query: string, language: string) {
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "tr",
    hl: language,
    api_key: Deno.env.get("SERP_API_KEY")!,
    num: "3",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await res.json();
  return data.shopping_results || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (error || !session) throw new Error("Session not found");

    const chips = session.initial_chips || {};

    // Hediye üretim promptu
    const giftPrompt = `Bu konuşmaya dayanarak tam olarak 3 hediye öner.
Alıcı: ${JSON.stringify(chips.recipients || [])}, Bütçe: ${chips.budget || "belirtilmedi"}
Konuşma: ${JSON.stringify(session.conversation_history)}
Dil: ${session.language}

YALNIZCA aşağıdaki yapıda geçerli bir JSON dizisi döndür:
[
  {
    "rank": 1,
    "product_name": "Arama için spesifik ürün adı",
    "search_query": "Google Shopping için optimize edilmiş arama sorgusu",
    "reasoning": "Bu hediyenin bu kişiye neden uygun olduğu",
    "description": "Kısa hediye açıklaması"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: giftPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = JSON.parse(completion.choices[0].message.content!);
    const gifts = Array.isArray(raw) ? raw : raw.gifts || [];

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
