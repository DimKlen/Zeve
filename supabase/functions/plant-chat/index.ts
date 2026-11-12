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
  isSouthernPlace,
  leaksSecret,
  looksLikeInjection,
  plantDodge,
  seasonNameOf,
  toGeminiContents,
  type GeminiPart,
  type StoredMessage,
} from '../_shared/chatPrompt.ts';
import {
  applyFollowup,
  dueCheck,
  followupPrompt,
  type OpenFollowup,
} from '../_shared/followup.ts';
import { dayKey, dryingFromWeather, dueInfo, learnRhythm } from '../_shared/wateringModel.ts';

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

/** « 4 °C, 82 % d'humidité » : météo du moment du jardin (gardens.weather_now). */
function todayWeatherLine(value: unknown): string | null {
  const w = value as { temp?: unknown; humidity?: unknown } | null | undefined;
  if (!w || typeof w.temp !== 'number') return null;
  const temp = `${Math.round(w.temp)} °C`;
  return typeof w.humidity === 'number' ? `${temp}, ${Math.round(w.humidity)} % d’humidité` : temp;
}

/** « 6 °C en moyenne, 80 % d'humidité » sur les 3 derniers jours connus (jusqu'à aujourd'hui). */
function recentWeatherLine(
  weather: { day: string; tempMean: number | null; humidity: number | null }[],
): string | null {
  const today = dayKey(new Date());
  const recent = weather.filter((w) => w.day <= today).slice(-3);
  const temps = recent.flatMap((w) => (w.tempMean === null ? [] : [w.tempMean]));
  const hums = recent.flatMap((w) => (w.humidity === null ? [] : [w.humidity]));
  if (!temps.length) return null;
  const avg = (v: number[]) => Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  return `${avg(temps)} °C en moyenne${hums.length ? `, ${avg(hums)} % d’humidité` : ''}`;
}

type Client = ReturnType<typeof createClient>;

