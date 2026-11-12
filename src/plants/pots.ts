// Les 20 pots de la collection (couleur, forme, motif). Le pot 0 est le pot d'origine de la mascotte.
// Géométrie dans le repère 100×110 de PlantAvatar : le visage occupe x 37–63, y 78–92.

export type PotShape = 'classic' | 'round' | 'tall' | 'wide' | 'cylinder';
export type PotPattern = 'plain' | 'stripes' | 'dots' | 'zigzag' | 'waves' | 'checks' | 'bands';

export type Pot = {
  shape: PotShape;
  body: string;
  rim: string;
  pattern: PotPattern;
  ink: string;
};

export const POT_COUNT = 20;

export const POTS: readonly Pot[] = [
  { shape: 'classic', body: '#D6A132', rim: '#E8B931', pattern: 'plain', ink: '#D6A132' },
  { shape: 'classic', body: '#D98B5F', rim: '#E6A27A', pattern: 'stripes', ink: '#F6D9C4' },
  { shape: 'round', body: '#9ED6B8', rim: '#7DBF9D', pattern: 'dots', ink: '#F4FBF7' },
  { shape: 'tall', body: '#F0A6A0', rim: '#E58B85', pattern: 'zigzag', ink: '#FFF1EF' },
  { shape: 'wide', body: '#8DB9E0', rim: '#6FA3D1', pattern: 'waves', ink: '#EAF4FC' },
  { shape: 'cylinder', body: '#EBDDBA', rim: '#DCC899', pattern: 'bands', ink: '#C9714F' },
  { shape: 'classic', body: '#B7A6E0', rim: '#9E8AD0', pattern: 'checks', ink: '#E9E2F8' },
  { shape: 'round', body: '#F08A6B', rim: '#E0714F', pattern: 'plain', ink: '#F08A6B' },
  { shape: 'tall', body: '#5FB3A8', rim: '#479A8F', pattern: 'stripes', ink: '#D7F0EC' },
  { shape: 'wide', body: '#F5C09A', rim: '#EBA776', pattern: 'dots', ink: '#FFF4EA' },
  { shape: 'cylinder', body: '#C9B5E8', rim: '#B39BDA', pattern: 'zigzag', ink: '#F3EDFB' },
  { shape: 'classic', body: '#F2D75C', rim: '#E5C53D', pattern: 'waves', ink: '#FFF6C9' },
  { shape: 'round', body: '#E7A0B8', rim: '#D885A1', pattern: 'checks', ink: '#FBE6EE' },
  { shape: 'tall', body: '#D9C4A0', rim: '#C6AE86', pattern: 'dots', ink: '#8A6A48' },
  { shape: 'wide', body: '#A9BCD0', rim: '#8EA5BE', pattern: 'bands', ink: '#E6EDF4' },
  { shape: 'cylinder', body: '#B5C26B', rim: '#9FAE52', pattern: 'stripes', ink: '#EEF3CF' },
  { shape: 'classic', body: '#F2B26B', rim: '#E69B48', pattern: 'zigzag', ink: '#FFF0DC' },
  { shape: 'round', body: '#B8D8EC', rim: '#9CC6E0', pattern: 'waves', ink: '#F1F8FC' },
  { shape: 'tall', body: '#C9714F', rim: '#B25A39', pattern: 'checks', ink: '#F0C8B6' },
  { shape: 'wide', body: '#7FC4A0', rim: '#63AE87', pattern: 'plain', ink: '#7FC4A0' },
];

type Geometry = { rim: { x: number; y: number; w: number; h: number }; body: string };

export const POT_GEOMETRY: Record<PotShape, Geometry> = {
  classic: { rim: { x: 23, y: 62, w: 54, h: 10 }, body: 'M27 72H73L66 106H34Z' },
  round: {
    rim: { x: 26, y: 62, w: 48, h: 9 },
    body: 'M28 71H72C80 84 74 104 62 106H38C26 104 20 84 28 71Z',
  },
  tall: { rim: { x: 27, y: 60, w: 46, h: 9 }, body: 'M30 69H70L65 106H35Z' },
  wide: {
    rim: { x: 20, y: 64, w: 60, h: 8 },
    body: 'M23 72H77L71 100Q70 106 64 106H36Q30 106 29 100Z',
  },
  cylinder: {
    rim: { x: 24, y: 62, w: 52, h: 9 },
    body: 'M26 71H74V104Q74 106 72 106H28Q26 106 26 104Z',
  },
};

/** Numéro de pot valide (0–19) ; tout le reste retombe sur le pot d'origine. */
export const normalizePot = (pot: number | null | undefined): number =>
  Number.isInteger(pot) && (pot as number) >= 0 && (pot as number) < POT_COUNT
    ? (pot as number)
    : 0;

/** Un pot au hasard, différent de `current` si fourni (le bouton « Au hasard » change toujours). */
export function randomPot(current?: number, random: () => number = Math.random): number {
  const pick = Math.floor(random() * (current === undefined ? POT_COUNT : POT_COUNT - 1));
  return current !== undefined && pick >= current ? pick + 1 : pick;
}

/** Éléments du motif (hors visage) : tracés dans le corps du pot, découpés par un clipPath. */
export type PotMark =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'circle'; x: number; y: number; r: number }
  | { kind: 'path'; d: string };

export function potMarks(pattern: PotPattern): PotMark[] {
  switch (pattern) {
    case 'stripes':
      return [74, 80, 96, 101].map((y) => ({ kind: 'rect', x: 15, y, w: 70, h: 2.6 }));
    case 'bands':
      return [
        { kind: 'rect', x: 15, y: 73, w: 70, h: 4 },
        { kind: 'rect', x: 15, y: 98, w: 70, h: 4 },
      ];
    case 'dots':
      return [
        [31, 78],
        [69, 78],
        [28, 90],
        [72, 90],
        [33, 101],
        [50, 99],
        [67, 101],
        [50, 75],
      ].map(([x, y]) => ({ kind: 'circle', x: x!, y: y!, r: 2.2 }));
    case 'zigzag':
      return [
        { kind: 'path', d: 'M20 76l6 4 6-4 6 4 6-4 6 4 6-4 6 4 6-4 6 4 6-4' },
        { kind: 'path', d: 'M20 99l6 4 6-4 6 4 6-4 6 4 6-4 6 4 6-4 6 4 6-4' },
      ];
    case 'waves':
      return [
        { kind: 'path', d: 'M18 77q4-4 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0' },
        { kind: 'path', d: 'M18 99q4-4 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0' },
      ];
    case 'checks':
      return [
        [30, 76],
        [44, 76],
        [58, 76],
        [72, 76],
        [37, 99],
        [51, 99],
        [65, 99],
        [30, 99],
      ].map(([x, y]) => ({ kind: 'path', d: `M${x} ${y! - 3}l3 3-3 3-3-3z` }));
    case 'plain':
      return [];
  }
}

export const isStroked = (pattern: PotPattern) => pattern === 'zigzag' || pattern === 'waves';
