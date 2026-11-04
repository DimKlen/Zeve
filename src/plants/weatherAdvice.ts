// Conseils d'après la météo réelle du jardin (docs/06 F17) : la météo du moment et les minimales
// annoncées, comparées aux besoins de l'espèce (climateOf). Au plus 2 conseils ; chacun remplace
// le conseil de saison du même sujet sur la carte Saison.
import type { Climate, Season } from './seasons';

export type WeatherNow = { temp: number; humidity: number | null };

export const WEATHER_ADVICE_KEYS = [
  'bringInside',
  'awayFromWindow',
  'shadeHeat',
  'dryAir',
  'humidSucculent',
] as const;
export type WeatherAdviceKey = (typeof WEATHER_ADVICE_KEYS)[number];

/** Conseil de saison remplacé (même ligne de la carte Saison). */
export type AdviceTopic = 'place' | 'light' | 'humidity' | 'water';

export type WeatherAdvice = { key: WeatherAdviceKey; replaces: AdviceTopic };

const MAX_ADVICE = 2;
/** Gel ou presque annoncé dans les prochains jours. */
const FROST = 2;
/** Marge au-dessus du minimum de l'espèce : près d'une vitre, il fait bien plus froid que dans la pièce. */
const WINDOW_MARGIN = 6;
/** Au-dessus, les vitres ne refroidissent pas assez pour s'en soucier. */
const COLD_OUTSIDE = 10;
/** En dessous, le chauffage tourne et assèche l'air. */
const HEATING_BELOW = 15;
const HUMID_SPECIES = 50;
const VERY_HUMID = 85;

/**
 * Conseils du jour pour une espèce, du plus urgent au moins urgent.
 * `forecastMin` : minimale des prochains jours (null si inconnue).
 */
export function weatherAdvice(
  climate: Climate,
  now: WeatherNow | null,
  forecastMin: number | null,
  season: Season,
): WeatherAdvice[] {
  if (!now) return [];
  const out: WeatherAdvice[] = [];
  const add = (key: WeatherAdviceKey, replaces: AdviceTopic) => {
    if (out.length < MAX_ADVICE && !out.some((a) => a.replaces === replaces)) {
      out.push({ key, replaces });
    }
  };
  const coldest = Math.min(now.temp, forecastMin ?? now.temp);

  // Une plante qui sort l'été doit rentrer avant le gel (en hiver, elle est déjà dedans).
  if (climate.outdoors === 'summer' && season !== 'winter' && coldest <= FROST) {
    add('bringInside', 'place');
  }
  // Plante d'intérieur (rustiques exceptées) : les vitres froides la nuit.
  const cold = Math.min(climate.min + WINDOW_MARGIN, COLD_OUTSIDE);
  if (climate.outdoors !== 'year' && coldest <= cold) {
    add('awayFromWindow', 'place');
  }
  if (now.temp > climate.ideal[1]) add('shadeHeat', 'light');
  const heating = now.temp < HEATING_BELOW || season === 'winter';
  if (heating && climate.outdoors !== 'year' && climate.humidity[0] >= HUMID_SPECIES) {
    add('dryAir', 'humidity');
  }
  if (climate.group === 'succulent' && (now.humidity ?? 0) >= VERY_HUMID) {
    add('humidSucculent', 'water');
  }
  return out;
}
