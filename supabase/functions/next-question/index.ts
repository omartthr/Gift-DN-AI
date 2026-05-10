// Supabase Edge Function: quiz/next-question
// Deploy: supabase functions deploy next-question --project-ref YOUR_REF

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id, user_answer } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    // Oturumu çek
    const { data: session, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (error || !session) throw new Error("Session not found");

    // Yanıtı konuşma geçmişine ekle
    const history = session.conversation_history || [];
    if (user_answer) {
      history.push({ role: "user", content: user_answer });
    }

    const newTurn = session.current_turn + 1;
    const chips = session.initial_chips || {};

    const systemPrompt = `Sen Gift DN-AI adlı bir hediye öneri asistanısın.
Amacın, akıllı ve kişiselleştirilmiş sorular sorarak hediye alınacak kişiyi derinlemesine tanımaktır.

Bağlam:
- Alıcı tipi: ${JSON.stringify(chips.recipients || [])}
- Bütçe: ${chips.budget || "belirtilmedi"}
- Dil: ${session.language} (yalnızca bu dilde yanıt ver)
- Mevcut tur: ${newTurn} / 10
- Önceki yanıtlar: ${JSON.stringify(history)}

Yanıtın MUTLAKA aşağıdaki yapıda geçerli bir JSON nesnesi olmalıdır:
{
  "question": "Bir sonraki sorun (yeterince emin isen null)",
  "question_type": "text | single_choice | multi_choice",
  "options": ["seçenek1", "seçenek2"] veya null,
  "confidence_score": 0.0 ile 1.0 arasında,
  "reasoning": "Bu soruyu neden sorduğuna dair kısa bir not"
}

Kurallar:
1. confidence_score >= 0.85 VEYA tur >= 10 ise → question alanını null yap
2. Her soru bir öncekinden farklı olmalıdır
3. Sorular doğal, sıcak ve sohbet tonunda olmalıdır
4. Genelden özele doğru ilerle
5. Yalnızca ${session.language} dilinde yanıt ver`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content!);

    // Konuşmaya AI yanıtını ekle
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
        question: aiResponse.question,
        question_type: aiResponse.question_type || "text",
        options: aiResponse.options || null,
        confidence_score: aiResponse.confidence_score,
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
