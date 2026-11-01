// Saisons et climat idéal des plantes (ajout hors design : carte « Saison » de la fiche).
// Saisons météorologiques de l'hémisphère nord (France) : déc–fév, mars–mai, juin–août, sept–nov.
import { FORM_INFO, type Light } from './careInfo';
import type { PlantForm } from './plantForms.generated';
import { SPECIES_BY_ID } from './species';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

const BY_MONTH: Season[] = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
];

export const seasonOf = (date: Date): Season => BY_MONTH[date.getMonth()]!;

/** tropical : intérieur chaud · succulent : repos hivernal au sec · mediterranean : aime l'extérieur. */
type Group = 'tropical' | 'succulent' | 'mediterranean';
/** Où elle peut vivre : jamais dehors, dehors l'été, dehors toute l'année (rustique). */
type Outdoors = 'never' | 'summer' | 'year';

export type Climate = {
  group: Group;
  /** Humidité de l'air idéale, en %. */
  humidity: [number, number];
  /** Température idéale de la pièce, en °C. */
  ideal: [number, number];
  /** Température minimale supportée, en °C. */
  min: number;
  outdoors: Outdoors;
};

const tropical = (
  humidity: [number, number],
  min: number,
  ideal: [number, number] = [18, 27],
): Climate => ({
  group: 'tropical',
  humidity,
  ideal,
  min,
  outdoors: 'never',
});

const FORM_CLIMATE: Record<PlantForm, Climate> = {
  monstera: { ...tropical([50, 70], 15), outdoors: 'summer' },
  herb: { group: 'mediterranean', humidity: [40, 60], ideal: [15, 25], min: 5, outdoors: 'summer' },
  lavender: {
    group: 'mediterranean',
    humidity: [30, 50],
    ideal: [15, 30],
    min: -10,
    outdoors: 'year',
  },
  pilea: { ...tropical([40, 60], 12, [16, 24]), outdoors: 'summer' },
  calathea: tropical([60, 80], 16, [18, 26]),
  olive: { group: 'mediterranean', humidity: [30, 50], ideal: [15, 28], min: -5, outdoors: 'year' },
  cactus: { group: 'succulent', humidity: [20, 40], ideal: [18, 30], min: 5, outdoors: 'summer' },
  echeveria: {
    group: 'succulent',
    humidity: [20, 40],
    ideal: [18, 28],
    min: 5,
    outdoors: 'summer',
  },
  aloe: { group: 'succulent', humidity: [20, 40], ideal: [18, 28], min: 8, outdoors: 'summer' },
  sansevieria: {
    group: 'succulent',
    humidity: [30, 50],
    ideal: [18, 27],
    min: 12,
    outdoors: 'never',
  },
  pothos: tropical([40, 60], 15),
  fern: tropical([60, 80], 12, [16, 24]),
  palm: { ...tropical([40, 60], 10), outdoors: 'summer' },
  ficus: tropical([40, 60], 15),
  orchid: tropical([50, 70], 16, [18, 26]),
  lily: tropical([50, 70], 15),
  zz: { group: 'succulent', humidity: [30, 50], ideal: [18, 27], min: 10, outdoors: 'never' },
  geranium: {
    group: 'mediterranean',
    humidity: [40, 60],
    ideal: [15, 25],
    min: 5,
    outdoors: 'summer',
  },
  spider: { ...tropical([40, 60], 10, [16, 25]), outdoors: 'summer' },
};

const HARDY: Partial<Climate> = { outdoors: 'year' };
const INDOOR_WARM: Partial<Climate> = {
  group: 'tropical',
  outdoors: 'never',
  min: 15,
  ideal: [18, 26],
};

