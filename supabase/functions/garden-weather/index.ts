// Edge Function garden-weather : rafraîchit le cache météo (garden_weather) des jardins de
// l'utilisateur depuis Open-Meteo (gratuit, sans clé). Sans coordonnées, la ville est géocodée
// une fois et enregistrée sur le jardin. Local, CI, E2E : WEATHER_MOCK=1 (météo neutre).
import { createClient } from 'npm:@supabase/supabase-js@2';

import { forecastUrl, geocodeUrl, mockDaily, parseDaily, parseGeocode } from '../_shared/openMeteo.ts';

const TIMEOUT_MS = 10_000;
/** Pas plus d'un appel par jardin toutes les 3 h. */
const FRESH_MS = 3 * 3_600_000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`open-meteo ${response.status}`);
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Jeton de l'utilisateur : la RLS limite lectures et écritures à ses jardins.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return json({ error: 'unauthorized' }, 401);

  const { data: gardens, error } = await supabase
    .from('gardens')
    .select('id, city, country_code, latitude, longitude');
  if (error) return json({ error: 'gardens_unavailable' }, 500);

  const mock = !!Deno.env.get('WEATHER_MOCK');
  const now = Date.now();
  let updated = 0;
  for (const garden of gardens) {
    try {
      const { data: last } = await supabase
        .from('garden_weather')
        .select('fetched_at')
        .eq('garden_id', garden.id)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last && now - new Date(last.fetched_at).getTime() < FRESH_MS) continue;

      let rows;
      if (mock) {
        rows = mockDaily(garden.id, new Date());
      } else {
        let { latitude, longitude } = garden;
        if ((latitude === null || longitude === null) && garden.city) {
          const place = parseGeocode(await getJson(geocodeUrl(garden.city, garden.country_code)));
          if (place) {
            ({ latitude, longitude } = place);
            await supabase.from('gardens').update(place).eq('id', garden.id);
          }
        }
        if (latitude === null || longitude === null) continue;
        rows = parseDaily(await getJson(forecastUrl(latitude, longitude)), garden.id);
      }
      if (!rows.length) continue;
      const fetchedAt = new Date().toISOString();
      const { error: upsertError } = await supabase
        .from('garden_weather')
        .upsert(rows.map((r) => ({ ...r, fetched_at: fetchedAt })));
      if (!upsertError) updated += 1;
    } catch (e) {
      // Un jardin en échec n'empêche pas les autres ; l'app garde le cache existant.
      console.error('garden-weather', garden.id, e instanceof Error ? e.message : e);
    }
  }
  return json({ gardens: gardens.length, updated });
});
