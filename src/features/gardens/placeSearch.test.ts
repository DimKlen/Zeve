import { cityUrl, countryByName, parseCities, searchCountries } from './placeSearch';

describe('searchCountries', () => {
  it('trouve un pays sans accents ni majuscules, ceux qui commencent par la saisie d’abord', () => {
    expect(searchCountries('fra')[0]).toEqual({ code: 'FR', name: 'France' });
    expect(searchCountries('etats')[0]?.code).toBe('US');
    expect(searchCountries('cote d ivoire')[0]?.code).toBe('CI');
    // « Guinée » avant « Papouasie-Nouvelle-Guinée ».
    expect(searchCountries('guinee')[0]?.code).toBe('GN');
  });

  it('comprend les noms usuels', () => {
    expect(searchCountries('usa')[0]?.code).toBe('US');
    expect(searchCountries('angleterre')[0]?.code).toBe('GB');
    expect(searchCountries('hollande')[0]?.code).toBe('NL');
  });

  it('limite le nombre de propositions et ne propose rien sans saisie', () => {
    expect(searchCountries('a').length).toBeLessThanOrEqual(5);
    expect(searchCountries('  ')).toEqual([]);
  });

  it('reconnaît un pays tapé en entier', () => {
    expect(countryByName('france')?.code).toBe('FR');
    expect(countryByName('Nouvelle zelande')?.code).toBe('NZ');
    expect(countryByName('Fran')).toBeNull();
  });
});

describe('villes (géocodage Open-Meteo)', () => {
  it('cherche dans le pays choisi, en français', () => {
    const url = new URL(cityUrl('Montr', 'CA'));
    expect(url.host).toBe('geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('Montr');
    expect(url.searchParams.get('countryCode')).toBe('CA');
    expect(url.searchParams.get('language')).toBe('fr');
    expect(new URL(cityUrl('Lyon', null)).searchParams.has('countryCode')).toBe(false);
  });

  it('lit les villes et écarte les doublons et réponses invalides', () => {
    const body = {
      results: [
        {
          name: 'Montréal',
          admin1: 'Québec',
          country_code: 'CA',
          latitude: 45.5,
          longitude: -73.6,
        },
        {
          name: 'Montréal',
          admin1: 'Québec',
          country_code: 'CA',
          latitude: 45.5,
          longitude: -73.6,
        },
        {
          name: 'Montréal-Est',
          admin1: 'Québec',
          country_code: 'CA',
          latitude: 45.6,
          longitude: -73.5,
        },
        { name: 'Sans coordonnées' },
      ],
    };
    expect(parseCities(body)).toEqual([
      { name: 'Montréal', region: 'Québec', countryCode: 'CA', latitude: 45.5, longitude: -73.6 },
      {
        name: 'Montréal-Est',
        region: 'Québec',
        countryCode: 'CA',
        latitude: 45.6,
        longitude: -73.5,
      },
    ]);
    expect(parseCities(null)).toEqual([]);
  });
});
