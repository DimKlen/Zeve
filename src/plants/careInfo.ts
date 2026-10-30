// Infos d'entretien et libellés par type de plante (source : prototype Claude Design, buildInfo()).
import type { PlantForm } from './plantForms.generated';

export type Light = 'ombre' | 'indirect' | 'soleil';
export type Category =
  'feuillage' | 'succulentes' | 'aromatiques' | 'fleurs' | 'arbres' | 'retombantes';
export type FormInfo = {
  label: string;
  cat: Category;
  light: Light;
  lightLabel: string;
  air: string;
  every: number;
  tip: string;
};

export const FORM_INFO: Record<PlantForm, FormInfo> = {
  monstera: {
    label: 'Feuilles découpées',
    cat: 'feuillage',
    light: 'indirect',
    lightLabel: 'Vive, indirecte',
    air: 'Humide',
    every: 8,
    tip: 'Arrose quand les 3 premiers cm de terre sont secs. Essuie ses grandes feuilles de temps en temps.',
  },
  herb: {
    label: 'Aromatiques',
    cat: 'aromatiques',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Normal',
    every: 2,
    tip: 'Garde la terre légèrement humide et pince les tiges pour qu’elle reste touffue.',
  },
  lavender: {
    label: 'Lavande & romarin',
    cat: 'aromatiques',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Sec',
    every: 10,
    tip: 'Peu d’eau, beaucoup de soleil. Taille légèrement après la floraison.',
  },
  pilea: {
    label: 'Feuilles rondes',
    cat: 'feuillage',
    light: 'indirect',
    lightLabel: 'Lumineux',
    air: 'Normal',
    every: 6,
    tip: 'Tourne le pot d’un quart de tour chaque semaine pour qu’elle pousse droite.',
  },
  calathea: {
    label: 'Calathéas & marantas',
    cat: 'feuillage',
    light: 'ombre',
    lightLabel: 'Mi-ombre',
    air: 'Très humide',
    every: 5,
    tip: 'Préfère une eau peu calcaire. Ses feuilles se replient le soir, c’est normal.',
  },
  olive: {
    label: 'Petits arbres',
    cat: 'arbres',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Sec',
    every: 7,
    tip: 'Supporte bien la sécheresse. À rentrer s’il gèle.',
  },
  cactus: {
    label: 'Cactus colonnaires',
    cat: 'succulentes',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Sec',
    every: 14,
    tip: 'Très peu d’eau en hiver : une fois par mois suffit.',
  },
  echeveria: {
    label: 'Rosettes succulentes',
    cat: 'succulentes',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Sec',
    every: 12,
    tip: 'Arrose seulement quand la terre est sèche, sans mouiller le cœur de la rosette.',
  },
  aloe: {
    label: 'Aloès & agaves',
    cat: 'succulentes',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Sec',
    every: 14,
    tip: 'Laisse bien sécher la terre entre deux arrosages.',
  },
  sansevieria: {
    label: 'Sansevierias',
    cat: 'feuillage',
    light: 'ombre',
    lightLabel: 'Peu exigeante',
    air: 'Sec',
    every: 18,
    tip: 'Supporte l’oubli : un arrosage toutes les 2 à 3 semaines suffit.',
  },
  pothos: {
    label: 'Lianes retombantes',
    cat: 'retombantes',
    light: 'ombre',
    lightLabel: 'Mi-ombre',
    air: 'Normal',
    every: 7,
    tip: 'Laisse sécher la surface entre deux arrosages. Ses tiges se bouturent dans l’eau.',
  },
  fern: {
    label: 'Fougères',
    cat: 'retombantes',
    light: 'ombre',
    lightLabel: 'Mi-ombre',
    air: 'Très humide',
    every: 3,
    tip: 'Terre toujours fraîche et air humide : brumise ses frondes.',
  },
  palm: {
    label: 'Palmiers',
    cat: 'arbres',
    light: 'indirect',
    lightLabel: 'Lumineux',
    air: 'Humide',
    every: 7,
    tip: 'Arrose quand le dessus de la terre est sec. Pas de soleil direct.',
  },
  ficus: {
    label: 'Ficus à grandes feuilles',
    cat: 'feuillage',
    light: 'indirect',
    lightLabel: 'Vive, indirecte',
    air: 'Normal',
    every: 9,
    tip: 'Essuie ses feuilles pour qu’elles restent brillantes. Évite les courants d’air.',
  },
  orchid: {
    label: 'Orchidées',
    cat: 'fleurs',
    light: 'indirect',
    lightLabel: 'Lumineux',
    air: 'Humide',
    every: 9,
    tip: 'Trempe le pot 10 minutes quand les racines deviennent argentées.',
  },
  lily: {
    label: 'Fleurs-spathes',
    cat: 'fleurs',
    light: 'ombre',
    lightLabel: 'Mi-ombre',
    air: 'Humide',
    every: 5,
    tip: 'Ses feuilles s’affaissent quand elle a soif ; elle se redresse vite après arrosage.',
  },
  zz: {
    label: 'Tiges charnues',
    cat: 'feuillage',
    light: 'ombre',
    lightLabel: 'Peu exigeante',
    air: 'Sec',
    every: 16,
    tip: 'Elle stocke l’eau dans ses tiges : arrose seulement quand la terre est sèche.',
  },
  geranium: {
    label: 'Fleurs de balcon',
    cat: 'fleurs',
    light: 'soleil',
    lightLabel: 'Plein soleil',
    air: 'Normal',
    every: 4,
    tip: 'Retire les fleurs fanées pour qu’elle refleurisse.',
  },
  spider: {
    label: 'Plantes araignées',
    cat: 'retombantes',
    light: 'indirect',
    lightLabel: 'Lumineux',
    air: 'Normal',
    every: 6,
    tip: 'Ses bébés se replantent facilement dans un petit pot.',
  },
};

export const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'feuillage', label: 'Feuillage' },
  { id: 'succulentes', label: 'Cactus & succulentes' },
  { id: 'aromatiques', label: 'Aromatiques' },
  { id: 'fleurs', label: 'Fleuries' },
  { id: 'arbres', label: 'Arbres & palmiers' },
  { id: 'retombantes', label: 'Retombantes' },
];

// Conseil affiché sous « Lumière à cet endroit » quand l'exposition choisie ne convient pas à l'espèce.
// Clé = `${lumière préférée}>${lumière choisie}`.
export const LIGHT_TIPS: Record<string, string> = {
  'ombre>soleil': 'Le soleil direct risque de brûler ses feuilles.',
  'indirect>soleil': 'Le soleil direct peut brûler ses feuilles. Un voilage aide.',
  'indirect>ombre': 'Un peu sombre pour elle : sa croissance va ralentir.',
  'soleil>ombre': 'Trop sombre : elle a besoin de soleil pour bien pousser.',
  'soleil>indirect': 'Elle sera plus belle avec un peu de soleil direct.',
};
