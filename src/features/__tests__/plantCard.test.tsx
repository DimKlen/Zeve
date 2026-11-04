import { fireEvent, render, screen } from '@testing-library/react-native';

import type { GardenPlant } from '@/features/garden/gardenRules';
import { PlantCard } from '@/features/garden/PlantCard';

const now = new Date(2026, 10, 4, 10);
const gaston: GardenPlant = {
  id: 'gaston',
  nickname: 'Gaston',
  speciesId: 'monstera',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  lightLabel: 'Vive, indirecte',
  air: 'Humide',
  tip: '',
  createdAt: new Date(2025, 7, 26),
  waterEveryDays: 8,
  lastWateredAt: new Date(2026, 10, 1),
  previousWateredAt: null,
  gardenId: 'paris',
  gardenName: 'Paris 1',
  gardenPlace: { latitude: 48.85, countryCode: 'FR', country: 'France', city: 'Paris' },
  history: [],
  learnedEveryDays: null,
  declined: null,
  drying: null,
};

const card = () => screen.getByRole('button', { name: /^Gaston, / });

describe('PlantCard', () => {
  it('tap : ouvre la fiche ; appui long : ouvre le menu court', async () => {
    const onPress = jest.fn();
    const onMenu = jest.fn();
    await render(
      <PlantCard plant={gaston} now={now} delay="d1" onPress={onPress} onMenu={onMenu} />,
    );
    await fireEvent.press(card());
    expect(onPress).toHaveBeenCalledWith(gaston);
    await fireEvent(card(), 'longPress');
    expect(onMenu).toHaveBeenCalledWith(gaston);
  });

  it('propose les mêmes actions aux lecteurs d’écran, « Changer de jardin » seulement s’il y a plusieurs jardins', async () => {
    const onMenu = jest.fn();
    const { rerender } = await render(
      <PlantCard plant={gaston} now={now} delay="d1" onPress={jest.fn()} onMenu={onMenu} canMove />,
    );
    expect(card().props.accessibilityActions.map((a: { name: string }) => a.name)).toEqual([
      'garden',
      'delete',
    ]);
    await fireEvent(card(), 'accessibilityAction', { nativeEvent: { actionName: 'delete' } });
    expect(onMenu).toHaveBeenCalledWith(gaston, 'delete');

    await rerender(
      <PlantCard plant={gaston} now={now} delay="d1" onPress={jest.fn()} onMenu={onMenu} />,
    );
    expect(card().props.accessibilityActions.map((a: { name: string }) => a.name)).toEqual([
      'delete',
    ]);
  });
});
