import { createBrowserClient } from "@supabase/ssr";

// Fallback placeholder değerler — Supabase key girilene kadar uygulama çalışmaya devam eder
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const IS_SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

// Singleton for client components
let client: ReturnType<typeof createClient> | null = null;
export function getSupabaseClient() {
  if (!client) client = createClient();
  return client;
}
