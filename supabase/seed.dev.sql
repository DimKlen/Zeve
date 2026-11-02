-- Données de démo (docs/06 F13) : Camille, son jardin « Paris 1 » (6 plantes) et « Montréal 1 » (2 plantes), dates relatives à aujourd'hui pour
-- reproduire les captures 07 et 08. Base locale uniquement (supabase db reset).
-- Connexion : « Continuer avec un e-mail » → camille@zeve.test → lien dans Mailpit (http://127.0.0.1:55324).
do $$
declare
  uid uuid := '11111111-1111-4111-8111-111111111111';
  paris uuid; montreal uuid;
  salon uuid; chambre uuid; cuisine uuid; sdb uuid; balcon uuid; bureau uuid; mtl_salon uuid;
  gaston uuid; basilic uuid; pepite uuid; frida uuid; olivia uuid; piquant uuid; hermes uuid; isis uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'camille@zeve.test', now(),
    '{"provider":"email","providers":["email"]}', '{"given_name":"Camille"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', 'camille@zeve.test', 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Le trigger handle_new_user a créé le profil ; chaque jardin crée ses 5 pièces par défaut.
  update public.profiles set onboarded_at = now() - interval '430 days' where id = uid;
  insert into public.gardens (user_id, name, city, country, country_code, latitude, longitude, created_at)
  values (uid, 'Paris 1', 'Paris', 'France', 'FR', 48.8566, 2.3522, now() - interval '430 days')
  returning id into paris;
  insert into public.gardens (user_id, name, city, country, country_code, latitude, longitude, created_at)
  values (uid, 'Montréal 1', 'Montréal', 'Canada', 'CA', 45.5019, -73.5674, now() - interval '90 days')
  returning id into montreal;
  insert into public.rooms (user_id, garden_id, name, position) values (uid, paris, 'Bureau', 5);

  select id into salon from public.rooms where user_id = uid and garden_id = paris and name = 'Salon';
  select id into chambre from public.rooms where user_id = uid and garden_id = paris and name = 'Chambre';
  select id into cuisine from public.rooms where user_id = uid and garden_id = paris and name = 'Cuisine';
  select id into sdb from public.rooms where user_id = uid and garden_id = paris and name = 'Salle de bain';
  select id into balcon from public.rooms where user_id = uid and garden_id = paris and name = 'Balcon';
  select id into bureau from public.rooms where user_id = uid and garden_id = paris and name = 'Bureau';

  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at, care_tip)
  values (uid, paris, 'monstera', 'Gaston', salon, 'indirect', 8, 'photo', now() - interval '430 days',
          'Arrose quand les 3 premiers cm de terre sont secs. Toxique pour les chats et les chiens.')
  returning id into gaston;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, paris, 'basilic', 'Basilic', cuisine, 'soleil', 2, 'list', now() - interval '35 days') returning id into basilic;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, paris, 'pilea', 'Pépite', chambre, 'indirect', 6, 'photo', now() - interval '160 days') returning id into pepite;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, paris, 'calathea', 'Frida', sdb, 'ombre', 5, 'list', now() - interval '290 days') returning id into frida;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, paris, 'olivier', 'Olivia', balcon, 'soleil', 7, 'list', now() - interval '820 days') returning id into olivia;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, paris, 'echinopsis', 'Piquant', bureau, 'soleil', 14, 'photo', now() - interval '60 days') returning id into piquant;

  -- Derniers arrosages : Gaston il y a 9 j (a soif), Basilic 3 j (a soif), Pépite 3 j (dans 3 j),
  -- Frida 4 j (demain), Olivia 2 j (dans 5 j), Piquant 2 j (dans 12 j).
  insert into public.watering_events (user_id, plant_id, watered_at) values
    (uid, gaston, now() - interval '17 days'), (uid, gaston, now() - interval '9 days'),
    (uid, basilic, now() - interval '5 days'), (uid, basilic, now() - interval '3 days'),
    (uid, pepite, now() - interval '9 days'), (uid, pepite, now() - interval '3 days'),
    -- Frida boit plus vite que son rythme de 5 j : arrosée tous les 4 j (suggestion « tous les 4 jours »).
    (uid, frida, now() - interval '20 days'), (uid, frida, now() - interval '16 days'),
    (uid, frida, now() - interval '12 days'), (uid, frida, now() - interval '8 days'),
    (uid, frida, now() - interval '4 days'),
    (uid, olivia, now() - interval '9 days'), (uid, olivia, now() - interval '2 days'),
    (uid, piquant, now() - interval '16 days'), (uid, piquant, now() - interval '2 days');

  -- Montréal 1 : deux plantes arrosées récemment (pas de soif, les captures 07 et 08 restent justes).
  select id into mtl_salon from public.rooms where garden_id = montreal and name = 'Salon';
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, montreal, 'pothos', 'Hermès', mtl_salon, 'ombre', 7, 'list', now() - interval '90 days') returning id into hermes;
  insert into public.plants (user_id, garden_id, species_id, nickname, room_id, light, water_every_days, species_source, created_at)
  values (uid, montreal, 'sansevieria', 'Isis', mtl_salon, 'ombre', 16, 'photo', now() - interval '80 days') returning id into isis;
  insert into public.watering_events (user_id, plant_id, watered_at) values
    (uid, hermes, now() - interval '1 day'), (uid, isis, now() - interval '5 days');

  -- Intervalle attendu de chaque arrosage : le rythme de la plante (apprentissage, migration 0007).
  update public.watering_events w set expected_days = p.water_every_days
  from public.plants p where p.id = w.plant_id and w.user_id = uid;
end $$;
