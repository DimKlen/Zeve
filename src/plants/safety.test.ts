import { potMateOf, toxicityOf, TOXICITY } from './safety';
import { SPECIES } from './species';

describe('toxicité', () => {
  it('couvre chaque espèce du catalogue, et rien d’autre', () => {
    const ids = SPECIES.map((s) => s.id).sort();
    expect(Object.keys(TOXICITY).sort()).toEqual(ids);
  });

  it('classe les cas connus', () => {
    expect(toxicityOf('pothos')).toEqual({ pets: 'mild', humans: 'mild' });
    expect(toxicityOf('cycas')).toEqual({ pets: 'toxic', humans: 'toxic' });
    expect(toxicityOf('calathea')).toEqual({ pets: 'safe', humans: 'safe' });
    expect(toxicityOf('ciboulette')).toEqual({ pets: 'toxic', humans: 'safe' });
    // Raisin : grave pour les chiens, sans danger pour nous.
    expect(toxicityOf('vigne')).toEqual({ pets: 'toxic', humans: 'safe' });
  });

  it('reste prudente pour une espèce inconnue', () => {
    expect(toxicityOf('inconnue')).toEqual({ pets: 'unknown', humans: 'unknown' });
  });
});

describe('cohabitation dans un même pot', () => {
  it('garde seules les plantes envahissantes ou nuisibles aux voisines', () => {
    expect(potMateOf('menthe')).toBe('alone');
    expect(potMateOf('noyer')).toBe('harmful');
    expect(potMateOf('eucalyptus')).toBe('harmful');
  });

  it('regroupe les plantes aux mêmes besoins', () => {
    expect(potMateOf('echeveria')).toBe('dry');
    expect(potMateOf('cactus-noel')).toBe('shared');
    expect(potMateOf('thym')).toBe('mediterranean');
    expect(potMateOf('basilic')).toBe('herbs');
    expect(potMateOf('calathea')).toBe('moist');
    expect(potMateOf('phalaenopsis')).toBe('orchid');
    expect(potMateOf('pothos')).toBe('shared');
  });

  it('traite à part la pleine terre, les herbes sauvages et les plantes sans terre', () => {
    expect(potMateOf('chene')).toBe('ground');
    expect(potMateOf('liseron')).toBe('weed');
    expect(potMateOf('tillandsia')).toBe('none');
  });
});
