-- Pot de la plante : numéro 0–19 dans la collection de l'app (src/plants/pots.ts).
-- Chaque plante existante reçoit un pot au hasard ; les nouvelles aussi (modifiable depuis le menu « … »).
alter table public.plants
  add column pot smallint not null default floor(random() * 20)::smallint
  check (pot between 0 and 19);

-- La vue reprend p.* : on la recrée (même définition qu'en 0009) pour exposer pot.
drop view public.plant_overview;
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
  select jsonb_agg(jsonb_build_object('at', x.watered_at, 'expected', x.expected_days) order by x.watered_at desc) as history
  from (
    select w.watered_at, w.expected_days from public.watering_events w
    where w.plant_id = p.id order by w.watered_at desc limit 12
  ) x
) h on true
where p.archived_at is null;
