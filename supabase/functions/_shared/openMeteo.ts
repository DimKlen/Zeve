// Open-Meteo (gratuit, sans clé) : URL des requêtes et lecture des réponses.
// Module pur : partagé par l'Edge Function garden-weather et testé par Jest.

export const DAILY_VARIABLES = [
  'temperature_2m_mean',
  'relative_humidity_2m_mean',
  'sunshine_duration',
  'et0_fao_evapotranspiration',
  'precipitation_sum',
] as const;

/** 30 jours passés (normale du lieu, apprentissage) + 7 jours de prévisions. */
export const PAST_DAYS = 30;
export const FORECAST_DAYS = 7;

export function forecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    daily: DAILY_VARIABLES.join(','),
    past_days: String(PAST_DAYS),
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function geocodeUrl(city: string, countryCode: string | null): string {
  const params = new URLSearchParams({ name: city, count: '1', language: 'fr', format: 'json' });
  if (countryCode) params.set('countryCode', countryCode);
  return `https://geocoding-api.open-meteo.com/v1/search?${params}`;
}

export type WeatherRowInput = {
  garden_id: string;
  day: string;
  temp_mean: number | null;
  humidity_mean: number | null;
  sunshine_hours: number | null;
  et0_mm: number | null;
  precipitation_mm: number | null;
};

type DailyBlock = { time?: unknown } & Partial<Record<(typeof DAILY_VARIABLES)[number], unknown>>;

const num = (values: unknown, i: number): number | null => {
  const v = Array.isArray(values) ? values[i] : null;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

/** Réponse « daily » → une ligne par jour pour le cache garden_weather. */
export function parseDaily(body: unknown, gardenId: string): WeatherRowInput[] {
  const daily = (body as { daily?: DailyBlock } | null)?.daily;
  if (!daily || !Array.isArray(daily.time)) return [];
  return daily.time.flatMap((day, i) => {
    if (typeof day !== 'string') return [];
    const sunshine = num(daily.sunshine_duration, i);
    return [
      {
        garden_id: gardenId,
        day,
        temp_mean: num(daily.temperature_2m_mean, i),
        humidity_mean: num(daily.relative_humidity_2m_mean, i),
        sunshine_hours: sunshine === null ? null : Math.round((sunshine / 3600) * 10) / 10,
        et0_mm: num(daily.et0_fao_evapotranspiration, i),
        precipitation_mm: num(daily.precipitation_sum, i),
      },
    ];
  });
}

/** Premier résultat du géocodage, ou null. */
export function parseGeocode(body: unknown): { latitude: number; longitude: number } | null {
  const first = (body as { results?: { latitude?: unknown; longitude?: unknown }[] } | null)
    ?.results?.[0];
  if (!first || typeof first.latitude !== 'number' || typeof first.longitude !== 'number') return null;
  return { latitude: first.latitude, longitude: first.longitude };
}

/** Météo neutre (aucun effet) pour le local, la CI et les E2E (WEATHER_MOCK=1). */
export function mockDaily(gardenId: string, today: Date): WeatherRowInput[] {
  const rows: WeatherRowInput[] = [];
  for (let n = -PAST_DAYS; n < FORECAST_DAYS; n += 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + n);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rows.push({
      garden_id: gardenId,
      day,
      temp_mean: 18,
      humidity_mean: 60,
      sunshine_hours: 5,
      et0_mm: 3,
      precipitation_mm: 0,
    });
  }
  return rows;
}
