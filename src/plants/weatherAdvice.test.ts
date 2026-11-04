import { t } from '@/i18n';

import { climateOf } from './seasons';
import { weatherAdvice, WEATHER_ADVICE_KEYS } from './weatherAdvice';

const keys = (...args: Parameters<typeof weatherAdvice>) =>
  weatherAdvice(...args).map((a) => a.key);

describe('weatherAdvice', () => {
  it('ne dit rien sans météo, ni par temps doux', () => {
    expect(weatherAdvice(climateOf('monstera'), null, null, 'autumn')).toEqual([]);
    expect(keys(climateOf('monstera'), { temp: 21, humidity: 60 }, 14, 'summer')).toEqual([]);
  });

  it('froid dehors : éloigner des vitres une plante d’intérieur, pas une plante rustique', () => {
    expect(keys(climateOf('monstera'), { temp: 4, humidity: 70 }, 1, 'winter')).toContain(
      'awayFromWindow',
    );
    expect(keys(climateOf('lavande'), { temp: 4, humidity: 70 }, 1, 'winter')).not.toContain(
      'awayFromWindow',
    );
  });

  it('gel annoncé : rentrer une plante qui sort l’été (plutôt qu’éloigner des vitres)', () => {
    const advice = keys(climateOf('basilic'), { temp: 6, humidity: 70 }, -1, 'autumn');
    expect(advice).toContain('bringInside');
    expect(advice).not.toContain('awayFromWindow');
  });

  it('chaleur au-dessus de l’idéal : protéger du soleil de l’après-midi', () => {
    expect(keys(climateOf('calathea'), { temp: 31, humidity: 40 }, 22, 'summer')).toContain(
      'shadeHeat',
    );
  });

  it('air sec du chauffage pour une espèce qui aime l’humidité, pas pour une succulente', () => {
    expect(keys(climateOf('calathea'), { temp: 8, humidity: 75 }, 5, 'winter')).toContain('dryAir');
    expect(keys(climateOf('echeveria'), { temp: 8, humidity: 75 }, 5, 'winter')).not.toContain(
      'dryAir',
    );
  });

  it('temps très humide : espacer l’arrosage d’une succulente', () => {
    expect(keys(climateOf('echeveria'), { temp: 16, humidity: 92 }, 12, 'spring')).toEqual([
      'humidSucculent',
    ]);
  });

  it('au plus 2 conseils, chacun remplaçant un conseil de saison différent', () => {
    const advice = weatherAdvice(climateOf('calathea'), { temp: 3, humidity: 90 }, -2, 'winter');
    expect(advice.length).toBeLessThanOrEqual(2);
    expect(new Set(advice.map((a) => a.replaces)).size).toBe(advice.length);
  });

  it('a un texte pour chaque conseil', () => {
    for (const key of WEATHER_ADVICE_KEYS) {
      expect(t(`weather.${key}`)).not.toBe(`weather.${key}`);
    }
  });
});
