-- Darsly — initial schema, RLS, indexes, triggers.
create extension if not exists pgcrypto;

-- ─── tables ───────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  school     text,
  locale     text not null default 'uz' check (locale in ('uz','ru')),
  created_at timestamptz not null default now()
);

create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  title        text not null default '',
  description  text,
  schema_type  text not null check (schema_type in ('pairs','mcq','groups','sequence')),
  content      jsonb not null,
  default_game text not null,
  settings     jsonb not null default '{}'::jsonb,   -- { timer, shuffle, show_answers, theme }
  subject      text,
  grade        text,
  lang         text not null default 'uz',
  is_public    boolean not null default false,
  play_count   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.results (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  player_name  text,
  player_tg_id bigint,
  game         text not null,
  score        int not null,
  max_score    int not null,
  duration_sec int not null,
  created_at   timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────────────
create index activities_owner_id_idx on public.activities (owner_id);
create index activities_public_idx   on public.activities (is_public, subject, grade);
create index results_activity_id_idx on public.results (activity_id);

-- ─── updated_at (does not bump on a bare play_count increment) ────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'play_count' - 'updated_at')
     is distinct from
     (to_jsonb(old) - 'play_count' - 'updated_at')
  then new.updated_at = now();
  else new.updated_at = old.updated_at;
  end if;
  return new;
end $$;

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ─── profile row is created automatically on signup ───────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',
                           new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.activities enable row level security;
alter table public.results    enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy activities_owner_all on public.activities
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy activities_public_select on public.activities
  for select to anon, authenticated
  using (is_public = true);

create policy results_insert_any on public.results
  for insert to anon, authenticated
  with check (exists (
    select 1 from public.activities a
    where a.id = activity_id
      and (a.is_public or a.owner_id = (select auth.uid()))
  ));
create policy results_owner_select on public.results
  for select to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = results.activity_id and a.owner_id = (select auth.uid())
  ));
