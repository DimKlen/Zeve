// Sécurité d'une espèce (ajout hors design, guide d'entretien) : toxicité pour les animaux et les humains,
// et cohabitation avec d'autres plantes dans un même pot. Les valeurs renvoient aux textes `care.*`.
// Toxicité : d'après les listes de l'ASPCA (chats, chiens) et des centres antipoison, au plus prudent.
import { SPECIES_BY_ID } from './species';

/** safe : sans danger connu · mild : irritante ou troubles légers si mâchée · toxic : vraiment dangereuse. */
export type ToxicLevel = 'safe' | 'mild' | 'toxic' | 'unknown';
export type Toxicity = { pets: ToxicLevel; humans: ToxicLevel };

const LEVELS: ToxicLevel[] = ['safe', 'mild', 'toxic'];

/**
 * Deux chiffres par espèce : animaux (chats, chiens) puis humains. 0 sans danger, 1 léger, 2 dangereux.
 * Une plante comestible (fruit, aromate) peut être « 1 » pour l'humain si d'autres parties sont toxiques.
 */
// prettier-ignore
export const TOXICITY: Record<string, string> = {
  // Aracées (oxalate de calcium) : bouche brûlante, salive, vomissements.
  monstera: '11', adansonii: '11', selloum: '11', aglaonema: '11', pothos: '11', scandens: '11',
  spathiphyllum: '11', anthurium: '11', zamioculcas: '11', syngonium: '11', alocasia: '11',
  dieffenbachia: '22', xanadu: '11', 'monstera-mini': '11', 'philodendron-rouge': '11',
  'alocasia-zebrina': '11', colocasia: '11', caladium: '11', scindapsus: '11', arum: '11',
  'anthurium-clarinervium': '11',
  // Aromates.
  basilic: '00', menthe: '10', persil: '10', coriandre: '00', origan: '10', lavande: '10',
  romarin: '00', ciboulette: '20', thym: '00', sauge: '00', aneth: '00', estragon: '10',
  melisse: '10', verveine: '10', cerfeuil: '00', sarriette: '00', citronnelle: '10',
  'menthe-poivree': '10', marjolaine: '10', stevia: '00', 'lavande-papillon': '10', lavandin: '10',
  santoline: '11', immortelle: '00', laurier: '10',
  // Plantes vertes sans danger connu.
  pilea: '00', peperomia: '00', calathea: '00', makoyana: '00', maranta: '00', boston: '00',
  capillaire: '00', kentia: '00', areca: '00', chamaedorea: '00', phalaenopsis: '00', cymbidium: '00',
  saintpaulia: '00', chlorophytum: '00', hoya: '00', ceropegia: '00', bananier: '00',
  'peperomia-caperata': '00', 'peperomia-pasteque': '00', 'pilea-cadierei': '00', helxine: '00',
  'calathea-lancifolia': '00', 'calathea-zebrina': '00', 'calathea-ornata': '00',
  'calathea-medaillon': '00', 'calathea-rufibarba': '00', ctenanthe: '00', stromanthe: '00',
  fittonia: '00', hypoestes: '00', pachira: '00', myrte: '00', grenadier: '00',
  'peperomia-prostrata': '00', cissus: '00', jasmin: '00', 'hoya-kerrii': '00', dichondra: '00',
  plectranthus: '00', callisia: '00', 'cactus-noel': '00', rhipsalis: '00', asplenium: '00',
  platycerium: '00', davallia: '00', pteris: '00', 'fougere-bleue': '00', selaginelle: '00',
  cyrtomium: '00', phoenix: '00', livistona: '00', rhapis: '00', trachycarpus: '00',
  chamaerops: '00', 'pied-elephant': '00', dendrobium: '00', oncidium: '00', cattleya: '00',
  vanda: '00', 'sabot-venus': '00', miltonia: '00', ludisia: '00', guzmania: '00', vriesea: '00',
  aechmea: '00', portulacaria: '00', petunia: '00', impatiens: '00', gerbera: '00', fuchsia: '00',
  hibiscus: '00', pensee: '00', capucine: '00', streptocarpus: '00', fraisier: '00',
  ophiopogon: '00', papyrus: '00', aspidistra: '00', rosier: '00',
  // Plantes vertes un peu toxiques.
  olivier: '00', citronnier: '10', oranger: '10', calamondin: '10', benjamina: '11',
  caoutchouc: '11', lyrata: '11', schefflera: '11', avocatier: '10', jade: '10', geranium: '10',
  begonia: '11', 'begonia-rex': '11', 'begonia-maculata': '11', croton: '11', strelitzia: '10',
  'strelitzia-nicolai': '10', fatsia: '11', lierre: '11', tradescantia: '11',
  'tradescantia-fluminensis': '11', 'tradescantia-pallida': '11', rhoeo: '11', oxalis: '10',
  coleus: '10', figuier: '11', 'ficus-ginseng': '11', 'ficus-pumila': '11', 'ficus-audrey': '11',
  'ficus-altissima': '11', polyscias: '11', eucalyptus: '11', 'plante-chapelet': '11',
  passiflore: '11', mandevilla: '11', 'asperge-plumeuse': '11', 'asparagus-densiflorus': '11',
  cordyline: '10', yucca: '11', dragonnier: '10', 'bois-bresil': '10', 'bambou-chance': '10',
  cafeier: '11', clivia: '11', amaryllis: '11', jacinthe: '11', 'epine-christ': '11',
  hortensia: '11', cyclamen: '11', chrysantheme: '11', bougainvillier: '11', primevere: '11',
  dahlia: '10', 'oeillet-inde': '11', anthemis: '11', gardenia: '10', tomate: '11', piment: '11',
  // Cactus et succulentes.
  echinopsis: '00', cierge: '00', echeveria: '00', joubarbe: '00', grapto: '00', haworthia: '00',
  opuntia: '00', mammillaria: '00', 'coussin-belle-mere': '00', cleistocactus: '00',
  gymnocalycium: '00', astrophytum: '00', aeonium: '00', pachyphytum: '00', lithops: '00',
  'joubarbe-toile': '00', tillandsia: '00', 'aloe-aristata': '00', gasteria: '00',
  'haworthia-cooperi': '00', 'queue-ane': '00', aloe: '11', agave: '11', 'agave-attenuata': '11',
  sansevieria: '11', cylindrica: '11', 'sansevieria-masoniana': '11', 'sansevieria-zeylanica': '11',
  'euphorbe-trigona': '11', kalanchoe: '21', 'kalanchoe-tomentosa': '21',
  'crassula-perforata': '10', 'sedum-rubrotinctum': '11',
  // Vraiment dangereuses.
  cycas: '22', 'rose-desert': '22', azalee: '22', lantana: '21',
  // Arbres et arbustes.
  chene: '11', 'erable-champetre': '00', 'erable-japon': '00', 'erable-sycomore': '00',
  bouleau: '00', tilleul: '00', hetre: '11', charme: '00', frene: '00', 'saule-blanc': '10',
  'saule-pleureur': '10', peuplier: '00', platane: '00', marronnier: '22', chataignier: '00',
  noyer: '10', noisetier: '00', sureau: '11', aubepine: '00', sorbier: '11', robinier: '22',
  magnolia: '00', ginkgo: '11', lilas: '00', cornouiller: '11', houx: '12', buis: '22',
  'laurier-cerise': '22', troene: '11', forsythia: '00', 'arbre-papillons': '00', mimosa: '00',
  catalpa: '00', 'cerisier-japon': '11', pommier: '10', poirier: '10', cerisier: '10',
  prunier: '10', pecher: '10', abricotier: '10', cognassier: '00', plaqueminier: '10',
  murier: '00', groseillier: '00', cassissier: '00', framboisier: '00', myrtillier: '00',
  // Raisin : insuffisance rénale chez le chien.
  vigne: '20', kiwi: '00',
  // Herbes sauvages.
  ortie: '11', plantain: '00', 'plantain-lanceole': '00', paquerette: '00', mauve: '00',
  achillee: '10', consoude: '11', bourrache: '11', 'ail-ours': '20', oseille: '10',
  'trefle-blanc': '00', 'trefle-violet': '00', coquelicot: '11', bleuet: '00', camomille: '10',
  millepertuis: '11', violette: '00', coucou: '11', serpolet: '00', 'reine-des-pres': '10',
  souci: '00', 'fraisier-bois': '00', valeriane: '00', chicoree: '00', cresson: '00', mache: '00',
  'lierre-terrestre': '10', pissenlit: '00', chiendent: '00', liseron: '11', 'liseron-haies': '11',
  chardon: '00', rumex: '10', 'renoncule-rampante': '11', mouron: '00', chenopode: '00',
  amarante: '00', senecon: '22', laiteron: '00', prele: '10', 'fougere-aigle': '22', ronce: '00',
  'oxalis-corniculee': '10', digitaire: '00', paturin: '00', renouee: '00', 'renouee-japon': '00',
  ambroisie: '01', mercuriale: '11', 'euphorbe-reveil': '11', cardamine: '00', veronique: '00',
  'herbe-robert': '00', 'chardon-marie': '00', ficaire: '11',
};

