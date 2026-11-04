-- Suppression des pièces et du choix d'exposition par l'utilisateur.
-- 1. Plus de pièces (table rooms, plants.room_id, pièce extérieure) : les plantes sont dans un jardin.
-- 2. Plus d'exposition choisie (plants.light) : l'exposition idéale vient de la fiche de l'espèce
--    (species.light, species.light_label), que l'assistant IA utilise aussi pour conseiller.
-- Les données existantes (pièces, expositions choisies) sont supprimées avec leurs colonnes.

-- La vue et la fonction dépendent des colonnes retirées : on les recrée à la fin.
drop view public.plant_overview;
drop function public.create_garden_with_plant(
  text, text, text, public.light_exposure, int, text, text, text, text, text,
  double precision, double precision
);

-- Les pièces par défaut ne sont plus créées avec chaque jardin.
drop trigger if exists on_garden_created on public.gardens;
drop function if exists public.handle_new_garden();

alter table public.plants drop column room_id;
alter table public.plants drop column light;
drop table public.rooms;           -- supprime aussi ses index, contraintes et politiques RLS
drop type public.light_exposure;

-- Création atomique d'un jardin et de sa première plante (un jardin ne peut pas exister seul).
create or replace function public.create_garden_with_plant(
  p_name text,
  p_species_id text,
  p_nickname text,
  p_water_every_days int,
  p_species_source text,
  p_city text default null,
  p_country text default null,
  p_country_code text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
) returns table (garden_id uuid, plant_id uuid)
language plpgsql security invoker set search_path = public as $$
declare
  g uuid;
  p uuid;
begin
  insert into public.gardens (user_id, name, city, country, country_code, latitude, longitude)
  values (auth.uid(), trim(p_name), nullif(trim(p_city), ''), nullif(trim(p_country), ''),
          p_country_code, p_latitude, p_longitude)
  returning id into g;
  insert into public.plants (user_id, garden_id, species_id, nickname, water_every_days, species_source)
  values (auth.uid(), g, p_species_id, p_nickname, p_water_every_days, p_species_source)
  returning id into p;
  return query select g, p;
end $$;

-- Vue du jardin : sans pièce. species_light / light_label = exposition idéale de l'espèce.
create view public.plant_overview with (security_invoker = true) as
select p.*,
  s.name as species_name, s.latin, s.form, s.light as species_light, s.light_label, s.air,
  coalesce(p.care_tip, s.tip) as tip,
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
