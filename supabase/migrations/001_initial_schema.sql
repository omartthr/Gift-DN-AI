-- ================================================================
-- Gift DN-AI — Veritabanı Migration
-- Supabase SQL Editor'da bu dosyayı çalıştır
-- ================================================================

-- 1) Profiller
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  language text default 'tr',
  created_at timestamptz default now()
);

-- 2) Anket Oturumları
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  initial_chips jsonb,
  conversation_history jsonb default '[]'::jsonb,
  current_turn int default 0,
  confidence_score float default 0,
  status text default 'active',
  language text default 'tr',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Hediye Önerileri
create table if not exists gift_suggestions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade,
  product_name text,
  product_description text,
  reasoning text,
  serp_results jsonb,
  product_link text,
  product_image text,
  current_price text,
  source_store text,
  rank int,
  created_at timestamptz default now()
);

-- 4) Topluluk Gönderileri
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_id uuid references quiz_sessions(id),
  suggestion_id uuid references gift_suggestions(id),
  product_name text,
  product_image text,
  product_link text,
  feedback_text text,
  recipient_label text,
  is_anonymous boolean default false,
  likes_count int default 0,
  created_at timestamptz default now()
);

-- 5) Gönderi Beğenileri
create table if not exists post_likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- 6) İstek Listeleri
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id),
  product_name text,
  product_link text,
  product_image text,
  note text,
  created_at timestamptz default now()
);

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================

alter table profiles enable row level security;
alter table quiz_sessions enable row level security;
alter table gift_suggestions enable row level security;
alter table community_posts enable row level security;
alter table post_likes enable row level security;
alter table wishlists enable row level security;

-- Profiles: sadece kendi satırın
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Quiz sessions: sadece kendi satırın
create policy "quiz_sessions_all_own" on quiz_sessions for all using (auth.uid() = user_id);

-- Gift suggestions: kendi anket sonuçların
create policy "gift_suggestions_select_own" on gift_suggestions for select
  using (session_id in (select id from quiz_sessions where user_id = auth.uid()));
create policy "gift_suggestions_insert_own" on gift_suggestions for insert
  with check (session_id in (select id from quiz_sessions where user_id = auth.uid()));

-- Community posts: herkes okuyabilir, kendi satırını yazabilir
create policy "community_posts_read_all" on community_posts for select using (true);
create policy "community_posts_insert_own" on community_posts for insert with check (auth.uid() = user_id);
create policy "community_posts_delete_own" on community_posts for delete using (auth.uid() = user_id);

-- Post likes: kendi beğenilerin
create policy "post_likes_all_own" on post_likes for all using (auth.uid() = user_id);

-- Wishlists: kendi listeni
create policy "wishlists_all_own" on wishlists for all using (auth.uid() = user_id);

-- ================================================================
-- Trigger: Yeni kullanıcı kaydında profiles tablosuna satır ekle
-- ================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
