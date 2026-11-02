-- Plusieurs jardins : un jardin est un lieu (ville, pays) qui regroupe des pièces et des plantes.
-- Règle métier : un jardin n'existe jamais vide. Il naît avec sa première plante
-- (create_garden_with_plant) et disparaît quand sa dernière plante active est supprimée ou déplacée
-- (déclencheur plants_drop_empty_garden).

create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  city text,
  country text,                      -- nom affiché du pays (saisi ou issu de la position)
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);
create index on public.gardens (user_id);
alter table public.gardens enable row level security;
create policy "own rows" on public.gardens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.rooms add column garden_id uuid references public.gardens(id) on delete cascade;
-- Archivée, une plante peut perdre son jardin ; active, elle en a toujours un.
alter table public.plants add column garden_id uuid references public.gardens(id) on delete set null;

-- ───────────── Données existantes : un jardin par utilisateur qui a des plantes ─────────────
insert into public.gardens (user_id, name)
select distinct user_id, 'Mon jardin' from public.plants where archived_at is null;

update public.plants p set garden_id = g.id from public.gardens g where g.user_id = p.user_id;
update public.rooms r set garden_id = g.id from public.gardens g where g.user_id = r.user_id;
-- Pièces d'un compte sans plante : recréées avec son premier jardin.
delete from public.rooms where garden_id is null;

alter table public.rooms alter column garden_id set not null;
alter table public.rooms drop constraint rooms_user_id_name_key;
alter table public.rooms add constraint rooms_garden_id_name_key unique (garden_id, name);
create index on public.rooms (garden_id);
alter table public.plants add constraint plants_active_in_garden
  check (archived_at is not null or garden_id is not null);
create index on public.plants (garden_id) where archived_at is null;

-- ───────────── Pièces par défaut : créées avec chaque jardin (plus à l'inscription) ─────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, display_email, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'given_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1), null),
    new.email,
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  );
  return new;
end $$;

-- Même liste que DEFAULT_ROOMS (src/features/gardens/gardenRules.ts).
create or replace function public.handle_new_garden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.rooms (user_id, garden_id, name, position) values
    (new.user_id, new.id, 'Salon', 0), (new.user_id, new.id, 'Chambre', 1),
    (new.user_id, new.id, 'Cuisine', 2), (new.user_id, new.id, 'Salle de bain', 3),
    (new.user_id, new.id, 'Balcon', 4);
  return new;
end $$;
create trigger on_garden_created after insert on public.gardens
  for each row execute function public.handle_new_garden();

-- ───────────── Jamais de jardin vide ─────────────
create or replace function public.drop_empty_garden() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.garden_id is not null and not exists (
    select 1 from public.plants where garden_id = old.garden_id and archived_at is null
  ) then
    delete from public.gardens where id = old.garden_id;
  end if;
  return null;
end $$;
create trigger plants_drop_empty_garden
  after update of garden_id, archived_at or delete on public.plants
  for each row execute function public.drop_empty_garden();

-- Création atomique d'un jardin et de sa première plante (un jardin ne peut pas exister seul).
create or replace function public.create_garden_with_plant(
  p_name text,
  p_species_id text,
  p_nickname text,
  p_light public.light_exposure,
  p_water_every_days int,
  p_species_source text,
  p_room_name text default null,
  p_city text default null,
  p_country text default null,
  p_country_code text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
) returns table (garden_id uuid, plant_id uuid)
language plpgsql security invoker set search_path = public as $$
declare
  g uuid;
  r uuid;
  p uuid;
begin
  insert into public.gardens (user_id, name, city, country, country_code, latitude, longitude)
  values (auth.uid(), trim(p_name), nullif(trim(p_city), ''), nullif(trim(p_country), ''),
          p_country_code, p_latitude, p_longitude)
  returning id into g;
  select id into r from public.rooms where rooms.garden_id = g and name = p_room_name;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source)
  values (auth.uid(), g, p_species_id, p_nickname, r, p_light, p_water_every_days, p_species_source)
  returning id into p;
  return query select g, p;
end $$;

-- ───────────── Vue du jardin : jardin de chaque plante ─────────────
drop view public.plant_overview;
create view public.plant_overview with (security_invoker = true) as
select p.*,
  s.name as species_name, s.latin, s.form, s.light as species_light, s.light_label, s.air,
  coalesce(p.care_tip, s.tip) as tip,
  r.name as room_name,
  g.name as garden_name, g.city as garden_city, g.country as garden_country,
  g.country_code as garden_country_code, g.latitude as garden_latitude,
  lw.last_watered_at,
  pw.previous_watered_at,
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
where p.archived_at is null;
