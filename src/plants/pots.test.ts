import { normalizePot, POT_COUNT, POT_GEOMETRY, potMarks, POTS, randomPot } from './pots';

describe('collection de pots', () => {
  it('compte 20 pots tous différents', () => {
    expect(POTS).toHaveLength(POT_COUNT);
    const keys = new Set(POTS.map((p) => `${p.shape}|${p.body}|${p.pattern}`));
    expect(keys.size).toBe(POT_COUNT);
  });

  it('varie les formes, les motifs et les couleurs', () => {
    expect(new Set(POTS.map((p) => p.shape)).size).toBe(Object.keys(POT_GEOMETRY).length);
    expect(new Set(POTS.map((p) => p.pattern)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(POTS.map((p) => p.body)).size).toBe(POT_COUNT);
  });

  it('un motif uni n’a aucune marque, les autres en ont', () => {
    expect(potMarks('plain')).toEqual([]);
    for (const p of POTS)
      if (p.pattern !== 'plain') expect(potMarks(p.pattern).length).toBeGreaterThan(0);
  });
});

describe('normalizePot / randomPot', () => {
  it('retombe sur le pot d’origine si invalide', () => {
    expect(normalizePot(undefined)).toBe(0);
    expect(normalizePot(null)).toBe(0);
    expect(normalizePot(20)).toBe(0);
    expect(normalizePot(-1)).toBe(0);
    expect(normalizePot(7)).toBe(7);
  });

  it('tire toujours un pot valide et différent de l’actuel', () => {
    for (let current = 0; current < POT_COUNT; current++) {
      for (const r of [0, 0.25, 0.5, 0.99999]) {
        const pick = randomPot(current, () => r);
        expect(pick).toBeGreaterThanOrEqual(0);
        expect(pick).toBeLessThan(POT_COUNT);
        expect(pick).not.toBe(current);
      }
    }
    expect(randomPot(undefined, () => 0.99999)).toBe(POT_COUNT - 1);
  });
});
