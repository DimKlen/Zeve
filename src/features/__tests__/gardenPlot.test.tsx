import { fireEvent, render, screen } from '@testing-library/react-native';

import type { GardenPlant } from '@/features/garden/gardenRules';
import { GardenPlot } from '@/features/gardens/GardenPlot';
import type { GardenSummary } from '@/features/gardens/gardenRules';

const now = new Date(2026, 10, 4, 10);
const plant = (i: number): GardenPlant => ({
  id: `p${i}`,
  nickname: `Plante ${i}`,
  speciesId: 'basilic',
  speciesName: 'Basilic',
  latin: 'Ocimum basilicum',
  lightLabel: 'Vive',
  air: 'Normal',
  tip: '',
  createdAt: new Date(2026, 0, 1),
  waterEveryDays: 7,
  lastWateredAt: new Date(2026, 10, 3),
  previousWateredAt: null,
  gardenId: 'balcon',
  gardenName: 'Balcon',
  gardenPlace: { latitude: 45.76, countryCode: 'FR', country: 'France', city: 'Lyon' },
  history: [],
  learnedEveryDays: null,
  declined: null,
  drying: null,
});

const summary = (n: number, thirsty = 0): GardenSummary => ({
  garden: {
    id: 'balcon',
    name: 'Balcon',
    city: 'Lyon',
    country: 'France',
    countryCode: 'FR',
    latitude: 45.76,
    longitude: 4.84,
    createdAt: new Date(2026, 0, 1),
    weatherNow: null,
  },
  plants: [...Array(n).keys()].map(plant),
  thirsty,
});

describe('GardenPlot', () => {
  it('annonce le jardin, ses plantes et leur soif, et ouvre le jardin au tap', async () => {
    const onPress = jest.fn();
    await render(
      <GardenPlot
        summary={summary(6, 2)}
        now={now}
        size={164}
        delay="d2"
        active
        onPress={onPress}
      />,
    );
    const card = screen.getByRole('button', {
      name: 'Balcon, Lyon, France, 6 plantes, 2 ont soif',
    });
    expect(screen.getByText('6 plantes · 2 ont soif')).toBeTruthy();
    expect(screen.queryByText(/^\+/, { includeHiddenElements: true })).toBeNull();
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('montre au plus 10 plantes et « +N » pour les autres', async () => {
    await render(
      <GardenPlot
        summary={summary(13)}
        now={now}
        size={164}
        delay="d2"
        active={false}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('+3', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('13 plantes · tout le monde est hydraté')).toBeTruthy();
  });
});
