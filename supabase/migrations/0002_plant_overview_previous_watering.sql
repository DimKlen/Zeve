-- Phase 3 : compléments du jardin et de la fiche plante.
-- 1. Conseil propre à une plante (« Bon à savoir » : spécifique à la plante sinon conseil du type, docs/04 §8).
-- 2. Avant-dernier arrosage dans la vue : la carte « À arroser aujourd'hui » garde les plantes arrosées
--    aujourd'hui qui avaient soif avant (docs/06 F3), calcul fait côté app dans le fuseau de l'utilisateur.

alter table public.plants add column care_tip text;

drop view public.plant_overview;
create view public.plant_overview with (security_invoker = true) as
select p.*,
  s.name as species_name, s.latin, s.form, s.light as species_light, s.light_label, s.air,
  coalesce(p.care_tip, s.tip) as tip,
  r.name as room_name,
  lw.last_watered_at,
  pw.previous_watered_at,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) as days_since_water,
  (current_date - p.created_at::date) as days_since_created,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) >= p.water_every_days as is_thirsty
from public.plants p
join public.species s on s.id = p.species_id
left join public.rooms r on r.id = p.room_id
left join lateral (
  select max(w.watered_at) as last_watered_at from public.watering_events w where w.plant_id = p.id
) lw on true
left join lateral (
  select w.watered_at as previous_watered_at from public.watering_events w
  where w.plant_id = p.id order by w.watered_at desc offset 1 limit 1
) pw on true
where p.archived_at is null;
