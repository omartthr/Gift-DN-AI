// Supabase Edge Function: next-question
// İlk çağrıda session oluşturur, sonraki çağrılarda soruya devam eder.
// Deploy: supabase functions deploy next-question --project-ref YOUR_REF

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
      temperature: 0.7,
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

    const MIN_TURNS = 4;
    const MAX_TURNS = 10;

    const prompt = `Sen Gift DN-AI adlı bir hediye öneri asistanısın.
Tek amacın: alıcıya en uygun hediyeyi bulmak için yeterli bağlamı toplamak. Bunu mümkün olan en az soruyla yap.

BAĞLAM
- Alıcı tipi: ${JSON.stringify(sessionChips.recipients || [])}
- Alıcının cinsiyeti: ${sessionChips.recipientGender === "male" ? "Erkek" : sessionChips.recipientGender === "female" ? "Kadın" : sessionChips.recipientGender === "nonbinary" ? "Belirtilmedi" : "Belirtilmedi (anne/baba gibi zaten belli)"}
- Bütçe: ${sessionChips.budget || "belirtilmedi"}
- Dil: ${session.language} (yalnızca bu dilde yanıt ver)
- Mevcut tur: ${newTurn} / ${MAX_TURNS}
- Önceki konuşma:
${historyText}

YANIT FORMATI (zorunlu, geçerli JSON):
{
  "question": "Bir sonraki soru (bitir kararı verdiysen null)",
  "question_type": "text | single_choice | multi_choice",
  "options": ["seçenek1", "seçenek2"] veya null,
  "confidence_score": 0.0–1.0 arasında, elindeki bilgiyle iyi bir hediye önerebilme güvenin,
  "reasoning": "Bu soruyu neden bu adımda sorduğuna dair tek cümle"
}

KONU SINIRLARI (KESİN)
Sorular YALNIZCA şu hediye-ilişkili konulardan biri hakkında olmalı:
- Alıcının ilgi alanları, hobileri, tutkuları
- Yaşam tarzı, günlük rutinleri (kahve seven mi, spor yapan mı, evde mi vakit geçiriyor vs.)
- Kişilik özellikleri (pratik mi, duygusal mı, deneyim mi obje mi sever)
- Son zamanlarda bahsettiği/istediği şeyler, eksiklerini hissettiği şeyler
- Hediyenin vesilesi (doğum günü, sevgililer günü, "sadece çünkü" vb.)
- Alıcı–verici ilişkisinin derinliği/havası (samimi mi, resmî mi, sürpriz mi olmalı)
- Estetik tercihler (minimal, renkli, klasik vs.)
- "Bu hediyeyle ne hissetmesini istiyorsun?" tarzı duygusal yönlendirme

YASAK: Hediye kararıyla doğrudan ilgisi olmayan kişisel/özel sorular (yaş haricinde doğum tarihi, sağlık durumu, ilişki sorunları, mali durum, dini görüş, siyasi görüş, vb.) ASLA sorulmaz.

SORU KALİTESİ
1. Her soru, önceki cevaplardaki bilgilerin ÜZERİNE inşa edilmeli — bilineni tekrar sorma.
2. Bir önceki cevap dar/genel ise, bir sonraki soru o cevabı netleştirici (somutlaştırıcı) olmalı.
3. Aynı tema iki kez üst üste sorulmaz; her soru yeni bir boyut açmalı.
4. Sorular kısa (max ~15 kelime), sıcak, sohbet tonunda, ${session.language} dilinde.
5. options:
   - single_choice / multi_choice: 3–5 somut, birbirinden farklı seçenek
   - text: tahmin değeri olan 3–4 kısa öneri (hızlı seçim için) veya null
6. İlk sorular geniş (ilgi alanı, yaşam tarzı), sonraki sorular daralan/netleştirici olmalı.

BİTİRME KURALI (ÇOK ÖNEMLİ — quiz HER ZAMAN 10'a kadar gitmek ZORUNDA DEĞİL)
Şu koşullardan biri gerçekleşirse question alanını null yap (oturum biter):
- Tur ${MAX_TURNS}'a ulaştıysa (zorunlu son)
- Tur >= 4 ve confidence_score >= 0.80
- Tur >= 6 ve confidence_score >= 0.70
- Tur >= 8 ve confidence_score >= 0.60

Aksi halde question alanını DOLDUR.

CONFIDENCE SKORU NASIL VERİLİR (dürüst ol, abartma ve eksik gösterme)
- 0.0–0.3: Sadece chip bilgisi var, alıcının kişiliği hakkında neredeyse hiçbir şey bilmiyorum.
- 0.4–0.6: Genel ilgi alanı/yaşam tarzı belli, ama somut hediye kategorisi seçemem.
- 0.7–0.8: Net bir hediye kategorisi ve ton/tarz belli; 5–10 iyi seçenek üretebilirim.
- 0.85+: Çok spesifik bir hediye fikri kafamda netleşti, sadece nihai detay eksik.

Skoru her turda gerçekçi güncelle — bilgi geldikçe artır, gelmediyse koru. Aşırı düşük tutarak quizi gereksiz uzatma; aşırı yüksek tutarak da erken bitirme.`;

    const rawText = await callGemini(prompt);
    const aiResponse = JSON.parse(rawText);

    // Server-side bitirme kuralları — AI prompt'a uymazsa devreye girer
    // 1) MAX_TURNS'e ulaşıldıysa AI question döndürse bile zorla bitir
    if (newTurn >= MAX_TURNS) {
      aiResponse.question = null;
    }
    // 2) MIN_TURNS'ten önce AI yanlışlıkla null verirse, generic fallback soru üret
    if (newTurn < MIN_TURNS && aiResponse.question === null) {
      aiResponse.question = session.language === "tr"
        ? "Alıcının son zamanlarda en çok ilgilendiği şey ne?"
        : "What has the recipient been most interested in lately?";
      aiResponse.question_type = "text";
      aiResponse.options = null;
    }

    // AI yanıtını konuşmaya ekle
    if (aiResponse.question) {
      history.push({ role: "assistant", content: aiResponse.question });
    }

    const completed = aiResponse.question === null;

    // Oturumu güncelle
    await supabase
      .from("quiz_sessions")
      .update({
        conversation_history: history,
        current_turn: newTurn,
        confidence_score: aiResponse.confidence_score,
        status: completed ? "completed" : "active",
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
        completed,
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
