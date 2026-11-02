-- Mode « Découvrir » (docs/06 F16) : reconnaître n'importe quelle plante en photo et en apprendre plus.
-- 1. Fiches « découverte » générées par Gemini, en cache par espèce et partagées entre utilisateurs
--    (quota gratuit) : lecture pour tout compte connecté, écriture par l'Edge Function (service role).
-- 2. Journal des découvertes : quota quotidien par utilisateur (Pl@ntNet gratuit : 500/jour en tout).

create table public.plant_facts (
  latin_key text not null,           -- nom latin normalisé (minuscules, sans accents ni ×)
  lang text not null default 'fr',
  latin text not null,
  common_name text,
  family text,
  facts jsonb not null,              -- { origin, edibility { status, note }, humanUses[], wildlife[], funFacts[] }
  created_at timestamptz not null default now(),
  primary key (latin_key, lang)
);
alter table public.plant_facts enable row level security;
create policy "facts readable" on public.plant_facts for select to authenticated using (true);

create table public.discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latin text,
  created_at timestamptz not null default now()
);
create index on public.discoveries (user_id, created_at desc);
alter table public.discoveries enable row level security;
create policy "own rows" on public.discoveries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
