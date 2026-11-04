-- Suivi de soins (docs/06 F22) : après un conseil contre un problème de santé (cochenilles, oïdium…),
-- la plante reprend des nouvelles à la date prévue. Un seul suivi ouvert par plante.
create table public.plant_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  -- Le problème avec son article (« les cochenilles », « l’oïdium »).
  topic text not null check (char_length(topic) between 2 and 60),
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'expired')),
  -- Prises de nouvelles déjà faites ; au-delà de 3, le suivi expire.
  checks smallint not null default 0 check (checks between 0 and 3),
  created_at timestamptz not null default now()
);
create unique index plant_followups_one_open on public.plant_followups (plant_id) where status = 'open';
create index on public.plant_followups (user_id, status);

alter table public.plant_followups enable row level security;
create policy "own rows" on public.plant_followups for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.plants p where p.id = plant_id and p.user_id = auth.uid())
  );
