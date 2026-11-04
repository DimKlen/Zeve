import {
  forecastUrl,
  geocodeUrl,
  mockDaily,
  parseDaily,
  parseGeocode,
} from '../../../supabase/functions/_shared/openMeteo';
import { dryingFromWeather } from '@/plants/wateringModel';

describe('Open-Meteo', () => {
  it('demande 30 jours passés et 7 jours de prévisions, au fuseau du lieu', () => {
    const url = new URL(forecastUrl(45.50189, -73.56739));
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('45.5019');
    expect(url.searchParams.get('past_days')).toBe('30');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('daily')).toContain('et0_fao_evapotranspiration');
  });

  it('géocode une ville, filtrée par pays si connu', () => {
    const url = new URL(geocodeUrl('Montréal', 'CA'));
    expect(url.searchParams.get('name')).toBe('Montréal');
    expect(url.searchParams.get('countryCode')).toBe('CA');
    expect(new URL(geocodeUrl('Lyon', null)).searchParams.has('countryCode')).toBe(false);
  });

  it('lit les journées, ensoleillement en heures, valeurs manquantes à null', () => {
    const rows = parseDaily(
      {
        daily: {
          time: ['2026-11-01', '2026-11-02'],
          temperature_2m_mean: [4.2, null],
          relative_humidity_2m_mean: [81, 77],
          sunshine_duration: [18000, 0],
          et0_fao_evapotranspiration: [0.9, 1.1],
          precipitation_sum: [2.4, 0],
        },
      },
      'g1',
    );
    expect(rows).toEqual([
      {
        garden_id: 'g1',
        day: '2026-11-01',
        temp_mean: 4.2,
        humidity_mean: 81,
        sunshine_hours: 5,
        et0_mm: 0.9,
        precipitation_mm: 2.4,
      },
      {
        garden_id: 'g1',
        day: '2026-11-02',
        temp_mean: null,
        humidity_mean: 77,
        sunshine_hours: 0,
        et0_mm: 1.1,
        precipitation_mm: 0,
      },
    ]);
    expect(parseDaily({ error: true }, 'g1')).toEqual([]);
  });

  it('lit le premier résultat du géocodage', () => {
    expect(parseGeocode({ results: [{ latitude: 45.5, longitude: -73.6 }] })).toEqual({
      latitude: 45.5,
      longitude: -73.6,
    });
    expect(parseGeocode({})).toBeNull();
  });

  it('la météo simulée n’a aucun effet sur la date d’arrosage', () => {
    const rows = mockDaily('g1', new Date(2026, 10, 2));
    expect(rows).toHaveLength(37);
    const drying = dryingFromWeather(
      rows.map((r) => ({
        day: r.day,
        et0: r.et0_mm,
        tempMean: r.temp_mean,
        humidity: r.humidity_mean,
      })),
    );
    expect(Object.values(drying!).every((d) => d.factor === 1)).toBe(true);
  });
});
