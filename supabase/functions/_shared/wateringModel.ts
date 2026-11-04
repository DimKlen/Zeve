// Rythme d'arrosage qui apprend de chaque plante et date d'arrosage ajustée à la météo.
// Module pur (ni React, ni Supabase, ni API Deno) : la même logique sert à l'app
// (src/plants/wateringModel.ts) et au chat (Edge Function plant-chat).

const DAY = 86_400_000;
/** Bornes du rythme, comme le menu « Rythme d'arrosage ». */
export const RHYTHM_MIN = 1;
export const RHYTHM_MAX = 60;
/** Intervalles exploitables avant de proposer un rythme. */
export const MIN_INTERVALS = 3;
/** Nouveaux intervalles à attendre après un refus avant de reproposer. */
export const AFTER_DECLINE = 3;
/** Décalage maximal de la date d'arrosage par la météo (jours). */
export const MAX_SHIFT = 2;
/** Part de la météo extérieure ressentie par une plante d'intérieur. */
export const INDOOR_WEIGHT = 0.25;
/** Poids du dernier intervalle dans la moyenne (les arrosages récents comptent plus). */
const ALPHA = 0.5;
/** Dispersion relative maximale (écart-type / moyenne) d'un rythme jugé stable. */
const MAX_SPREAD = 0.35;
/** Au-delà de 2× l'intervalle attendu : absence, vacances… intervalle ignoré. */
const OUTLIER_RATIO = 2;
const FACTOR_RANGE: [number, number] = [0.5, 1.8];
const MIN_WEATHER_DAYS = 7;
const HOT_DELTA = 2; // °C au-dessus de la normale
const DRY_DELTA = -10; // points d'humidité sous la normale

export type DailyWeather = {
  /** Jour local AAAA-MM-JJ. */
  day: string;
  /** Évapotranspiration de référence (mm/jour) : l'eau que l'air « tire » du sol. */
  et0: number | null;
  tempMean: number | null;
  humidity: number | null;
  /** Minimale du jour (°C) : gel annoncé. */
  tempMin?: number | null;
};

export type WateringEvent = { at: Date; expectedDays: number | null };

/** Effet séchant de chaque jour (1 = normale du lieu) et écarts à la normale. */
export type Drying = Record<string, { factor: number; tempDelta: number | null; humidityDelta: number | null }>;

export type WeatherCause = 'hot' | 'dry' | 'sunny' | 'cool' | 'humid';

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Effet de la météo jour par jour, rapporté à la normale du lieu (moyenne de la période connue).
 * Les plantes sont suivies comme des plantes d'intérieur : seulement INDOOR_WEIGHT de l'écart.
 * Null si la météo est trop maigre pour en tirer quoi que ce soit.
 */
export function dryingFromWeather(weather: DailyWeather[]): Drying | null {
  const known = weather.filter((w) => w.et0 !== null && w.et0 > 0);
  if (known.length < MIN_WEATHER_DAYS) return null;
  const baseEt0 = mean(known.map((w) => w.et0!));
  const temps = weather.flatMap((w) => (w.tempMean === null ? [] : [w.tempMean]));
  const hums = weather.flatMap((w) => (w.humidity === null ? [] : [w.humidity]));
  const baseTemp = temps.length ? mean(temps) : null;
  const baseHum = hums.length ? mean(hums) : null;
  const weight = INDOOR_WEIGHT;
  const out: Drying = {};
  for (const w of known) {
    const raw = clamp(w.et0! / baseEt0, FACTOR_RANGE);
    out[w.day] = {
      factor: 1 + (raw - 1) * weight,
      tempDelta: w.tempMean !== null && baseTemp !== null ? w.tempMean - baseTemp : null,
      humidityDelta: w.humidity !== null && baseHum !== null ? w.humidity - baseHum : null,
    };
  }
  return out;
}

const factorOn = (drying: Drying | null | undefined, d: Date) => drying?.[dayKey(d)]?.factor ?? 1;

export type DueInfo = {
  /** Jours avant l'arrosage (≤ 0 : à arroser aujourd'hui). */
  daysUntilNext: number;
  /** Intervalle effectif depuis le dernier arrosage, météo comprise. */
  dueDays: number;
  /** Écart dû à la météo (négatif : plus tôt). */
  shift: number;
  cause: WeatherCause | null;
};

/**
 * Date d'arrosage : chaque jour depuis le dernier arrosage « sèche » la terre de son facteur météo
 * (1 un jour normal) ; il faut arroser quand le total atteint le rythme de la plante.
 * Seule source de vérité de « a soif » (jauge, carte, rappels, chat).
 */
