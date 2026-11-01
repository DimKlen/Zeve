-- Catalogue : 6 espèces courantes absentes du design d'origine (dont le syngonium, demandé à
-- l'usage). Entretien repris du type de dessin, comme pour les 52 premières (src/plants/careInfo.ts).
insert into public.species (id, name, latin, form, category, color_a, color_b, color_f, light, light_label, air, water_every_days, tip) values
  ('syngonium', 'Syngonium', 'Syngonium podophyllum', 'pothos', 'retombantes', '#5E9A5A', '#A9C98F', '#E8B931', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('hoya', 'Hoya', 'Hoya carnosa', 'pothos', 'retombantes', '#4A7A4E', '#6E9A62', '#F08A8A', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('ceropegia', 'Chaîne des cœurs', 'Ceropegia linearis', 'pothos', 'retombantes', '#5E8A6A', '#9AB89A', '#C9A0B8', 'ombre', 'Mi-ombre', 'Normal', 7, 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.'),
  ('alocasia', 'Alocasia', 'Alocasia amazonica', 'monstera', 'feuillage', '#2F5E3E', '#4E7F58', '#E8B931', 'indirect', 'Vive, indirecte', 'Humide', 8, 'Arrose quand les 3 premiers cm de terre sont secs. Essuie ses grandes feuilles de temps en temps.'),
  ('dieffenbachia', 'Dieffenbachia', 'Dieffenbachia seguine', 'calathea', 'feuillage', '#4F8A4E', '#B8D49A', '#E8B931', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.'),
  ('croton', 'Croton', 'Codiaeum variegatum', 'calathea', 'feuillage', '#4E7F42', '#E8B931', '#D9534F', 'ombre', 'Mi-ombre', 'Très humide', 5, 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.')
on conflict (id) do nothing;
