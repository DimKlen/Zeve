// Lieu d'un jardin : recherche du pays (liste fixe) puis de la ville (géocodage Open-Meteo, gratuit,
// sans clé, comme garden-weather). Module pur, testé par Jest.
import { normalize } from '@/plants/plantStatus';

import { COUNTRIES, type Country } from './countries';

const MAX_COUNTRIES = 5;
export const MAX_CITIES = 5;

/** Noms usuels qui ne sont pas le nom officiel. */
const ALIASES: Record<string, string[]> = {
  US: ['usa', 'amerique', 'etats unis d amerique'],
  GB: ['uk', 'angleterre', 'grande bretagne', 'ecosse', 'pays de galles'],
  NL: ['hollande'],
  CZ: ['republique tcheque'],
  MM: ['myanmar'],
  CD: ['republique democratique du congo', 'rdc'],
  RE: ['reunion'],
};

/** Minuscules, sans accents ; apostrophes et tirets deviennent des espaces. */
const clean = (s: string) =>
  normalize(s)
    .replace(/[’'\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const INDEX = COUNTRIES.map((c) => ({
  country: c,
  names: [clean(c.name), ...(ALIASES[c.code] ?? [])],
}));

/** Pays dont un nom commence par la saisie, puis ceux qui la contiennent. */
export function searchCountries(query: string): Country[] {
  const q = clean(query);
  if (!q) return [];
  const starts: Country[] = [];
  const contains: Country[] = [];
  for (const { country, names } of INDEX) {
    if (names.some((n) => n.startsWith(q))) starts.push(country);
    else if (names.some((n) => n.includes(q))) contains.push(country);
  }
  return [...starts, ...contains].slice(0, MAX_COUNTRIES);
}

/** Pays tapé en entier (nom ou nom usuel), sinon null. */
export function countryByName(name: string): Country | null {
  const q = clean(name);
  return INDEX.find(({ names }) => names.includes(q))?.country ?? null;
}

export function cityUrl(query: string, countryCode: string | null): string {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '10',
    language: 'fr',
    format: 'json',
  });
  if (countryCode) params.set('countryCode', countryCode);
  return `https://geocoding-api.open-meteo.com/v1/search?${params}`;
}

export type City = {
  name: string;
  region: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
};

type RawCity = {
  name?: unknown;
  admin1?: unknown;
  country_code?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

/** Réponse du géocodage → villes distinctes (même nom et même région = doublon). */
export function parseCities(body: unknown): City[] {
  const results = (body as { results?: RawCity[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const seen = new Set<string>();
  const out: City[] = [];
  for (const r of results) {
    if (typeof r.name !== 'string' || typeof r.latitude !== 'number') continue;
    if (typeof r.longitude !== 'number') continue;
    const region = typeof r.admin1 === 'string' ? r.admin1 : null;
    const key = `${r.name}|${region ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: r.name,
      region,
      countryCode: typeof r.country_code === 'string' ? r.country_code.toUpperCase() : null,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    if (out.length === MAX_CITIES) break;
  }
  return out;
}

/** Villes qui correspondent à la saisie ; liste vide si le réseau ou le service manque. */
export async function searchCities(
  query: string,
  countryCode: string | null,
  signal?: AbortSignal,
): Promise<City[]> {
  if (query.trim().length < 2) return [];
  try {
    const response = await fetch(cityUrl(query, countryCode), { signal });
    if (!response.ok) return [];
    return parseCities(await response.json());
  } catch {
    return [];
  }
}