export function dueInfo(
  plant: { waterEveryDays: number; lastWateredAt: Date | null; createdAt: Date },
  drying: Drying | null | undefined,
  now = new Date(),
): DueInfo {
  const every = plant.waterEveryDays;
  const ref = plant.lastWateredAt ?? plant.createdAt;
  const since = Math.max(0, daysBetween(ref, now));
  let days = every;
  if (drying) {
    let total = 0;
    days = 0;
    while (total < every && days < every + MAX_SHIFT) {
      days += 1;
      total += factorOn(drying, addDays(ref, days));
    }
  }
  const dueDays = Math.max(RHYTHM_MIN, Math.min(every + MAX_SHIFT, Math.max(every - MAX_SHIFT, days)));
  const shift = dueDays - every;
  return { daysUntilNext: dueDays - since, dueDays, shift, cause: shift ? causeOf(drying!, ref, dueDays, shift) : null };
}

function causeOf(drying: Drying, ref: Date, days: number, shift: number): WeatherCause {
  const window = Array.from({ length: days }, (_, i) => drying[dayKey(addDays(ref, i + 1))]).filter(
    (x) => x !== undefined,
  );
  const temp = window.flatMap((x) => (x.tempDelta === null ? [] : [x.tempDelta]));
  const hum = window.flatMap((x) => (x.humidityDelta === null ? [] : [x.humidityDelta]));
  const tempDelta = temp.length ? mean(temp) : 0;
  const humDelta = hum.length ? mean(hum) : 0;
  if (shift < 0) return tempDelta >= HOT_DELTA ? 'hot' : humDelta <= DRY_DELTA ? 'dry' : 'sunny';
  return tempDelta <= -HOT_DELTA ? 'cool' : 'humid';
}

export type LearnedRhythm = {
  /** Rythme estimé (jours), null tant qu'il manque des arrosages. */
  estimate: number | null;
  /** Intervalles exploitables. */
  usable: number;
  /** Intervalles assez réguliers pour proposer le rythme. */
  stable: boolean;
};

/**
 * Rythme réel d'une plante d'après ses arrosages : intervalles entre deux jours d'arrosage,
 * ramenés aux conditions météo normales, moyenne qui privilégie les plus récents.
 * Les intervalles aberrants (> 2× l'attendu : absence, vacances) sont ignorés.
 */
export function learnRhythm(
  events: WateringEvent[],
  current: number,
  drying?: Drying | null,
): LearnedRhythm {
  // Un arrosage par jour au plus, du plus ancien au plus récent.
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  const days: WateringEvent[] = [];
  for (const e of sorted) {
    const last = days[days.length - 1];
    if (!last || daysBetween(last.at, e.at) > 0) days.push(e);
  }
  const intervals: number[] = [];
  for (let i = 1; i < days.length; i += 1) {
    const from = days[i - 1]!.at;
    const actual = daysBetween(from, days[i]!.at);
    const expected = days[i]!.expectedDays ?? current;
    if (actual <= 0 || actual > OUTLIER_RATIO * expected) continue;
    // Une période plus « séchante » que la normale aurait duré plus longtemps en temps normal.
    const factors = Array.from({ length: actual }, (_, k) => factorOn(drying, addDays(from, k + 1)));
    intervals.push(actual * mean(factors));
  }
  if (intervals.length < MIN_INTERVALS) return { estimate: null, usable: intervals.length, stable: false };
  let ewma = intervals[0]!;
  for (const v of intervals.slice(1)) ewma = ALPHA * v + (1 - ALPHA) * ewma;
  const avg = mean(intervals);
  const spread = Math.sqrt(mean(intervals.map((v) => (v - avg) ** 2))) / avg;
  return {
    estimate: clamp(Math.round(ewma), [RHYTHM_MIN, RHYTHM_MAX]),
    usable: intervals.length,
    stable: spread <= MAX_SPREAD,
  };
}

/**
 * Rythme à proposer (jamais imposé) : stable, différent d'au moins un jour du rythme actuel,
 * et pas juste après un refus (AFTER_DECLINE nouveaux intervalles d'abord).
 */
export function rhythmSuggestion(
  learned: LearnedRhythm,
  current: number,
  declined: { days: number; count: number } | null,
): number | null {
  if (learned.estimate === null || !learned.stable) return null;
  if (Math.abs(learned.estimate - current) < 1) return null;
  if (declined && learned.usable < declined.count + AFTER_DECLINE) return null;
  return learned.estimate;
}
