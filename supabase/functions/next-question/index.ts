// Supabase Edge Function: next-question
// İlk çağrıda session oluşturur, sonraki çağrılarda soruya devam eder.
// Deploy: supabase functions deploy next-question --project-ref YOUR_REF

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")!;
  const url = "https://api.openai.com/v1/chat/completions";

  const body = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API hatası (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Service Role client — RLS'yi bypass eder
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Kullanıcıyı Authorization header'dan al
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");

    // Kullanıcı kim?
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Yetkisiz erişim. Lütfen giriş yapın." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    let { session_id, user_answer, chips, language } = body;

    // ── İLK ÇAĞRI: session_id yoksa yeni oturum oluştur ──────────────────
    if (!session_id) {
      if (!chips || !language) {
        throw new Error("İlk çağrıda 'chips' ve 'language' zorunlu.");
      }

      const { data: newSession, error: insertErr } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: user.id,
          initial_chips: chips,
          language,
          conversation_history: [],
          current_turn: 0,
          confidence_score: 0,
          status: "active",
        })
        .select()
        .single();

      if (insertErr || !newSession) {
        throw new Error("Oturum oluşturulamadı: " + (insertErr?.message ?? ""));
      }

      session_id = newSession.id;
    }

    // ── Oturumu çek ───────────────────────────────────────────────────────
    const { data: session, error: sessionErr } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionErr || !session) throw new Error("Oturum bulunamadı.");

    // Yanıtı konuşma geçmişine ekle
    const history: { role: string; content: string }[] = session.conversation_history || [];
    if (user_answer) {
      history.push({ role: "user", content: user_answer });
    }

    const newTurn = session.current_turn + 1;
    const sessionChips = session.initial_chips || {};

    // Konuşma geçmişini metin olarak formatla
    const historyText = history.length > 0
      ? history.map((m) =>
          `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`
        ).join("\n")
      : "(Henüz yanıt yok)";

    const prompt = `Sen Gift DN-AI adlı bir hediye öneri asistanısın.
Amacın, akıllı ve kişiselleştirilmiş sorular sorarak hediye alınacak kişiyi derinlemesine tanımaktır.

Bağlam:
- Alıcı tipi: ${JSON.stringify(sessionChips.recipients || [])}
- Bütçe: ${sessionChips.budget || "belirtilmedi"}
- Dil: ${session.language} (yalnızca bu dilde yanıt ver)
- Mevcut tur: ${newTurn} / 10
- Önceki konuşma:
${historyText}

Yanıtın MUTLAKA aşağıdaki yapıda geçerli bir JSON nesnesi olmalıdır:
{
  "question": "Bir sonraki sorun (yeterince emin isen null)",
  "question_type": "text veya single_choice veya multi_choice",
  "options": ["seçenek1", "seçenek2"] veya null,
  "confidence_score": 0.0 ile 1.0 arasında bir sayı,
  "reasoning": "Bu soruyu neden sorduğuna dair kısa bir not"
}

Kurallar:
1. confidence_score >= 0.85 VEYA tur >= 10 ise → question alanını null yap
2. Her soru bir öncekinden farklı olmalıdır
3. Sorular doğal, sıcak ve sohbet tonunda olmalıdır
4. Genelden özele doğru ilerle
5. Yalnızca ${session.language} dilinde yanıt ver
6. options: single_choice veya multi_choice için 3-5 seçenek, text için null veya 3-4 kısa öneri`;

    const rawText = await callOpenAI(prompt);
    const aiResponse = JSON.parse(rawText);

    // AI yanıtını konuşmaya ekle
    if (aiResponse.question) {
      history.push({ role: "assistant", content: aiResponse.question });
    }

    // Oturumu güncelle
    await supabase
      .from("quiz_sessions")
      .update({
        conversation_history: history,
        current_turn: newTurn,
        confidence_score: aiResponse.confidence_score,
        status: aiResponse.question === null ? "completed" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    return new Response(
      JSON.stringify({
        session_id,                                        // İlk çağrıda frontend'e döner
        question: aiResponse.question,
        question_type: aiResponse.question_type || "text",
        options: aiResponse.options || null,
        confidence_score: aiResponse.confidence_score,
        reasoning: aiResponse.reasoning || null,
        turn: newTurn,
        completed: aiResponse.question === null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
