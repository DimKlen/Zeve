-- Zeve — schéma Supabase (Postgres). À placer dans supabase/migrations/0001_init.sql.
-- Convention : toutes les tables utilisateur ont user_id = auth.uid() (RLS stricte).

create extension if not exists "pgcrypto";

-- ───────────── Profils ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  display_email text,                -- e-mail affiché (peut être un relais Apple privé)
  auth_provider text check (auth_provider in ('google','apple','email')),
  reminders_enabled boolean not null default true,
  reminder_time time not null default '09:00',
  timezone text not null default 'Europe/Paris',
  expo_push_token text,
  onboarded_at timestamptz,          -- null = afficher l'onboarding (Bienvenue · rappels)
  created_at timestamptz not null default now()
);

-- ───────────── Pièces ─────────────
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position int not null default 0,
  unique (user_id, name)
);

-- Création automatique du profil + pièces par défaut à l'inscription
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
  insert into public.rooms (user_id, name, position) values
    (new.id, 'Salon', 0), (new.id, 'Chambre', 1), (new.id, 'Cuisine', 2), (new.id, 'Salle de bain', 3), (new.id, 'Balcon', 4);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────────── Catalogue d'espèces (lecture publique, seed ci-dessous) ─────────────
create table public.species (
  id text primary key,
  name text not null,
  latin text not null,
  form text not null,                -- un des 19 types de dessin (voir reference/plants)
  category text not null check (category in ('feuillage','succulentes','aromatiques','fleurs','arbres','retombantes')),
  color_a text not null, color_b text not null, color_f text not null,
  light text not null check (light in ('ombre','indirect','soleil')),
  light_label text not null,
  air text not null,
  water_every_days int not null,
  tip text not null
);

-- ───────────── Plantes ─────────────
create type public.light_exposure as enum ('ombre','indirect','soleil');
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id text not null references public.species(id),
  nickname text not null,
  room_id uuid references public.rooms(id) on delete set null,
  light public.light_exposure not null default 'indirect',
  water_every_days int not null,     -- copié depuis species à la création, modifiable plus tard
  species_source text check (species_source in ('photo','list')),
  photo_path text,                   -- storage: plant-photos/{user_id}/{plant_id}/{uuid}.jpg
  created_at timestamptz not null default now(),  -- sert au stade de croissance (Pousse/Jeune/Adulte)
  archived_at timestamptz
);
create index on public.plants (user_id) where archived_at is null;

-- ───────────── Arrosages ─────────────
create table public.watering_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  watered_at timestamptz not null default now()
);
create index on public.watering_events (plant_id, watered_at desc);

-- ───────────── Chat IA ─────────────
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text,
  photo_path text,
  actions jsonb,                     -- ex. [{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}]
  created_at timestamptz not null default now()
);
create index on public.chat_messages (plant_id, created_at);

-- ───────────── Rappels ponctuels (« Me rappeler dans 3 jours ») ─────────────
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  due_at timestamptz not null,
  message text not null,
  sent_at timestamptz
);

-- ───────────── Vue d'état (jardin) ─────────────
create or replace view public.plant_overview with (security_invoker = true) as
select p.*,
  s.name as species_name, s.latin, s.form, s.light as species_light, s.light_label, s.air, s.tip,
  r.name as room_name,
  lw.last_watered_at,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) as days_since_water,
  (current_date - p.created_at::date) as days_since_created,
  (current_date - coalesce(lw.last_watered_at, p.created_at)::date) >= p.water_every_days as is_thirsty
from public.plants p
join public.species s on s.id = p.species_id
left join public.rooms r on r.id = p.room_id
left join lateral (select max(w.watered_at) as last_watered_at from public.watering_events w where w.plant_id = p.id) lw on true
where p.archived_at is null;

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.species enable row level security;
alter table public.plants enable row level security;
alter table public.watering_events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reminders enable row level security;

