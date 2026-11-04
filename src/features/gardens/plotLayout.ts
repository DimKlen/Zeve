/**
 * Placement des plantes dans le carré d'un jardin (vue « Mes jardins », non maquettée).
 * Repère normalisé 0..1 sur la pelouse : `x` = centre de la plante, `y` = sa base (le pot).
 */

export const PLOT_MAX = 10;
const PAD = 0.05;

export type PlotSlot = { index: number; x: number; y: number };
export type PlotLayout = {
  /** Largeur d'une plante, en fraction du côté de la pelouse (hauteur = largeur × 1,1). */
  width: number;
  /** Plantes affichées, dans l'ordre de dessin (du fond vers l'avant). */
  slots: PlotSlot[];
  /** Plantes non affichées (« +N »). */
  extra: number;
};

/** Plantes par rang : 1 à 3 rangs, le rang du milieu prend le surplus (3 · 4 · 3). */
export function rowsOf(n: number): number[] {
  if (n <= 0) return [];
  if (n <= 3) return [n];
  if (n <= 6) return [Math.ceil(n / 2), Math.floor(n / 2)];
  const base = Math.floor(n / 3);
  const rest = n - base * 3;
  return rest === 0
    ? [base, base, base]
    : rest === 1
      ? [base, base + 1, base]
      : [base + 1, base, base + 1];
}

/** Décalage déterministe dans [-1, 1] : un jardin a toujours la même allure. */
const wobble = (i: number, k: number) =>
  Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 3.7 + k) * 0.5;

/**
 * Plantes en rangs légèrement décalés, comme plantées à la main (variante « bosquet » retenue ;
 * la variante en rangs alignés est dans docs/captures/jardins-clotures).
 */
export function plotLayout(count: number): PlotLayout {
  const shown = Math.min(count, PLOT_MAX);
  const rows = rowsOf(shown);
  if (!rows.length) return { width: 0, slots: [], extra: 0 };
  const perRow = Math.max(...rows);
  const span = 1 - 2 * PAD;
  const width = Math.min(span / (perRow + 0.1), span / (rows.length * 1.1 * 1.15), 0.46);
  const h = width * 1.1;
  const slots: PlotSlot[] = [];
  let index = 0;
  rows.forEach((k, r) => {
    // Rangs serrés au centre de la pelouse (au plus 1,25 hauteur de plante d'un rang à l'autre).
    const pitch = rows.length > 1 ? Math.min((span - h) / (rows.length - 1), h * 1.25) : 0;
    const y = 0.5 + h / 2 + (r - (rows.length - 1) / 2) * pitch;
    for (let j = 0; j < k; j++) {
      const x =
        PAD +
        ((j + 0.5) / k) * span +
        wobble(index, 1) * (span / k) * 0.18 +
        (r % 2 ? 0.03 : -0.03);
      const dy = wobble(index, 2) * h * 0.18;
      const half = width / 2;
      slots.push({
        index,
        x: Math.min(Math.max(x, PAD + half), 1 - PAD - half),
        y: Math.min(Math.max(y + dy, PAD + h), 1 - PAD),
      });
      index++;
    }
  });
  slots.sort((a, b) => a.y - b.y);
  return { width, slots, extra: count - shown };
}