export function toxicityOf(speciesId: string): Toxicity {
  const code = TOXICITY[speciesId];
  if (!code) return { pets: 'unknown', humans: 'unknown' };
  return { pets: LEVELS[Number(code[0])]!, humans: LEVELS[Number(code[1])]! };
}

/**
 * Avec qui partager un pot. alone : seule (racines envahissantes ou trop grandes) · harmful : nuit aux
 * voisines (substances dans le sol) · dry, mediterranean, herbs, moist, orchid : avec des plantes aux
 * mêmes besoins · shared : avec toute plante d'appartement aux besoins proches · ground, weed, none : à part.
 */
export type PotMate =
  | 'alone'
  | 'harmful'
  | 'dry'
  | 'mediterranean'
  | 'herbs'
  | 'moist'
  | 'orchid'
  | 'shared'
  | 'ground'
  | 'weed'
  | 'none';

/** Racines qui envahissent tout le pot. */
const INVASIVE = new Set(['menthe', 'menthe-poivree', 'melisse']);
/** Libèrent dans la terre des substances qui freinent les autres plantes (juglone, huiles). */
const HARMFUL = new Set(['noyer', 'eucalyptus']);
/** Aromates du Sud : terre sèche et plein soleil. */
const MEDITERRANEAN = new Set(['thym', 'sauge', 'origan', 'sarriette', 'marjolaine']);
const NO_SOIL = new Set(['tillandsia', 'platycerium']);

export function potMateOf(speciesId: string): PotMate {
  const species = SPECIES_BY_ID[speciesId];
  if (!species) return 'shared';
  if (species.weed) return 'weed';
  if (HARMFUL.has(speciesId)) return 'harmful';
  if (INVASIVE.has(speciesId)) return 'alone';
  if (species.hardy) return 'ground';
  if (NO_SOIL.has(speciesId)) return 'none';
  switch (species.form) {
    case 'cactus':
    case 'echeveria':
    case 'aloe':
    case 'sansevieria':
    case 'zz':
      return 'dry';
    case 'lavender':
      return 'mediterranean';
    case 'herb':
      return MEDITERRANEAN.has(speciesId) ? 'mediterranean' : 'herbs';
    case 'calathea':
    case 'fern':
      return 'moist';
    case 'orchid':
      return 'orchid';
    // Petits arbres en pot (agrumes, olivier, ficus…) : leurs racines prennent toute la place.
    case 'olive':
      return 'alone';
    default:
      return 'shared';
  }
}
