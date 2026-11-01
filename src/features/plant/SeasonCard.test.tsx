import { render, screen } from '@testing-library/react-native';

import { SeasonCard } from './SeasonCard';

describe('SeasonCard', () => {
  it('annonce la saison, le climat idéal et les conseils du moment', async () => {
    await render(<SeasonCard speciesId="calathea" now={new Date(2026, 0, 10)} />);
    expect(screen.getByText('On est en hiver')).toBeOnTheScreen();
    expect(screen.getByLabelText('Humidité idéale : 60 à 80 pour cent')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Température idéale : 18 à 26 degrés, jamais sous 16 degrés'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Arrosage : La terre sèche plus lentement/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Air : Le chauffage assèche l’air/)).toBeOnTheScreen();
  });

  it('écrit les températures négatives avec un vrai signe moins', async () => {
    await render(<SeasonCard speciesId="lavande" now={new Date(2026, 6, 10)} />);
    expect(screen.getByText('jamais sous −10 °C')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Air :/)).toBeNull();
  });
});
