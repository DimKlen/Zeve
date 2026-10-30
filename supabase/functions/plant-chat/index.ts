// Edge Function plant-chat (docs/06 F8, docs/07) : la plante répond à la première personne.
// Moteur : API Gemini (offre gratuite) au lieu de Claude, choix du propriétaire du projet.
// La clé reste ici, jamais dans l'app.
//
// Secrets : GEMINI_API_KEY, GEMINI_MODEL (défaut ci-dessous). En local sans clé : CHAT_MOCK=1.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import {
  buildSystemPrompt,
  extractAction,
  toGeminiContents,
  type GeminiPart,
  type StoredMessage,
} from '../_shared/chatPrompt.ts';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DAILY_QUOTA = 30;
const HISTORY = 20;
const MAX_TEXT = 1000;
const TIMEOUT_MS = 25_000;
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

const stageOf = (days: number) => (days < 90 ? 'Pousse' : days < 365 ? 'Jeune' : 'Adulte');
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Client au nom de l'utilisateur : la RLS garantit qu'il ne lit et n'écrit que ses données.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: 'unauthorized' }, 401);

  const body = (await req.json().catch(() => ({}))) as {
    plantId?: string;
    text?: string;
    photoPath?: string;
  };
  const text = body.text?.trim().slice(0, MAX_TEXT) || null;
  const photoPath = body.photoPath ?? null;
  if (!body.plantId || (!text && !photoPath)) return json({ error: 'invalid_request' }, 400);
  if (photoPath && (!photoPath.startsWith(`${user.id}/`) || photoPath.includes('..'))) {
    return json({ error: 'invalid_photo_path' }, 400);
  }

  // Quota : 30 messages envoyés par jour (docs/06 F8).
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', since.toISOString());
  if ((count ?? 0) >= DAILY_QUOTA) return json({ error: 'quota' }, 429);

  const { data: plant } = await supabase
    .from('plant_overview')
    .select('*')
    .eq('id', body.plantId)
    .maybeSingle();
  if (!plant) return json({ error: 'plant_not_found' }, 404);

  const [{ data: history }, { data: waterings }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('role, content, photo_path')
      .eq('plant_id', plant.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY),
    supabase
      .from('watering_events')
      .select('watered_at')
      .eq('plant_id', plant.id)
      .order('watered_at', { ascending: false })
      .limit(5),
  ]);

  const system = buildSystemPrompt({
    nickname: plant.nickname,
    speciesName: plant.species_name,
    latin: plant.latin,
    roomName: plant.room_name,
    daysSinceWater: plant.days_since_water,
    waterEveryDays: plant.water_every_days,
    light: plant.light,
    lightLabel: plant.light_label,
    stage: stageOf(plant.days_since_created),
    recentWaterings: (waterings ?? []).map((w) => shortDate.format(new Date(w.watered_at))),
  });

  // Message courant : texte + photo réelle (image en ligne) si fournie.
  const parts: GeminiPart[] = [];
  if (photoPath) {
    const { data: photo } = await supabase.storage.from(BUCKET).download(photoPath);
    if (!photo) return json({ error: 'photo_not_found' }, 404);
    parts.push({
      inline_data: { mime_type: 'image/jpeg', data: encodeBase64(await photo.arrayBuffer()) },
    });
  }
  parts.push({ text: text ?? 'Regarde cette photo de moi : qu’en penses-tu ?' });

  let reply: string;
  if (Deno.env.get('CHAT_MOCK')) {
    reply =
      `Merci de prendre soin de moi ! ${photoPath ? 'Sur ta photo, mes feuilles ont l’air en forme. ' : ''}` +
      `Mon dernier arrosage date de ${plant.days_since_water} jours ; je préfère tous les ${plant.water_every_days} jours.\n` +
      '{"action":{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}}';
  } else {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'not_configured' }, 503);
    const model = Deno.env.get('GEMINI_MODEL') ?? DEFAULT_MODEL;
    const contents = [
      ...toGeminiContents(((history ?? []) as StoredMessage[]).reverse()),
      { role: 'user', parts },
    ];
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } catch {
      return json({ error: 'timeout' }, 504);
    }
    if (response.status === 429) return json({ error: 'provider_quota' }, 429);
    if (!response.ok) return json({ error: 'generation_failed', status: response.status }, 502);
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    reply = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!reply) return json({ error: 'empty_reply' }, 502);
  }

  const { content, actions } = extractAction(reply);

  // Les deux messages ne sont enregistrés qu'une fois la réponse obtenue : « Réessayer » ne duplique rien.
  const { error: userError } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, plant_id: plant.id, role: 'user', content: text, photo_path: photoPath });
  if (userError) return json({ error: 'save_failed' }, 500);
  const { data: saved, error: botError } = await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      plant_id: plant.id,
      role: 'assistant',
      content,
      actions: actions.length ? actions : null,
    })
    .select('id, content, actions, created_at')
    .single();
  if (botError) return json({ error: 'save_failed' }, 500);

  return json(saved);
});
