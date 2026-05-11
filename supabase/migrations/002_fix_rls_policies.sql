-- ================================================================
-- Gift DN-AI — RLS Politika Düzeltmesi
-- Supabase Dashboard → SQL Editor'da çalıştır
-- ================================================================

-- quiz_sessions: mevcut politikayı sil, açık şekilde yeniden ekle
drop policy if exists "quiz_sessions_all_own" on quiz_sessions;

-- SELECT: kendi oturumlarını gör
create policy "quiz_sessions_select_own" on quiz_sessions
  for select using (auth.uid() = user_id);

-- INSERT: kendi user_id'nle ekle
create policy "quiz_sessions_insert_own" on quiz_sessions
  for insert with check (auth.uid() = user_id);

-- UPDATE: kendi oturumunu güncelle
create policy "quiz_sessions_update_own" on quiz_sessions
  for update using (auth.uid() = user_id);

-- DELETE: kendi oturumunu sil
create policy "quiz_sessions_delete_own" on quiz_sessions
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- profiles tablosu için INSERT politikası (trigger dışında yedek)
-- ----------------------------------------------------------------
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------
-- gift_suggestions: Edge Function service_role ile insert eder
-- ama yine de SELECT politikası olsun
-- ----------------------------------------------------------------
drop policy if exists "gift_suggestions_select_own" on gift_suggestions;
drop policy if exists "gift_suggestions_insert_own" on gift_suggestions;

create policy "gift_suggestions_select_own" on gift_suggestions
  for select using (
    session_id in (select id from quiz_sessions where user_id = auth.uid())
  );

-- INSERT için service_role bypass zaten çalışır; anon kullanıcılar için de ekle
create policy "gift_suggestions_insert_own" on gift_suggestions
  for insert with check (
    session_id in (select id from quiz_sessions where user_id = auth.uid())
  );
