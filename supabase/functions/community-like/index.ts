// Supabase Edge Function: community/like
// Deploy: supabase functions deploy community-like --project-ref YOUR_REF

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Kullanıcıyı doğrula
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { post_id } = await req.json();

    // Daha önce beğenmiş mi kontrol et
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("post_id", post_id)
      .single();

    let liked: boolean;

    if (existingLike) {
      // Beğeniyi kaldır
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", post_id);
      await supabase.rpc("decrement_likes", { post_id_input: post_id });
      liked = false;
    } else {
      // Beğeni ekle
      await supabase.from("post_likes").insert({ user_id: user.id, post_id });
      await supabase.rpc("increment_likes", { post_id_input: post_id });
      liked = true;
    }

    // Güncel beğeni sayısını çek
    const { data: post } = await supabase
      .from("community_posts")
      .select("likes_count")
      .eq("id", post_id)
      .single();

    return new Response(
      JSON.stringify({ liked, likes_count: post?.likes_count || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