/** Suivi de soins ouvert de la plante (un seul au plus). */
async function openFollowup(supabase: Client, plantId: string): Promise<OpenFollowup | null> {
  const { data } = await supabase
    .from('plant_followups')
    .select('id, topic, due_at, checks, created_at')
    .eq('plant_id', plantId)
    .eq('status', 'open')
    .maybeSingle();
  return data
    ? {
        id: data.id,
        topic: data.topic,
        dueAt: new Date(data.due_at),
        checks: data.checks,
        createdAt: new Date(data.created_at),
      }
    : null;
}

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
    /** Ouverture du fil : la plante prend des nouvelles si un suivi est échu (F22). */
    check?: boolean;
  };

  if (body.check && body.plantId) {
    const open = await openFollowup(supabase, body.plantId);
    const due = dueCheck(open, new Date());
    if (!due) return json({ checked: false });
    if (due.op === 'expire') {
      await supabase.from('plant_followups').update({ status: 'expired' }).eq('id', due.id);
      return json({ checked: false });
    }
    // Échéance déplacée d'abord : deux ouvertures rapprochées n'ajoutent qu'un message.
    const { data: moved } = await supabase
      .from('plant_followups')
      .update({ checks: due.checks, due_at: due.dueAt.toISOString() })
      .eq('id', due.id)
      .lte('due_at', new Date().toISOString())
      .select('id');
    if (!moved?.length) return json({ checked: false });
    const { error } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, plant_id: body.plantId, role: 'assistant', content: due.message });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ checked: true });
  }

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

  const followup = await openFollowup(supabase, plant.id);
  // Garde-fou : une tentative d'extraction de secrets ou de détournement ne part jamais au modèle.
  const refused = !!text && looksLikeInjection(text);
  const southern = isSouthernPlace(plant.garden_latitude, plant.garden_country_code);

  // Même calcul que l'app : date d'arrosage ajustée à la météo, rythme appris (wateringModel).
  const weatherSince = new Date(Date.now() - 45 * 86_400_000);
  const { data: weatherRows } = plant.garden_id
    ? await supabase
        .from('garden_weather')
        .select('day, et0_mm, temp_mean, humidity_mean')
        .eq('garden_id', plant.garden_id)
        .gte('day', dayKey(weatherSince))
        .order('day', { ascending: true })
    : { data: null };
  const weather = (weatherRows ?? []).map((w) => ({
    day: w.day,
    et0: w.et0_mm,
    tempMean: w.temp_mean,
    humidity: w.humidity_mean,
  }));
  const drying = dryingFromWeather(weather);
  const { data: gardenNow } = plant.garden_id
    ? await supabase.from('gardens').select('weather_now').eq('id', plant.garden_id).maybeSingle()
    : { data: null };
  const due = dueInfo(
    {
      waterEveryDays: plant.water_every_days,
      lastWateredAt: plant.last_watered_at ? new Date(plant.last_watered_at) : null,
      createdAt: new Date(plant.created_at),
    },
    drying,
  );
  const wateringEvents = (Array.isArray(plant.watering_history) ? plant.watering_history : []).flatMap(
    (item: { at?: unknown; expected?: unknown }) =>
      typeof item?.at === 'string'
        ? [{ at: new Date(item.at), expectedDays: typeof item.expected === 'number' ? item.expected : null }]
        : [],
  );
  const learned = learnRhythm(wateringEvents, plant.water_every_days, drying);
  const system = buildSystemPrompt({
    nickname: plant.nickname,
    speciesName: plant.species_name,
    latin: plant.latin,
    daysSinceWater: plant.days_since_water,
    waterEveryDays: plant.water_every_days,
    light: plant.species_light,
    lightLabel: plant.light_label,
    stage: stageOf(plant.days_since_created),
    recentWaterings: (waterings ?? []).map((w) => shortDate.format(new Date(w.watered_at))),
    season: seasonNameOf(new Date(), southern),
    place: [plant.garden_city, plant.garden_country].filter(Boolean).join(', ') || null,
    southern,
    nextWatering:
      due.daysUntilNext <= 0
        ? 'aujourd’hui'
        : due.daysUntilNext === 1
          ? 'demain'
          : `dans ${due.daysUntilNext} jours`,
    learnedEveryDays: learned.stable ? learned.estimate : null,
    recentWeather: recentWeatherLine(weather),
    todayWeather: todayWeatherLine(gardenNow?.weather_now),
  });
  const systemWithFollowup = [system, ...followupPrompt(followup)].join('\n');

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
  if (refused) {
    reply = plantDodge(text.length);
  } else if (Deno.env.get('CHAT_MOCK') && followup && /mieux|disparu|réglé|plus rien/i.test(text ?? '')) {
    // Suivi de démo (F22) : « ça va mieux » clôt le suivi en cours.
    reply =
      `Super nouvelle pour ${followup.topic}, merci pour tes bons soins !\n` +
      '{"action":{"type":"followup_done"}}';
  } else if (Deno.env.get('CHAT_MOCK') && /cochenille/i.test(text ?? '')) {
    // Suivi de démo (F22) : un message qui parle de cochenilles ouvre un suivi à 5 jours.
    reply =
      'Les cochenilles adorent l’aisselle de mes feuilles. Passe un coton imbibé d’alcool sur chaque tache, ' +
      'puis isole-moi des autres plantes une semaine.\n' +
      '{"action":{"type":"followup","days":5,"topic":"les cochenilles"}}';
  } else if (Deno.env.get('CHAT_MOCK')) {
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
            systemInstruction: { parts: [{ text: systemWithFollowup }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
            // Filtres de contenu du fournisseur au plus strict, en plus du périmètre du prompt.
            safetySettings: [
              'HARM_CATEGORY_HARASSMENT',
              'HARM_CATEGORY_HATE_SPEECH',
              'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              'HARM_CATEGORY_DANGEROUS_CONTENT',
            ].map((category) => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' })),
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
    // Dernier filet : une réponse qui laisse fuiter une clé ou le prompt est remplacée.
    if (leaksSecret(reply)) reply = plantDodge(reply.length);
  }

  const { content, actions, followup: followupAction } = extractAction(reply);

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

  // Suivi de soins : créé, replanifié ou clos selon la réponse (un seul ouvert par plante).
  const write = applyFollowup(followup, followupAction, new Date());
  if (write?.op === 'insert') {
    await supabase.from('plant_followups').insert({
      user_id: user.id,
      plant_id: plant.id,
      topic: write.topic,
      due_at: write.dueAt.toISOString(),
    });
  } else if (write?.op === 'update') {
    await supabase
      .from('plant_followups')
      .update({ topic: write.topic, due_at: write.dueAt.toISOString() })
      .eq('id', write.id);
  } else if (write?.op === 'resolve') {
    await supabase.from('plant_followups').update({ status: 'resolved' }).eq('id', write.id);
  }

  return json({ ...saved, followup: write?.op ?? null });
});
