// Edge Function identify-species (docs/06 F7, docs/07) : reconnaît l'espèce d'une photo déjà
// envoyée dans Storage. Moteur : API Pl@ntNet (gratuite en usage non commercial) au lieu de Claude,
// choix du propriétaire du projet (pas de coût). La clé reste ici, jamais dans l'app.
//
// Secrets : PLANTNET_API_KEY. En local sans clé : IDENTIFY_MOCK_SPECIES=<id> simule une reconnaissance.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { matchSpecies, type PlantNetResult } from '../_shared/matchSpecies.ts';

const PLANTNET_URL = 'https://my-api.plantnet.org/v2/identify/all';
const TIMEOUT_MS = 18_000; // l'app abandonne à 20 s
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

  // Client au nom de l'utilisateur : la RLS de Storage et des tables s'applique.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: 'unauthorized' }, 401);

  const { photoPath } = (await req.json().catch(() => ({}))) as { photoPath?: string };
  if (!photoPath || !photoPath.startsWith(`${user.id}/`) || photoPath.includes('..')) {
    return json({ error: 'invalid_photo_path' }, 400);
  }

  const { data: catalog, error: catalogError } = await supabase.from('species').select('id, latin');
  if (catalogError) return json({ error: 'catalog_unavailable' }, 500);

  const mock = Deno.env.get('IDENTIFY_MOCK_SPECIES');
  if (mock) {
    const known = catalog.some((s) => s.id === mock);
    return json({ speciesId: known ? mock : null, confidence: known ? 0.9 : 0, alternatives: [] });
  }

  const apiKey = Deno.env.get('PLANTNET_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  const { data: photo, error: photoError } = await supabase.storage.from(BUCKET).download(photoPath);
  if (photoError || !photo) return json({ error: 'photo_not_found' }, 404);

  const form = new FormData();
  form.append('images', photo, 'plant.jpg');
  form.append('organs', 'auto');
  const url = `${PLANTNET_URL}?api-key=${encodeURIComponent(apiKey)}&lang=fr&nb-results=5`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return json({ error: 'timeout' }, 504);
  }
  // Pl@ntNet répond 404 quand aucune espèce ne correspond à la photo.
  if (response.status === 404) return json({ speciesId: null, confidence: 0, alternatives: [] });
  if (!response.ok) return json({ error: 'identification_failed', status: response.status }, 502);

  const body = (await response.json()) as { results?: PlantNetResult[] };
  return json(matchSpecies(body.results ?? [], catalog));
});