create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "species readable" on public.species for select using (true);
do $$ declare t text; begin
  foreach t in array array['rooms','plants','watering_events','chat_messages','reminders'] loop
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public) values ('plant-photos', 'plant-photos', false) on conflict do nothing;
create policy "own photos read" on storage.objects for select using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos write" on storage.objects for insert with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects for delete using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────── Seed : 52 espèces ─────────────
insert into public.species (id, name, latin, form, category, color_a, color_b, color_f, light, light_label, air, water_every_days, tip) values
  ('monstera', 'Monstera', 'Monstera deliciosa', 'monstera', 'feuillage', '#3F7A4E', '#4F8350', '#E8B931', 'indirect', 'Vive, indirecte', 'Humide', 8, 'Arrose quand les 3 premiers cm de terre sont secs. Essuie ses grandes feuilles de temps en temps.'),
  ('adansonii', 'Monstera à trous', 'Monstera adansonii', 'monstera', 'feuillage', '#4E8A52', '#62995E', '#E8B931', 'indirect', 'Vive, indirecte', 'Humide', 8, 'Arrose quand les 3 premiers cm de terre sont secs. Essuie ses grandes feuilles de temps en temps.'),
  ('selloum', 'Philodendron selloum', 'Thaumatophyllum bipinnatifidum', 'monstera', 'feuillage', '#3E7448', '#568A55', '#E8B931', 'indirect', 'Vive, indirecte', 'Humide', 8, 'Arrose quand les 3 premiers cm de terre sont secs. Essuie ses grandes feuilles de temps en temps.'),
  ('basilic', 'Basilic', 'Ocimum basilicum', 'herb', 'aromatiques', '#6E9F4E', '#8DB46A', '#E8B931', 'soleil', 'Plein soleil', 'Normal', 2, 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.'),
  ('menthe', 'Menthe', 'Mentha spicata', 'herb', 'aromatiques', '#5E9A56', '#7DB06E', '#E8B931', 'soleil', 'Plein soleil', 'Normal', 2, 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.'),
  ('persil', 'Persil', 'Petroselinum crispum', 'herb', 'aromatiques', '#4F8A3E', '#6EA052', '#E8B931', 'soleil', 'Plein soleil', 'Normal', 2, 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.'),
  ('coriandre', 'Coriandre', 'Coriandrum sativum', 'herb', 'aromatiques', '#68A04E', '#88B868', '#E8B931', 'soleil', 'Plein soleil', 'Normal', 2, 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.'),
  ('origan', 'Origan', 'Origanum vulgare', 'herb', 'aromatiques', '#6E9468', '#8AAA7E', '#E8B931', 'soleil', 'Plein soleil', 'Normal', 2, 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.'),
  ('lavande', 'Lavande', 'Lavandula angustifolia', 'lavender', 'aromatiques', '#8FA28A', '#A9B7A2', '#8C6BB8', 'soleil', 'Plein soleil', 'Sec', 10, 'Peu d’eau, beaucoup de soleil. Taille légèrement après la floraison.'),
  ('romarin', 'Romarin', 'Salvia rosmarinus', 'lavender', 'aromatiques', '#5E7E5E', '#7A957A', '#6E8FCB', 'soleil', 'Plein soleil', 'Sec', 10, 'Peu d’eau, beaucoup de soleil. Taille légèrement après la floraison.'),
  ('pilea', 'Pilea', 'Pilea peperomioides', 'pilea', 'feuillage', '#5E9A62', '#86B47F', '#E8B931', 'indirect', 'Lumineux', 'Normal', 6, 'Tourne le pot d’un quart de tour chaque semaine pour qu’elle pousse droite.'),
  ('peperomia', 'Peperomia', 'Peperomia obtusifolia', 'pilea', 'feuillage', '#4F8A4A', '#6EA05E', '#E8B931', 'indirect', 'Lumineux', 'Normal', 6, 'Tourne le pot d’un quart de tour chaque semaine pour qu’elle pousse droite.'),
  ('calathea', 'Calathea orbifolia', 'Goeppertia orbifolia', 'calathea', 'feuillage', '#5E9468', '#7AA882', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.'),
  ('makoyana', 'Calathea paon', 'Goeppertia makoyana', 'calathea', 'feuillage', '#4F7F52', '#6E9A68', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.'),
  ('maranta', 'Maranta', 'Maranta leuconeura', 'calathea', 'feuillage', '#3F7048', '#5A8A5E', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.'),
  ('aglaonema', 'Aglaonema', 'Aglaonema commutatum', 'calathea', 'feuillage', '#4E7F5A', '#8AAE88', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.'),
  ('olivier', 'Olivier', 'Olea europaea', 'olive', 'arbres', '#7E9A6A', '#A2B48A', '#4A4A3A', 'soleil', 'Plein soleil', 'Sec', 7, 'Supporte bien la sécheresse. À rentrer s’il gèle.'),
  ('citronnier', 'Citronnier', 'Citrus × meyeri', 'olive', 'arbres', '#4F8350', '#6E9468', '#E8C431', 'soleil', 'Plein soleil', 'Sec', 7, 'Supporte bien la sécheresse. À rentrer s’il gèle.'),
  ('benjamina', 'Ficus benjamina', 'Ficus benjamina', 'olive', 'arbres', '#4E8A4E', '#6EA066', '#4E8A4E', 'soleil', 'Plein soleil', 'Sec', 7, 'Supporte bien la sécheresse. À rentrer s’il gèle.'),
  ('echinopsis', 'Cactus oursin', 'Echinopsis', 'cactus', 'succulentes', '#4E7F5A', '#6E9A72', '#E98BA6', 'soleil', 'Plein soleil', 'Sec', 14, 'Très peu d’eau en hiver : une fois par mois suffit.'),
  ('cierge', 'Cierge du Pérou', 'Cereus repandus', 'cactus', 'succulentes', '#5E8E7A', '#78A592', '#F2F0E6', 'soleil', 'Plein soleil', 'Sec', 14, 'Très peu d’eau en hiver : une fois par mois suffit.'),
  ('echeveria', 'Echeveria', 'Echeveria elegans', 'echeveria', 'succulentes', '#8DB0A4', '#A9C4B8', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 12, 'Arrose seulement quand la terre est sèche, sans mouiller le cœur de la rosette.'),
  ('joubarbe', 'Joubarbe', 'Sempervivum tectorum', 'echeveria', 'succulentes', '#7FA06E', '#B07A70', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 12, 'Arrose seulement quand la terre est sèche, sans mouiller le cœur de la rosette.'),
  ('grapto', 'Graptopetalum', 'Graptopetalum paraguayense', 'echeveria', 'succulentes', '#A8A9B8', '#C2C0CC', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 12, 'Arrose seulement quand la terre est sèche, sans mouiller le cœur de la rosette.'),
  ('aloe', 'Aloe vera', 'Aloe vera', 'aloe', 'succulentes', '#6E9A72', '#8AAE88', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 14, 'Laisse bien sécher la terre entre deux arrosages.'),
  ('haworthia', 'Haworthia', 'Haworthiopsis attenuata', 'aloe', 'succulentes', '#3F6B48', '#5A8462', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 14, 'Laisse bien sécher la terre entre deux arrosages.'),
  ('agave', 'Agave', 'Agave americana', 'aloe', 'succulentes', '#7E9EA0', '#9CB6B6', '#E8B931', 'soleil', 'Plein soleil', 'Sec', 14, 'Laisse bien sécher la terre entre deux arrosages.'),
  ('sansevieria', 'Langue de belle-mère', 'Dracaena trifasciata', 'sansevieria', 'feuillage', '#3F6B48', '#4F7F52', '#D8C25A', 'ombre', 'Peu exigeante', 'Sec', 18, 'Supporte l’oubli : un arrosage toutes les 2 à 3 semaines suffit.'),
  ('cylindrica', 'Sansevieria cylindrica', 'Dracaena angolensis', 'sansevieria', 'feuillage', '#4E7058', '#62846A', '#4E7058', 'ombre', 'Peu exigeante', 'Sec', 18, 'Supporte l’oubli : un arrosage toutes les 2 à 3 semaines suffit.'),
  ('pothos', 'Pothos', 'Epipremnum aureum', 'pothos', 'retombantes', '#4F8A3E', '#8DB46A', '#E8B931', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('scandens', 'Philodendron grimpant', 'Philodendron hederaceum', 'pothos', 'retombantes', '#3F7A3E', '#5A9450', '#E8B931', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('lierre', 'Lierre', 'Hedera helix', 'pothos', 'retombantes', '#3E6B48', '#5E8A5E', '#E8B931', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('tradescantia', 'Misère', 'Tradescantia zebrina', 'pothos', 'retombantes', '#6E8FA0', '#9A7AB0', '#E8B931', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('boston', 'Fougère de Boston', 'Nephrolepis exaltata', 'fern', 'retombantes', '#5E9A46', '#78B05A', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 3, 'Terre toujours fraîche et air humide : brumise ses frondes.'),
  ('capillaire', 'Capillaire', 'Adiantum raddianum', 'fern', 'retombantes', '#6EA65A', '#8EBE72', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 3, 'Terre toujours fraîche et air humide : brumise ses frondes.'),
  ('kentia', 'Kentia', 'Howea forsteriana', 'palm', 'arbres', '#3F7A4E', '#5A9460', '#E8B931', 'indirect', 'Lumineux', 'Humide', 7, 'Arrose quand le dessus de la terre est sec. Pas de soleil direct.'),
  ('areca', 'Areca', 'Dypsis lutescens', 'palm', 'arbres', '#6E9F4E', '#8DB46A', '#E8B931', 'indirect', 'Lumineux', 'Humide', 7, 'Arrose quand le dessus de la terre est sec. Pas de soleil direct.'),
  ('chamaedorea', 'Palmier nain', 'Chamaedorea elegans', 'palm', 'arbres', '#4F8A50', '#6AA068', '#E8B931', 'indirect', 'Lumineux', 'Humide', 7, 'Arrose quand le dessus de la terre est sec. Pas de soleil direct.'),
  ('caoutchouc', 'Caoutchouc', 'Ficus elastica', 'ficus', 'feuillage', '#2F5A3A', '#3F6B48', '#B5545C', 'indirect', 'Vive, indirecte', 'Normal', 9, 'Essuie ses feuilles pour qu’elles restent brillantes. Évite les courants d’air.'),
  ('lyrata', 'Figuier lyre', 'Ficus lyrata', 'ficus', 'feuillage', '#3F7A3E', '#4F8A4A', '#8DB46A', 'indirect', 'Vive, indirecte', 'Normal', 9, 'Essuie ses feuilles pour qu’elles restent brillantes. Évite les courants d’air.'),
  ('schefflera', 'Schefflera', 'Heptapleurum arboricola', 'ficus', 'feuillage', '#4F8350', '#6E9468', '#8DB46A', 'indirect', 'Vive, indirecte', 'Normal', 9, 'Essuie ses feuilles pour qu’elles restent brillantes. Évite les courants d’air.'),
  ('avocatier', 'Avocatier', 'Persea americana', 'ficus', 'feuillage', '#4E7F42', '#6A9452', '#9AB06A', 'indirect', 'Vive, indirecte', 'Normal', 9, 'Essuie ses feuilles pour qu’elles restent brillantes. Évite les courants d’air.'),
  ('phalaenopsis', 'Orchidée papillon', 'Phalaenopsis', 'orchid', 'fleurs', '#3F6B48', '#4F7F52', '#EBC4DA', 'indirect', 'Lumineux', 'Humide', 9, 'Trempe le pot 10 minutes quand les racines deviennent argentées.'),
  ('cymbidium', 'Cymbidium', 'Cymbidium', 'orchid', 'fleurs', '#4E7F42', '#5E9050', '#F0D27A', 'indirect', 'Lumineux', 'Humide', 9, 'Trempe le pot 10 minutes quand les racines deviennent argentées.'),
  ('spathiphyllum', 'Fleur de lune', 'Spathiphyllum wallisii', 'lily', 'fleurs', '#2F5A3A', '#3F6B48', '#FBF8F1', 'ombre', 'Mi-ombre', 'Humide', 5, 'Ses feuilles s’affaissent quand elle a soif ; elle se redresse vite après arrosage.'),
  ('anthurium', 'Anthurium', 'Anthurium andraeanum', 'lily', 'fleurs', '#2F5A3A', '#3F6B48', '#C8463E', 'ombre', 'Mi-ombre', 'Humide', 5, 'Ses feuilles s’affaissent quand elle a soif ; elle se redresse vite après arrosage.'),
  ('zamioculcas', 'Plante ZZ', 'Zamioculcas zamiifolia', 'zz', 'feuillage', '#2F5A3A', '#3F6B48', '#E8B931', 'ombre', 'Peu exigeante', 'Sec', 16, 'Elle stocke l’eau dans ses tiges : arrose seulement quand la terre est sèche.'),
  ('jade', 'Arbre de jade', 'Crassula ovata', 'zz', 'feuillage', '#5E8E52', '#7AA868', '#E8B931', 'ombre', 'Peu exigeante', 'Sec', 16, 'Elle stocke l’eau dans ses tiges : arrose seulement quand la terre est sèche.'),
  ('geranium', 'Géranium', 'Pelargonium zonale', 'geranium', 'fleurs', '#5E9046', '#78A85A', '#D9534F', 'soleil', 'Plein soleil', 'Normal', 4, 'Retire les fleurs fanées pour qu’elle refleurisse.'),
  ('begonia', 'Bégonia', 'Begonia semperflorens', 'geranium', 'fleurs', '#4E7F42', '#6A9452', '#F08A8A', 'soleil', 'Plein soleil', 'Normal', 4, 'Retire les fleurs fanées pour qu’elle refleurisse.'),
  ('saintpaulia', 'Violette africaine', 'Saintpaulia ionantha', 'geranium', 'fleurs', '#3F6B48', '#557F5A', '#8C6BB8', 'soleil', 'Plein soleil', 'Normal', 4, 'Retire les fleurs fanées pour qu’elle refleurisse.'),
  ('chlorophytum', 'Plante araignée', 'Chlorophytum comosum', 'spider', 'retombantes', '#6E9F4E', '#9CC07A', '#E8B931', 'indirect', 'Lumineux', 'Normal', 6, 'Ses bébés se replantent facilement dans un petit pot.');
