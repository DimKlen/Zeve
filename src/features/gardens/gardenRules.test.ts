import { readFileSync } from 'fs';
import { join } from 'path';

import type { GardenPlant } from '@/features/garden/gardenRules';

import {
  DEFAULT_ROOMS,
  defaultGardenName,
  isLastInGarden,
  isSouthern,
  placeLabel,
  summarizeGardens,
  type Garden,
} from './gardenRules';

const NOW = new Date(2026, 10, 2, 10);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const garden = (
  id: string,
  name: string,
  created: number,
  place: Partial<Garden> = {},
): Garden => ({
  id,
  name,
  city: null,
  country: null,
  countryCode: null,
  latitude: null,
  longitude: null,
  createdAt: daysAgo(created),
  ...place,
});

const plant = (id: string, gardenId: string, lastWatered: number, every = 7): GardenPlant => ({
  id,
  nickname: id,
  speciesId: 'monstera',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  roomId: null,
  roomName: null,
  light: 'indirect',
  lightLabel: 'Vive, indirecte',
  air: 'Humide',
  tip: '',
  createdAt: daysAgo(100),
  waterEveryDays: every,
  lastWateredAt: daysAgo(lastWatered),
  previousWateredAt: null,
  gardenId,
  gardenName: gardenId,
  gardenPlace: { latitude: null, countryCode: null, country: null, city: null },
});

describe('defaultGardenName', () => {
  it('numérote par ville en prenant le premier numéro libre', () => {
    expect(defaultGardenName('Montréal', [])).toBe('Montréal 1');
    expect(defaultGardenName('Montréal', ['Montréal 1', 'Paris 1'])).toBe('Montréal 2');
    expect(defaultGardenName('Montréal', ['Montréal 2'])).toBe('Montréal 1');
  });

  it('ignore casse et accents, et retombe sur « Jardin » sans ville', () => {
    expect(defaultGardenName('montreal', ['Montréal 1'])).toBe('montreal 2');
    expect(defaultGardenName('  ', ['Jardin 1'])).toBe('Jardin 2');
    expect(defaultGardenName(null, [])).toBe('Jardin 1');
  });
});

describe('isSouthern', () => {
  it('lit la latitude d’abord, puis le pays', () => {
    expect(isSouthern({ latitude: -33.9, countryCode: null, country: null })).toBe(true);
    expect(isSouthern({ latitude: 45.5, countryCode: 'AU', country: null })).toBe(false);
    expect(isSouthern({ latitude: null, countryCode: 'au', country: null })).toBe(true);
    expect(isSouthern({ latitude: null, countryCode: null, country: 'Nouvelle-Zélande' })).toBe(
      true,
    );
    expect(isSouthern({ latitude: null, countryCode: null, country: 'nouvelle zelande' })).toBe(
      true,
    );
    expect(isSouthern({ latitude: null, countryCode: null, country: 'Canada' })).toBe(false);
    expect(isSouthern(null)).toBe(false);
  });
});

describe('placeLabel', () => {
  it('assemble ville et pays présents', () => {
    expect(placeLabel({ city: 'Montréal', country: 'Canada' })).toBe('Montréal, Canada');
    expect(placeLabel({ city: 'Montréal', country: null })).toBe('Montréal');
    expect(placeLabel({ city: null, country: null })).toBe('');
  });
});

describe('summarizeGardens', () => {
  it('trie les jardins par ancienneté et compte les plantes assoiffées', () => {
    const gardens = [garden('mtl', 'Montréal 1', 10), garden('paris', 'Paris 1', 400)];
    const plants = [plant('a', 'paris', 1), plant('b', 'paris', 9), plant('c', 'mtl', 2)];
    const [paris, mtl] = summarizeGardens(gardens, plants, NOW);
    expect(paris!.garden.id).toBe('paris');
    expect(paris!.plants.map((p) => p.id)).toEqual(['b', 'a']);
    expect(paris!.thirsty).toBe(1);
    expect(mtl!.plants.map((p) => p.id)).toEqual(['c']);
    expect(mtl!.thirsty).toBe(0);
  });
});

describe('isLastInGarden', () => {
  it('repère la seule plante d’un jardin', () => {
    const plants = [plant('a', 'paris', 1), plant('b', 'paris', 1), plant('c', 'mtl', 1)];
    expect(isLastInGarden(plants[0]!, plants)).toBe(false);
    expect(isLastInGarden(plants[2]!, plants)).toBe(true);
  });
});

describe('DEFAULT_ROOMS', () => {
  it('correspond aux pièces créées par la base avec chaque jardin', () => {
    const sql = readFileSync(
      join(__dirname, '../../../supabase/migrations/0006_gardens.sql'),
      'utf8',
    );
    const body = sql.slice(sql.indexOf('function public.handle_new_garden'));
    const names = [
      ...body.slice(0, body.indexOf('return new')).matchAll(/new\.id, '([^']+)'/g),
    ].map((m) => m[1]);
    expect(names).toEqual([...DEFAULT_ROOMS]);
  });
});
