// Règles des jardins (plusieurs lieux) : nom par défaut, hémisphère, résumé, dernière plante.
import type { GardenPlant } from '@/features/garden/gardenRules';
import { statusOf } from '@/features/garden/gardenRules';
import { t } from '@/i18n';
import { normalize } from '@/plants/plantStatus';

export type Garden = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
};

/**
 * Nom par défaut : « <Ville> <n> », n étant le premier numéro libre pour cette ville
 * (« Montréal 1 », « Montréal 2 »…). Sans ville : « Jardin <n> ».
 */
export function defaultGardenName(city: string | null | undefined, existing: string[]): string {
  const base = city?.trim() || t('gardens.defaultBase');
  const taken = new Set(existing.map(normalize));
  let n = 1;
  while (taken.has(normalize(`${base} ${n}`))) n += 1;
  return `${base} ${n}`;
}

/** Nom de pays comparable : sans accents ni casse, tirets et espaces confondus. */
const countryKey = (name: string) => normalize(name).replace(/[\s-]+/g, ' ');

// Pays (ou territoires) entièrement ou presque dans l'hémisphère sud, quand la latitude manque.
const SOUTHERN_CODES = new Set([
  'AR',
  'AU',
  'BO',
  'BR',
  'BW',
  'CL',
  'FJ',
  'LS',
  'MG',
  'MU',
  'MW',
  'MZ',
  'NA',
  'NC',
  'NZ',
  'PE',
  'PF',
  'PY',
  'RE',
  'SZ',
  'UY',
  'YT',
  'ZA',
  'ZM',
  'ZW',
]);
const SOUTHERN_NAMES = new Set(
  [
    'Argentine',
    'Australie',
    'Bolivie',
    'Brésil',
    'Botswana',
    'Chili',
    'Fidji',
    'Lesotho',
    'Madagascar',
    'Maurice',
    'Malawi',
    'Mozambique',
    'Namibie',
    'Nouvelle-Calédonie',
    'Nouvelle-Zélande',
    'Pérou',
    'Polynésie française',
    'Paraguay',
    'La Réunion',
    'Réunion',
    'Eswatini',
    'Uruguay',
    'Mayotte',
    'Afrique du Sud',
    'Zambie',
    'Zimbabwe',
  ].map(countryKey),
);

/** Hémisphère sud : par la latitude si connue, sinon par le pays. */
export function isSouthern(
  garden: Pick<Garden, 'latitude' | 'countryCode' | 'country'> | null | undefined,
): boolean {
  if (!garden) return false;
  if (garden.latitude !== null) return garden.latitude < 0;
  if (garden.countryCode) return SOUTHERN_CODES.has(garden.countryCode.toUpperCase());
  return garden.country ? SOUTHERN_NAMES.has(countryKey(garden.country)) : false;
}

/** « Montréal, Canada », « Montréal » ou rien. */
export function placeLabel(garden: Pick<Garden, 'city' | 'country'>): string {
  return [garden.city, garden.country].filter(Boolean).join(', ');
}

export type GardenSummary = {
  garden: Garden;
  plants: GardenPlant[];
  thirsty: number;
};

/** Jardins dans l'ordre de création, avec leurs plantes (les plus assoiffées d'abord). */
export function summarizeGardens(
  gardens: Garden[],
  plants: GardenPlant[],
  now = new Date(),
): GardenSummary[] {
  return [...gardens]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((garden) => {
      const own = plants.filter((p) => p.gardenId === garden.id);
      const withStatus = own.map((p) => ({ p, s: statusOf(p, now) }));
      withStatus.sort((a, b) => Number(b.s.thirsty) - Number(a.s.thirsty));
      return {
        garden,
        plants: withStatus.map((x) => x.p),
        thirsty: withStatus.filter((x) => x.s.thirsty).length,
      };
    });
}

/** Vrai si la plante est la seule (active) de son jardin : la retirer supprime le jardin. */
export const isLastInGarden = (plant: GardenPlant, plants: GardenPlant[]) =>
  !plants.some((p) => p.id !== plant.id && p.gardenId === plant.gardenId);
