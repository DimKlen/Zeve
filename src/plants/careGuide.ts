// Guide d'entretien d'une espèce (ajout hors design) : terre, pot, engrais, rempotage.
// Même principe que les saisons : conseil par type de dessin, corrigé pour les espèces qu'il classerait mal.
// Les valeurs sont des clés de textes `care.*` (src/i18n/fr.json).
import type { PlantForm } from './plantForms.generated';
import { SPECIES_BY_ID } from './species';

export type CareGuide = { soil: string; pot: string; feed: string; repot: string };

const FORM_GUIDE: Record<PlantForm, CareGuide> = {
  monstera: { soil: 'soilAroid', pot: 'potDrained', feed: 'feedGreen', repot: 'repotGrowing' },
  herb: { soil: 'soilHerb', pot: 'potDrained', feed: 'feedLight', repot: 'repotHerb' },
  lavender: { soil: 'soilPoor', pot: 'potTerracotta', feed: 'feedNone', repot: 'repotSlow' },
  pilea: { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen', repot: 'repotGrowing' },
  calathea: { soil: 'soilMoist', pot: 'potPlastic', feed: 'feedHalf', repot: 'repotGrowing' },
  olive: { soil: 'soilPoor', pot: 'potTerracotta', feed: 'feedShrub', repot: 'repotSlow' },
  cactus: { soil: 'soilCactus', pot: 'potTerracotta', feed: 'feedCactus', repot: 'repotSlow' },
  echeveria: { soil: 'soilCactus', pot: 'potTerracotta', feed: 'feedCactus', repot: 'repotSlow' },
  aloe: { soil: 'soilCactus', pot: 'potTerracotta', feed: 'feedCactus', repot: 'repotSlow' },
  sansevieria: { soil: 'soilCactus', pot: 'potHeavy', feed: 'feedCactus', repot: 'repotSlow' },
  pothos: { soil: 'soilUniversal', pot: 'potHanging', feed: 'feedGreen', repot: 'repotGrowing' },
  fern: { soil: 'soilMoist', pot: 'potPlastic', feed: 'feedHalf', repot: 'repotGrowing' },
  palm: { soil: 'soilPalm', pot: 'potDeep', feed: 'feedGreen', repot: 'repotSlow' },
  ficus: { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen', repot: 'repotGrowing' },
  orchid: { soil: 'soilOrchid', pot: 'potOrchid', feed: 'feedOrchid', repot: 'repotOrchid' },
  lily: { soil: 'soilAroid', pot: 'potDrained', feed: 'feedFlower', repot: 'repotGrowing' },
  zz: { soil: 'soilCactus', pot: 'potHeavy', feed: 'feedCactus', repot: 'repotSlow' },
  geranium: { soil: 'soilFlower', pot: 'potDrained', feed: 'feedFlower', repot: 'repotHerb' },
  spider: { soil: 'soilUniversal', pot: 'potHanging', feed: 'feedGreen', repot: 'repotGrowing' },
};

const CITRUS: Partial<CareGuide> = { soil: 'soilCitrus', feed: 'feedCitrus' };
const BROMELIAD: Partial<CareGuide> = {
  soil: 'soilBromeliad',
  feed: 'feedOrchid',
  repot: 'repotRarely',
};

/** Espèces que leur type de dessin conseillerait mal. */
export const SPECIES_GUIDE: Record<string, Partial<CareGuide>> = {
  // Terre acide.
  azalee: { soil: 'soilAcid', feed: 'feedAcid' },
  gardenia: { soil: 'soilAcid', feed: 'feedAcid' },
  hortensia: { soil: 'soilAcid', feed: 'feedAcid' },
  // Agrumes.
  citronnier: CITRUS,
  oranger: CITRUS,
  calamondin: CITRUS,
  // Petits arbres d'intérieur : terreau de plantes vertes, pas une terre pauvre.
  benjamina: { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen' },
  'ficus-ginseng': { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen' },
  pachira: { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen' },
  polyscias: { soil: 'soilUniversal', pot: 'potDrained', feed: 'feedGreen' },
  // Bromélias : mélange léger, engrais dilué.
  guzmania: BROMELIAD,
  vriesea: BROMELIAD,
  aechmea: BROMELIAD,
  // Plantes sans terre ou presque.
  tillandsia: { soil: 'soilNone', pot: 'potNone', feed: 'feedOrchid', repot: 'repotNone' },
  platycerium: { soil: 'soilOrchid', pot: 'potMounted', repot: 'repotRarely' },
  // Orchidée terrestre.
  ludisia: { soil: 'soilMoist', pot: 'potPlastic' },
  // Bulbes : refleurissent après un repos.
  amaryllis: { repot: 'repotBulb' },
  jacinthe: { repot: 'repotBulb' },
  // Vivaces et arbustes rustiques, souvent en pleine terre.
  rosier: { soil: 'soilFlower', pot: 'potDeep', feed: 'feedFlower', repot: 'repotSlow' },
  lierre: { pot: 'potDrained' },
};

/** Pleine terre (arbres, fruitiers, herbes sauvages) ; une mauvaise herbe ne se nourrit pas. */
const GROUND: Partial<CareGuide> = { soil: 'soilGarden', pot: 'potGround', repot: 'repotGround' };
const WEED: Partial<CareGuide> = { feed: 'feedNone' };

export function careGuideOf(speciesId: string): CareGuide {
  const species = SPECIES_BY_ID[speciesId];
  const form = species?.form ?? 'monstera';
  return {
    ...FORM_GUIDE[form],
    ...(species?.hardy ? GROUND : {}),
    ...(species?.weed ? WEED : {}),
    ...SPECIES_GUIDE[speciesId],
  };
}
