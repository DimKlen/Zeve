import type { GardenPlant } from '@/features/garden/gardenRules';

import { suggestionFor } from './rhythm';

const DAY = 86_400_000;
const now = Date.now();
const watered = (ago: number[], expected: number) =>
  ago.map((n) => ({ at: new Date(now - n * DAY), expectedDays: expected }));

// Frida (données de démo) : rythme 5 j, arrosée tous les 4 j.
const frida: GardenPlant = {
  id: 'frida',
  nickname: 'Frida',
  speciesId: 'calathea',
  speciesName: 'Calathea orbifolia',
  latin: 'Goeppertia orbifolia',
  lightLabel: 'Mi-ombre',
  air: 'Très humide',
  tip: '',
  createdAt: new Date(now - 290 * DAY),
  waterEveryDays: 5,
  lastWateredAt: new Date(now - 4 * DAY),
  previousWateredAt: new Date(now - 8 * DAY),
  gardenId: 'paris',
  gardenName: 'Paris 1',
  gardenPlace: { latitude: 48.85, countryCode: 'FR', country: 'France', city: 'Paris' },
  history: watered([4, 8, 12, 16, 20], 5),
  learnedEveryDays: null,
  declined: null,
  drying: null,
};

describe('suggestionFor', () => {
  it('propose le rythme observé', () => {
    expect(suggestionFor(frida)).toEqual({ days: 4, usable: 4 });
  });

  it('se tait une fois le rythme adopté, ou juste après un refus', () => {
    expect(suggestionFor({ ...frida, waterEveryDays: 4 })).toBeNull();
    expect(suggestionFor({ ...frida, declined: { days: 4, count: 4 } })).toBeNull();
  });

  it('se tait sans historique', () => {
    expect(suggestionFor({ ...frida, history: [] })).toBeNull();
  });
});