/** Espèces dont le type de dessin induirait en erreur (un ficus dessiné en « petit arbre »…). */
export const SPECIES_CLIMATE: Record<string, Partial<Climate>> = {
  // Petits arbres d'intérieur, frileux.
  benjamina: { ...INDOOR_WARM, humidity: [40, 60] },
  'ficus-ginseng': { ...INDOOR_WARM, humidity: [40, 60] },
  pachira: { ...INDOOR_WARM, humidity: [40, 60] },
  polyscias: { ...INDOOR_WARM, humidity: [50, 70] },
  // Agrumes et myrte : dehors l'été, hors gel l'hiver.
  citronnier: { outdoors: 'summer', min: 3 },
  oranger: { outdoors: 'summer', min: 3 },
  calamondin: { outdoors: 'summer', min: 3 },
  myrte: { outdoors: 'summer', min: -5 },
  // Rustiques : passent l'hiver dehors.
  figuier: { ...HARDY, min: -12 },
  laurier: { ...HARDY, min: -10 },
  grenadier: { ...HARDY, min: -10 },
  eucalyptus: { ...HARDY, min: -10 },
  rosier: { ...HARDY, min: -15 },
  hortensia: { ...HARDY, min: -15 },
  lierre: { ...HARDY, min: -15 },
  ophiopogon: { ...HARDY, min: -15 },
  joubarbe: { ...HARDY, min: -20 },
  'joubarbe-toile': { ...HARDY, min: -20 },
  trachycarpus: { ...HARDY, min: -12 },
  chamaerops: { ...HARDY, min: -10 },
  // Fleurs d'intérieur, frileuses.
  saintpaulia: { ...INDOOR_WARM, humidity: [50, 70] },
  streptocarpus: { ...INDOOR_WARM, humidity: [50, 70] },
  gardenia: { ...INDOOR_WARM, humidity: [50, 70] },
  // Fleurs d'intérieur qui aiment la fraîcheur.
  cyclamen: { outdoors: 'never', ideal: [10, 18], min: 5 },
  azalee: { outdoors: 'summer', ideal: [10, 18], min: 5, humidity: [50, 70] },
  // Orchidée qui fleurit mieux après un été dehors.
  cymbidium: { outdoors: 'summer', min: 8, ideal: [10, 24] },
};

export function climateOf(speciesId: string): Climate {
  const form = SPECIES_BY_ID[speciesId]?.form ?? 'monstera';
  return { ...FORM_CLIMATE[form], ...SPECIES_CLIMATE[speciesId] };
}

/** Clés i18n `season.*` des conseils de la saison pour une espèce. */
export type SeasonalAdvice = {
  water: string;
  light: string;
  place: string;
  feed: string;
  /** Rappel d'humidité quand la saison assèche l'air (chauffage, canicule). */
  humidity: string | null;
};

const LIGHT_SUMMER: Record<Light, string> = {
  ombre: 'lightSummerShade',
  indirect: 'lightSummerShade',
  soleil: 'lightSummerSun',
};

const PLACE: Record<Outdoors, Record<Season, string>> = {
  never: {
    winter: 'placeHeating',
    spring: 'placeRepot',
    summer: 'placeIndoorSummer',
    autumn: 'placeIndoorAutumn',
  },
  summer: {
    winter: 'placeFrostFree',
    spring: 'placeOutAfterFrost',
    summer: 'placeOutSummer',
    autumn: 'placeBackInside',
  },
  year: {
    winter: 'placeHardyWinter',
    spring: 'placeRepot',
    summer: 'placeHardySummer',
    autumn: 'placeHardyAutumn',
  },
};

export function seasonalAdvice(speciesId: string, season: Season): SeasonalAdvice {
  const climate = climateOf(speciesId);
  const form = SPECIES_BY_ID[speciesId]?.form ?? 'monstera';
  const succulent = climate.group === 'succulent';
  const water = {
    winter: succulent ? 'waterRest' : 'waterLess',
    spring: 'waterResume',
    summer: succulent ? 'waterSucculentSummer' : 'waterMore',
    autumn: 'waterReduce',
  }[season];
  const light = {
    winter: 'lightWinter',
    spring: 'lightSpring',
    summer: LIGHT_SUMMER[FORM_INFO[form].light],
    autumn: 'lightAutumn',
  }[season];
  const feed = {
    winter: 'feedRest',
    spring: succulent ? 'feedSucculent' : 'feedGrowth',
    summer: succulent ? 'feedSucculent' : 'feedGrowth',
    autumn: 'feedStop',
  }[season];
  const humid = climate.humidity[0] >= 50;
  const humidity =
    season === 'winter' && humid && climate.outdoors !== 'year'
      ? 'humidityHeating'
      : season === 'summer' && climate.humidity[0] >= 60
        ? 'humidityHeat'
        : null;
  return { water, light, place: PLACE[climate.outdoors][season], feed, humidity };
}
