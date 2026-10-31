import { fireEvent, render, screen } from '@testing-library/react-native';

import { TodoCard } from '@/features/garden/TodoCard';
import type { GardenPlant, TodoItem } from '@/features/garden/gardenRules';
import { SpeciesRow } from '@/features/newPlant/SpeciesRow';
import { SPECIES_BY_ID } from '@/plants/species';

const gaston: GardenPlant = {
  id: 'gaston',
  nickname: 'Gaston',
  speciesId: 'monstera',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  roomId: 'salon',
  roomName: 'Salon',
  light: 'indirect',
  lightLabel: 'Vive, indirecte',
  air: 'Humide',
  tip: '',
  createdAt: new Date(2025, 7, 26),
  waterEveryDays: 8,
  lastWateredAt: new Date(2026, 9, 21),
  previousWateredAt: null,
};

describe('TodoCard (lignes « À arroser »)', () => {
  it('propose « J’ai arrosé » puis affiche « Arrosé » une fois fait', async () => {
    const onWater = jest.fn();
    const todo: TodoItem[] = [
      { plant: gaston, done: false, sinceLabel: '9 j sans eau', daysSinceWater: 9 },
    ];
    await render(<TodoCard items={todo} onWater={onWater} />);
    expect(screen.getByText('Salon · 9 j sans eau')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: "J'ai arrosé" }));
    expect(onWater).toHaveBeenCalledWith(gaston);

    await screen.rerender(<TodoCard items={[{ ...todo[0]!, done: true }]} onWater={onWater} />);
    expect(screen.queryByRole('button', { name: "J'ai arrosé" })).toBeNull();
    expect(screen.getByLabelText('Arrosé')).toBeOnTheScreen();
  });
});

describe('SpeciesRow', () => {
  const monstera = SPECIES_BY_ID.monstera!;

  it('lit nom, latin et type ; renvoie l’espèce au tap', async () => {
    const onPress = jest.fn();
    await render(<SpeciesRow species={monstera} selected={false} onPress={onPress} />);
    const row = screen.getByRole('button', {
      name: 'Monstera, Monstera deliciosa, Feuilles découpées',
    });
    expect(row).not.toBeSelected();
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledWith(monstera);
  });

  it('annonce la ligne choisie', async () => {
    await render(<SpeciesRow species={monstera} selected onPress={jest.fn()} />);
    expect(
      screen.getByRole('button', {
        name: /Monstera, Monstera deliciosa, Feuilles découpées, sélectionnée/,
      }),
    ).toBeSelected();
  });
});
