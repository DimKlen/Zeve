import { normalize } from '@/plants/plantStatus';

import { NAME_THEMES, suggestName } from './plantNames';

const ALL = Object.values(NAME_THEMES).flat();

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

describe('NAME_THEMES', () => {
  it('a une cinquantaine de noms courts par univers, sans doublon', () => {
    for (const names of Object.values(NAME_THEMES)) expect(names).toHaveLength(50);
    expect(new Set(ALL.map(normalize)).size).toBe(ALL.length);
    for (const name of ALL) expect(name.length).toBeLessThanOrEqual(12);
  });
});

describe('suggestName', () => {
  it('propose un nom des listes', () => {
    expect(ALL).toContain(suggestName([], null, seeded(1)));
  });

  it('ne reprend jamais un nom du jardin, même écrit autrement', () => {
    const random = seeded(7);
    const taken = ALL.slice(0, ALL.length - 1);
    expect(suggestName(taken, null, random)).toBe(ALL[ALL.length - 1]);
    expect(suggestName(['hermes'], null, () => 0.1)).not.toBe('Hermès');
  });

  it('« Autre nom » change toujours de nom', () => {
    const random = seeded(3);
    let name = suggestName([], null, random);
    for (let i = 0; i < 50; i += 1) {
      const next = suggestName([], name, random);
      expect(next).not.toBe(name);
      name = next;
    }
  });

  it('numérote quand tous les noms sont pris', () => {
    expect(suggestName(ALL)).toBe('Aiko 2');
  });
});
