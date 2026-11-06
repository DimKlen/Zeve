// Dessins des arbres et arbustes (espèces de pleine terre) : un arbre planté dans la terre, pas
// une plante en pot. Même repère que les plantes (100×110, base du tronc en 50,64) et mêmes
// 3 stades : Pousse (jeune plant), Jeune (petit arbre), Adulte (houppier complet).
// Adulte : fruits pour les arbres fruitiers, feuillage plus dense et nuancé pour les autres.
import type { PlantShape } from './plantForms.generated';

/** Arbres et arbustes qui donnent des fruits (ou des noix, baies, graines) à l'âge adulte. */
export const FRUIT_TREES: ReadonlySet<string> = new Set([
  'pommier',
  'poirier',
  'cerisier',
  'prunier',
  'pecher',
  'abricotier',
  'cognassier',
  'plaqueminier',
  'murier',
  'groseillier',
  'cassissier',
  'framboisier',
  'myrtillier',
  'noyer',
  'chataignier',
  'noisetier',
  'sorbier',
  'aubepine',
  'sureau',
  'marronnier',
]);

const blob = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const leaf = 'M0 0C3.4 -3.4 3.4 -8.4 0 -11C-3.4 -8.4 -3.4 -3.4 0 0Z';

const trunk = (d: string, sw: number, s: 1 | 2 | 3): PlantShape => ({
  d,
  f: 'none',
  st: 'T',
  sw,
  s,
});
const crown = (cx: number, cy: number, r: number, f: 'A' | 'B', s: 1 | 2 | 3): PlantShape => ({
  d: blob(cx, cy, r),
  f,
  s,
});
const sprig = (x: number, y: number, rot: number, f: 'A' | 'B', s: 1 | 2 | 3): PlantShape => ({
  d: leaf,
  f,
  s,
  t: `translate(${x} ${y}) rotate(${rot})`,
});
const fruit = (cx: number, cy: number): PlantShape => ({
  d: blob(cx, cy, 2.8),
  f: 'F',
  st: 'D',
  sw: 0.6,
  s: 3,
});

const GROUND: PlantShape[] = [
  // Évasement du tronc au ras de la terre.
  trunk('M44 68C47 66 48 65 49 62M56 68C53 66 52 65 51 62', 2.4, 1),
];

const BASE: PlantShape[] = [
  ...GROUND,
  trunk('M50 66C50 60 49 54 50 46', 3.2, 1),
  trunk('M50 66C49 58 51 50 50 38', 4.4, 2),
  trunk('M50 50L41 42M50 46L60 38', 2.2, 2),
  trunk('M50 66C51 56 49 46 50 34', 5.6, 3),
  trunk('M50 48L37 38M50 44L64 34M50 38L44 28', 2.6, 3),
  // Houppier : arrière (B), puis avant (A), du plus petit stade au plus grand.
  crown(30, 32, 11, 'B', 3),
  crown(70, 32, 11, 'B', 3),
  crown(50, 17, 13, 'B', 3),
  crown(50, 29, 14, 'A', 3),
  crown(36, 24, 11, 'A', 3),
  crown(64, 24, 11, 'A', 3),
  crown(50, 34, 9, 'B', 2),
  crown(41, 38, 8, 'A', 2),
  crown(59, 36, 8, 'A', 2),
  crown(50, 28, 9, 'A', 2),
  crown(50, 38, 5, 'A', 1),
  sprig(50, 48, -40, 'A', 1),
  sprig(50, 48, 40, 'B', 1),
  sprig(50, 46, 0, 'A', 1),
  sprig(49, 52, -75, 'B', 1),
  sprig(51, 52, 75, 'A', 1),
];

/** Reflets de feuilles (arbres non fruitiers, adulte). */
const LEAVES_ADULT: PlantShape[] = [
  crown(42, 18, 4.5, 'B', 3),
  crown(58, 26, 4.5, 'B', 3),
  crown(34, 33, 4, 'B', 3),
  crown(66, 36, 4, 'B', 3),
  crown(50, 40, 3.6, 'B', 3),
  sprig(30, 24, -50, 'A', 3),
  sprig(72, 22, 50, 'A', 3),
  sprig(50, 8, 0, 'A', 3),
];

const FRUITS_ADULT: PlantShape[] = [
  fruit(40, 22),
  fruit(58, 18),
  fruit(66, 29),
  fruit(31, 33),
  fruit(48, 33),
  fruit(60, 40),
  fruit(72, 38),
  fruit(42, 42),
];

export const treeShapes = (speciesId: string): PlantShape[] => [
  ...BASE,
  ...(FRUIT_TREES.has(speciesId) ? FRUITS_ADULT : LEAVES_ADULT),
];
