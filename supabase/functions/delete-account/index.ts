// Edge Function delete-account (docs/06 F1, docs/07) : supprime les photos de l'utilisateur dans
// Storage puis le compte (les tables suivent par cascade). Obligatoire pour l'App Store.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'plant-photos';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  // Identité vérifiée avec le jeton de l'appelant…
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await asUser.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: 'unauthorized' }, 401);

  // … puis client administrateur, limité à ce seul utilisateur.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Toutes les photos sous {uid}/ (dossiers tmp/, {plant_id}/, {plant_id}/chat/).
  const paths: string[] = [];
  const walk = async (prefix: string): Promise<void> => {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`;
      // Un dossier n'a pas d'id dans la liste Storage.
      if (item.id === null) await walk(path);
      else paths.push(path);
    }
  };
  try {
    await walk(user.id);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
      if (error) throw error;
    }
  } catch {
    return json({ error: 'storage_cleanup_failed' }, 500);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: 'delete_failed' }, 500);
  return json({ deleted: true, photos: paths.length });
});
