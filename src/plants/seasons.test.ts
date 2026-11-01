import { t } from '@/i18n';

import { climateOf, SPECIES_CLIMATE, seasonalAdvice, seasonOf, type Season } from './seasons';
import { SPECIES, SPECIES_BY_ID } from './species';

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

describe('seasonOf', () => {
  it('suit les saisons météorologiques de l’hémisphère nord', () => {
    expect(seasonOf(new Date(2026, 0, 15))).toBe('winter');
    expect(seasonOf(new Date(2026, 1, 28))).toBe('winter');
    expect(seasonOf(new Date(2026, 2, 1))).toBe('spring');
    expect(seasonOf(new Date(2026, 5, 1))).toBe('summer');
    expect(seasonOf(new Date(2026, 7, 31))).toBe('summer');
    expect(seasonOf(new Date(2026, 8, 1))).toBe('autumn');
    expect(seasonOf(new Date(2026, 10, 30))).toBe('autumn');
    expect(seasonOf(new Date(2026, 11, 1))).toBe('winter');
  });
});

describe('climateOf', () => {
  it('donne un climat cohérent à chaque espèce du catalogue', () => {
    for (const s of SPECIES) {
      const c = climateOf(s.id);
      expect(c.humidity[0]).toBeLessThan(c.humidity[1]);
      expect(c.ideal[0]).toBeLessThan(c.ideal[1]);
      expect(c.min).toBeLessThanOrEqual(c.ideal[0]);
    }
  });

  it('ne corrige que des espèces du catalogue', () => {
    for (const id of Object.keys(SPECIES_CLIMATE)) expect(SPECIES_BY_ID[id]).toBeDefined();
  });

  it('corrige les espèces que leur type de dessin classerait mal', () => {
    // Ficus benjamina est dessiné comme l'olivier, mais vit au chaud à l'intérieur.
    expect(SPECIES_BY_ID.benjamina!.form).toBe(SPECIES_BY_ID.olivier!.form);
    expect(climateOf('benjamina').outdoors).toBe('never');
    expect(climateOf('olivier').outdoors).toBe('year');
    expect(climateOf('calathea').humidity).toEqual([60, 80]);
  });
});

describe('seasonalAdvice', () => {
  it('a un texte pour chaque conseil de chaque espèce et saison', () => {
    for (const s of SPECIES) {
      for (const season of SEASONS) {
        const a = seasonalAdvice(s.id, season);
        for (const key of [a.water, a.light, a.place, a.feed, a.humidity]) {
          if (key === null) continue;
          expect(t(`season.${key}`)).not.toBe(`season.${key}`);
        }
      }
    }
  });

  it('met les succulentes au repos l’hiver et nourrit au printemps', () => {
    expect(seasonalAdvice('echeveria', 'winter')).toMatchObject({
      water: 'waterRest',
      feed: 'feedRest',
    });
    expect(seasonalAdvice('echeveria', 'spring').feed).toBe('feedSucculent');
    expect(seasonalAdvice('monstera', 'winter').water).toBe('waterLess');
    expect(seasonalAdvice('monstera', 'summer').feed).toBe('feedGrowth');
  });

  it('adapte l’emplacement à la rusticité', () => {
    expect(seasonalAdvice('basilic', 'autumn').place).toBe('placeBackInside');
    expect(seasonalAdvice('lavande', 'winter').place).toBe('placeHardyWinter');
    expect(seasonalAdvice('pothos', 'winter').place).toBe('placeHeating');
  });

  it('protège du soleil d’été les plantes d’ombre, pas celles de plein soleil', () => {
    expect(seasonalAdvice('pothos', 'summer').light).toBe('lightSummerShade');
    expect(seasonalAdvice('basilic', 'summer').light).toBe('lightSummerSun');
  });

  it('rappelle l’air sec du chauffage aux plantes qui aiment l’humidité', () => {
    expect(seasonalAdvice('calathea', 'winter').humidity).toBe('humidityHeating');
    expect(seasonalAdvice('calathea', 'summer').humidity).toBe('humidityHeat');
    expect(seasonalAdvice('echeveria', 'winter').humidity).toBeNull();
  });
});
