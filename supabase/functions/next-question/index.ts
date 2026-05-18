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

    // ── Persona için ilişki etiketi ────────────────────────────────────────
    // AI, alıcıyı (kullanıcının yakınını) "içeriden tanıyan biri" rolünde
    // olacak; kullanıcıyla 2. tekil şahıs konuşacak. Türkçe etiketler 2. tekil
    // iyelik formunda ("annen", "baban") — AI gerektiğinde doğal çekim yapar.
    const RECIPIENT_LABELS_TR: Record<string, string> = {
      mom: "annen",
      dad: "baban",
      partner: "partnerin",
      friend: "arkadaşın",
      sibling: "kardeşin",
      coworker: "iş arkadaşın",
      child: "çocuğun",
      other: "yakının",
    };
    const RECIPIENT_LABELS_EN: Record<string, string> = {
      mom: "your mom",
      dad: "your dad",
      partner: "your partner",
      friend: "your friend",
      sibling: "your sibling",
      coworker: "your coworker",
      child: "your child",
      other: "your loved one",
    };
    const GENDER_AMBIGUOUS = new Set([
      "partner", "friend", "sibling", "coworker", "child", "other",
    ]);
    const recipientList: string[] = Array.isArray(sessionChips.recipients) ? sessionChips.recipients : [];
    const recipientKey = recipientList[0] || "other";
    const labels = session.language === "en" ? RECIPIENT_LABELS_EN : RECIPIENT_LABELS_TR;
    const recipientLabel = labels[recipientKey] || labels.other;
    const recipientLabelCap = recipientLabel.charAt(0).toUpperCase() + recipientLabel.slice(1);
    const genderNote = GENDER_AMBIGUOUS.has(recipientKey) && sessionChips.recipientGender
      ? (sessionChips.recipientGender === "male"
        ? (session.language === "en" ? " (male)" : " (erkek)")
        : sessionChips.recipientGender === "female"
          ? (session.language === "en" ? " (female)" : " (kadın)")
          : "")
      : "";

    // Konuşma geçmişini metin olarak formatla
    const historyText = history.length > 0
      ? history.map((m) =>
        `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`
      ).join("\n")
      : "(Henüz yanıt yok)";

    const MIN_TURNS = 4;
    const MAX_TURNS = 10;

    const prompt = `Sen, kullanıcının ${recipientLabel}${genderNote} iyi tanıyan, neyi sevip neyi sevmediğini içeriden bilen yakın bir dost gibi davranan bir hediye asistanısın. Görevin: kullanıcıyla doğal bir sohbet kurarak ${recipientLabel} için en uygun hediyeyi bulmak.

ROL — KESİN UYULACAK
- Kullanıcıyla DAİMA 2. tekil şahıs konuş: "sen", "senin ${recipientLabel}".
- ${recipientLabelCap} kafanda canlı bir kişi olarak düşün: o tipteki bir kişinin nasıl yaşadığını, sabahları ne yaptığını, hafta sonunu nasıl geçirdiğini, neyle gurur duyduğunu zihninde canlandır. Sorularını bu modeli rafine etmek için sor.
- ASLA 1. tekil şahıs kullanma ("ben...", "benim..."). Kendini alıcı yerine koyma — sen onu "tanıyan" birisin, "o" değilsin.
- ASLA "yapay zeka olarak", "asistan olarak", "AI olarak" gibi ifadeler kullanma.
- Klişe anket soruları sorma. Düz "Hobisi nedir?", "Ne renk sever?", "Kaç yaşında?" gibi sorular KESİN YASAK.

TEPKİ KURALLARI — önceki cevabı her zaman değerlendir
1. TEK KELİMELİK / boş / "—" cevap → sıcak tonla netleştir, asla "tamam" deyip geçme:
   Örn: "Hmm, sadece bu mu? Biraz daha anlatsana — ${recipientLabel} daha çok klasik tipte mi, yoksa yeniliklere açık biri mi mesela?"
2. ALAKASIZ / saçma / zorlama cevap → samimi, hafif takılan bir tonla yorum yap + yeniden yönlendir:
   Örn: "Bu seçim biraz ilginç açıkçası — ${recipientLabel} gerçekten böyle bir şey sever mi, yoksa aklına ilk geleni mi yazdın? Birlikte düşünelim..."
3. ÖNCEKİ CEVAPLA ÇELİŞEN cevap → çelişkiyi nazikçe işaretle:
   Örn: "Az önce X demiştin, şimdi Y diyorsun — ${recipientLabel} ikisi arasında bir yerde mi, yoksa hangisi daha baskın?"
4. NET ve dolu cevap → kısaca onayla (cevabı tekrar etmeden) ve bir adım daha derine in.

SORU KALİTESİ — içeriden bilen biri gibi sor
İYİ ÖRNEKLER (içeriden, spesifik, yaşam tarzı):
- "${recipientLabelCap} sabah kahvesini sessizce mi içer, yoksa hep telefonda biriyle mi konuşur?"
- "Hafta sonu daha çok evde kitap okuyan tipte mi, yoksa kapıdan çıkıp bir yerlere giden tipte mi?"
- "Son zamanlarda 'şunu alsam keşke' diye sızlandığı bir şey oldu mu?"
- "Hediyeyi açtığında 'bunu benim için mi seçtin?' dedirten bir şey mi olsun, yoksa 'tam ihtiyacım vardı' dedirten pratik bir şey mi?"

KÖTÜ ÖRNEKLER (jenerik anket — KULLANMA):
- "Hobisi nedir?" / "Ne renk sever?" / "İlgi alanları neler?" / "Kaç yaşında?"

SORU MEKANİĞİ
1. Her soru bir öncekinin cevabıyla MANTIKSAL OLARAK bağlı olsun — sohbet aksın, ankete dönüşmesin.
2. Aynı temayı iki kez sorma; her tur yeni bir boyut açsın (önce yaşam tarzı → sonra kişilik → sonra estetik → sonra somut ihtiyaç gibi).
3. Sorular kısa (max ~20 kelime), sıcak, sohbet tonunda, ${session.language} dilinde.
4. options alanı:
   - single_choice / multi_choice: 3–5 seçenek; her biri GERÇEKTEN farklı bir yöne işaret etmeli — birbirinin varyantı/eşanlamlısı olmasın.
   - text: tahmin değeri olan 3–4 kısa öneri (hızlı seçim için) veya null.

BAĞLAM
- Kullanıcı kime hediye alıyor: ${recipientLabel}${genderNote}
- Bütçe: ${sessionChips.budget || "belirtilmedi"}
- Dil: ${session.language} (sorularını yalnızca bu dilde yaz)
- Mevcut tur: ${newTurn} / ${MAX_TURNS}
- Önceki konuşma:
${historyText}

KONU SINIRLARI (KESİN)
Sorular YALNIZCA şunlar hakkında:
- İlgi alanları, hobiler, tutkular
- Yaşam tarzı, günlük rutin (kahve, spor, evde/dışarıda vakit)
- Kişilik (pratik/duygusal, evcil/dışa dönük, deneyim/obje sever)
- Son zamanlarda bahsettiği/istediği şeyler, eksiklerini hissettiği şeyler
- Hediyenin vesilesi (doğum günü, sevgililer günü, "sadece çünkü")
- İlişki tonu (samimi/resmi, sürpriz mi/açık konuşulmuş mu)
- Estetik tercih (minimal/renkli/klasik)

YASAK: Sağlık durumu, mali durum, dini görüş, siyasi görüş, mahrem ilişki sorunları, kilo/fiziksel özellik — bu konulara ASLA değinme.

BİTİRME KURALI (quiz illa 10 tura kadar gitmek ZORUNDA DEĞİL)
Şu koşullardan biri gerçekleşirse question alanını null yap (oturum biter):
- Tur ${MAX_TURNS}'a ulaştıysa (zorunlu son)
- Tur >= 4 ve confidence_score >= 0.80
- Tur >= 6 ve confidence_score >= 0.70
- Tur >= 8 ve confidence_score >= 0.60
Aksi halde question alanını DOLDUR.

CONFIDENCE SKORU (dürüst ol, abartma)
- 0.0–0.3: sadece chip bilgisi var, ${recipientLabel} hakkında neredeyse hiçbir şey bilmiyorum.
- 0.4–0.6: genel yaşam tarzı/ilgi alanı belli, ama somut hediye kategorisi seçemem.
- 0.7–0.8: net bir hediye kategorisi ve ton/tarz belli; 5–10 iyi seçenek üretebilirim.
- 0.85+: çok spesifik bir hediye fikri netleşti, sadece son detay eksik.

YANIT FORMATI (zorunlu, geçerli JSON):
{
  "question": "Bir sonraki soru — kullanıcıya 2. tekil şahıs, içeriden tanıyan ton (bitir kararı verdiysen null)",
  "question_type": "text | single_choice | multi_choice",
  "options": ["seçenek1", "seçenek2"] veya null,
  "confidence_score": 0.0–1.0,
  "reasoning": "Bu soruyu neden BU adımda sordun — tek cümle sistem notu (kullanıcıya değil, kendi düşüncen)"
}`;

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
