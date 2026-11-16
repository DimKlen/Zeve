import { render, screen } from '@testing-library/react-native';

import { SeasonCard, seasonRowsOf } from './SeasonCard';

describe('SeasonCard', () => {
  it('annonce la saison et le climat idéal, sans répéter les conseils du guide', async () => {
    await render(<SeasonCard speciesId="calathea" now={new Date(2026, 0, 10)} />);
    expect(screen.getByText('On est en hiver')).toBeOnTheScreen();
    expect(screen.getByLabelText('Humidité idéale : 60 à 80 pour cent')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Température idéale : 18 à 26 degrés, jamais sous 16 degrés'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Arrosage :/)).toBeNull();
  });

  it('écrit les températures négatives avec un vrai signe moins', async () => {
    await render(<SeasonCard speciesId="lavande" now={new Date(2026, 6, 10)} />);
    expect(screen.getByText('jamais sous −10 °C')).toBeOnTheScreen();
  });
});

describe('seasonRowsOf', () => {
  it('donne les conseils du moment pour le guide', () => {
    const { season, rows } = seasonRowsOf('calathea', false, null, new Date(2026, 0, 10));
    expect(season).toBe('winter');
    expect(rows.find((r) => r.key === 'water')?.text).toMatch(/^La terre sèche plus lentement/);
    expect(rows.find((r) => r.key === 'air')?.text).toMatch(/^Le chauffage assèche l’air/);
  });

  it('se passe du conseil d’air quand il n’y en a pas', () => {
    const { rows } = seasonRowsOf('lavande', false, null, new Date(2026, 6, 10));
    expect(rows.find((r) => r.key === 'air')).toBeUndefined();
  });
});
