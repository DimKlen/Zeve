-- Phase 4 : la photo de reconnaissance est déplacée de {uid}/tmp/ vers {uid}/{plant_id}/ à la
-- création de la plante (docs/06 F6). Storage `move` = mise à jour du nom de l'objet.
create policy "own photos update" on storage.objects for update
  using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);
