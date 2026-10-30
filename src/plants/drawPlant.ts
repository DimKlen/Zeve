// Moteur de dessin des plantes — port exact de draw() du prototype Claude Design.
// Retourne les éléments SVG résolus (couleurs, taille) pour une espèce, une taille et un état de soif.
import { PLANT_FORMS, type ColorKey } from './plantForms.generated';
import { SPECIES_BY_ID } from './species';

export type Stage = 1 | 2 | 3; // 1 Pousse, 2 Jeune, 3 Adulte
export type ResolvedShape = {
  d: string;
  t?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
};
export type PlantDrawing = {
  shapes: ResolvedShape[];
  /** Transform SVG à appliquer au groupe feuillage (taille selon le stade, centrée sur la base 50,64). */
  scale: string;
  scaleFactor: number;
  /** Transform SVG du groupe feuillage quand la plante a soif ('' sinon). */
  tilt: string;
  /** Path de la bouche dessinée sur le pot. */
  mouth: string;
};

export const STAGE_SCALE: Record<Stage, number> = { 1: 0.62, 2: 0.82, 3: 1 };
export const STAGE_LABEL: Record<Stage, string> = { 1: 'Pousse', 2: 'Jeune', 3: 'Adulte' };

export const MOUTH_HAPPY = 'M44 91 Q50 96 56 91';
export const MOUTH_SAD = 'M44 94 Q50 89 56 94';
const DRY_TARGET = '#B5A85E';

/** Stade de croissance selon le nombre de jours depuis la création de la plante dans l'app. */
export function stageOf(daysSinceCreated: number): Stage {
  return daysSinceCreated < 90 ? 1 : daysSinceCreated < 365 ? 2 : 3;
}

/** Mélange linéaire de deux couleurs hex (#RRGGBB). */
export function mix(hex: string, to: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex),
    b = p(to);
  return (
    '#' +
    a
      .map((v, i) =>
        Math.round(v + (b[i] - v) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

const cache = new Map<string, PlantDrawing>();

export function drawPlant(speciesId: string, stage: Stage, thirsty: boolean): PlantDrawing {
  const key = `${speciesId}|${stage}|${thirsty ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sp = SPECIES_BY_ID[speciesId] ?? SPECIES_BY_ID.monstera;
  const col: Record<string, string> = {
    A: thirsty ? mix(sp.a, DRY_TARGET, 0.5) : sp.a,
    B: thirsty ? mix(sp.b, DRY_TARGET, 0.5) : sp.b,
    F: sp.f,
    S: thirsty ? '#6E7A4A' : '#3F6B45',
    V: '#EAF0DE',
    D: '#2F5A3A',
    T: '#7A5A3A',
  };
  const c = (k?: ColorKey) => (!k ? 'none' : (col[k] ?? k));
  const shapes = PLANT_FORMS[sp.form]
    .filter((sh) => sh.s <= stage)
    .map((sh) => ({
      d: sh.d,
      t: sh.t,
      fill: c(sh.f),
      stroke: sh.st ? c(sh.st) : 'none',
      strokeWidth: sh.sw ?? 0,
    }));
  const k = STAGE_SCALE[stage];
  const out: PlantDrawing = {
    shapes,
    scale: `translate(50 64) scale(${k}) translate(-50 -64)`,
    scaleFactor: k,
    tilt: thirsty ? 'rotate(-9 50 64)' : '',
    mouth: thirsty ? MOUTH_SAD : MOUTH_HAPPY,
  };
  cache.set(key, out);
  return out;
}
