// Edge Function discover-plant (docs/06 F16, mode « Découvrir ») : reconnaît n'importe quelle plante
// sur une photo (Pl@ntNet) et rédige sa fiche « découverte » (Gemini, JSON structuré), mise en cache
// par espèce dans plant_facts. Simulation : DISCOVER_MOCK=1 (local, CI, E2E).
//   { photoPath } → { candidates, facts }   (compte dans le quota quotidien)
//   { latin, commonName?, family? } → { facts }   (fiche d'un autre candidat, à la demande)
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  FACTS_SCHEMA,
  factsPrompt,
  MOCK_CANDIDATES,
  mockFacts,
  normalizeFacts,
  parseCandidates,
  type Candidate,
  type PlantFacts,
} from '../_shared/discover.ts';
import { catalogMatch, normalizeLatin } from '../_shared/matchSpecies.ts';

const PLANTNET_URL = 'https://my-api.plantnet.org/v2/identify/all';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DAILY_QUOTA = 20;
const TIMEOUT_MS = 18_000;
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

type Body = { photoPath?: string; latin?: string; commonName?: string | null; family?: string | null };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: 'unauthorized' }, 401);
  // Cache partagé des fiches : écrit avec la clé de service, jamais exposée à l'app.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const mock = !!Deno.env.get('DISCOVER_MOCK');

  const body = (await req.json().catch(() => ({}))) as Body;

  // Quota quotidien par utilisateur (Pl@ntNet gratuit : 500 identifications par jour en tout).
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('discoveries')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());
  if ((count ?? 0) >= DAILY_QUOTA) return json({ error: 'quota' }, 429);

  /** Fiche d'une espèce : cache, sinon Gemini (null si la génération échoue). */
  async function factsFor(c: Pick<Candidate, 'latin' | 'commonName' | 'family'>): Promise<PlantFacts | null> {
    const key = normalizeLatin(c.latin);
    const { data: cached } = await admin
      .from('plant_facts')
      .select('facts')
      .eq('latin_key', key)
      .eq('lang', 'fr')
      .maybeSingle();
    if (cached) return normalizeFacts(cached.facts);
    let facts: PlantFacts;
    if (mock) {
      facts = mockFacts(c.latin);
    } else {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) return null;
      const model = Deno.env.get('GEMINI_MODEL') ?? DEFAULT_MODEL;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: factsPrompt(c) }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 900,
                responseMimeType: 'application/json',
                responseSchema: FACTS_SCHEMA,
              },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          },
        );
        if (!response.ok) return null;
        const data = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const raw = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
        facts = normalizeFacts(JSON.parse(raw));
      } catch {
        return null;
      }
    }
    await admin.from('plant_facts').upsert({
      latin_key: key,
      lang: 'fr',
      latin: c.latin,
      common_name: c.commonName,
      family: c.family,
      facts,
    });
    return facts;
  }

  // Fiche d'un autre candidat (« Pas sûr » → l'utilisateur en choisit un).
  if (!body.photoPath) {
    if (!body.latin || body.latin.length > 120) return json({ error: 'invalid_request' }, 400);
    const facts = await factsFor({
      latin: body.latin,
      commonName: body.commonName ?? null,
      family: body.family ?? null,
    });
    return json({ facts });
  }

  const photoPath = body.photoPath;
  if (!photoPath.startsWith(`${user.id}/tmp/`) || photoPath.includes('..')) {
    return json({ error: 'invalid_photo_path' }, 400);
  }

  let candidates: Candidate[];
  if (mock) {
    candidates = MOCK_CANDIDATES;
  } else {
    const apiKey = Deno.env.get('PLANTNET_API_KEY');
    if (!apiKey) return json({ error: 'not_configured' }, 503);
    const { data: photo, error: photoError } = await supabase.storage.from(BUCKET).download(photoPath);
    if (photoError || !photo) return json({ error: 'photo_not_found' }, 404);
    const form = new FormData();
    form.append('images', photo, 'plant.jpg');
    form.append('organs', 'auto');
    let response: Response;
    try {
      response = await fetch(`${PLANTNET_URL}?api-key=${encodeURIComponent(apiKey)}&lang=fr&nb-results=5`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return json({ error: 'timeout' }, 504);
    }
    // Pl@ntNet répond 404 quand aucune plante n'est reconnue sur la photo.
    if (response.status === 404) candidates = [];
    else if (!response.ok) return json({ error: 'identification_failed', status: response.status }, 502);
    else candidates = parseCandidates(await response.json());
  }

  // La photo ne sert qu'à l'identification : supprimée tout de suite (confidentialité).
  await supabase.storage.from(BUCKET).remove([photoPath]);
  await supabase.from('discoveries').insert({ user_id: user.id, latin: candidates[0]?.latin ?? null });

  const { data: catalog } = await supabase.from('species').select('id, latin');
  const linked = candidates.map((c) => ({ ...c, catalogSpeciesId: catalogMatch(c.latin, catalog ?? []) }));
  const facts = candidates[0] ? await factsFor(candidates[0]) : null;
  return json({ candidates: linked, facts });
});
