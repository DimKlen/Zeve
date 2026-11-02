-- Rythme d'arrosage qui apprend de chaque plante (et de la météo du jardin).
-- 1. Chaque arrosage garde l'intervalle attendu à ce moment-là : l'écart réel/attendu nourrit
--    l'apprentissage, même si le rythme de la plante a changé depuis.
-- 2. La plante garde le rythme appris adopté et le dernier refus de suggestion.
-- 3. Les pièces extérieures (Balcon par défaut) subissent pleinement la météo de la ville.
-- 4. Cache météo journalier par jardin (Edge Function garden-weather, Open-Meteo).

alter table public.watering_events add column expected_days int check (expected_days between 1 and 60);
update public.watering_events w set expected_days = p.water_every_days from public.plants p where p.id = w.plant_id;

alter table public.plants add column learned_every_days int check (learned_every_days between 1 and 60);
-- Suggestion refusée (« Plus tard ») : rythme proposé et nombre d'intervalles connus à ce moment.
alter table public.plants add column suggestion_declined_days int check (suggestion_declined_days between 1 and 60);
alter table public.plants add column suggestion_declined_count int check (suggestion_declined_count >= 0);

alter table public.rooms add column outdoor boolean not null default false;
update public.rooms set outdoor = true where name = 'Balcon';

-- Même liste que DEFAULT_ROOMS (src/features/gardens/gardenRules.ts) ; le balcon est dehors.
create or replace function public.handle_new_garden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rooms (user_id, garden_id, name, position, outdoor) values
    (new.user_id, new.id, 'Salon', 0, false), (new.user_id, new.id, 'Chambre', 1, false),
    (new.user_id, new.id, 'Cuisine', 2, false), (new.user_id, new.id, 'Salle de bain', 3, false),
    (new.user_id, new.id, 'Balcon', 4, true);
  return new;
end $$;

create table public.garden_weather (
  garden_id uuid not null references public.gardens(id) on delete cascade,
  day date not null,
  temp_mean real,                    -- °C
  humidity_mean real,                -- %
  sunshine_hours real,
  et0_mm real,                       -- évapotranspiration de référence (FAO), mm/jour
  precipitation_mm real,
  fetched_at timestamptz not null default now(),
  primary key (garden_id, day)
);
alter table public.garden_weather enable row level security;
-- Le propriétaire du jardin lit et rafraîchit sa météo (l'Edge Function agit avec son jeton).
create policy "own garden weather" on public.garden_weather for all
  using (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = auth.uid()));

-- ───────────── Vue : historique récent d'arrosage et pièce extérieure ─────────────
-- is_thirsty reste le calcul brut (rythme fixe) : l'app ne le lit pas, elle calcule la date
-- d'arrosage avec la météo (src/plants/wateringModel.ts).
drop view public.plant_overview;
create view public.plant_overview with (security_invoker = true) as
select p.*,
  s.name as species_name, s.latin, s.form, s.light as species_light, s.light_label, s.air,
  coalesce(p.care_tip, s.tip) as tip,
  r.name as room_name,
  coalesce(r.outdoor, false) as room_outdoor,
  g.name as garden_name, g.city as garden_city, g.country as garden_country,
  g.country_code as garden_country_code, g.latitude as garden_latitude,
  lw.last_watered_at,
  pw.previous_watered_at,
  coalesce(h.history, '[]'::jsonb) as watering_history,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) as days_since_water,
  (current_date - p.created_at::date) as days_since_created,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) >= p.water_every_days as is_thirsty
from public.plants p
join public.species s on s.id = p.species_id
left join public.rooms r on r.id = p.room_id
left join public.gardens g on g.id = p.garden_id
left join lateral (
  select max(w.watered_at) as last_watered_at from public.watering_events w where w.plant_id = p.id
) lw on true
left join lateral (
  select w.watered_at as previous_watered_at from public.watering_events w
  where w.plant_id = p.id order by w.watered_at desc offset 1 limit 1
) pw on true
left join lateral (
  -- 12 derniers arrosages, du plus récent au plus ancien : { at, expected }.
  select jsonb_agg(jsonb_build_object('at', x.watered_at, 'expected', x.expected_days) order by x.watered_at desc) as history
  from (
    select w.watered_at, w.expected_days from public.watering_events w
    where w.plant_id = p.id order by w.watered_at desc limit 12
  ) x
) h on true
where p.archived_at is null;
