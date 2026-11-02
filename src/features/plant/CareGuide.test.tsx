import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CareGuideSheet, CareSummary } from './CareGuide';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('CareSummary', () => {
  it('résume arrosage, lumière et température, et ouvre le guide', async () => {
    const onOpen = jest.fn();
    await render(<CareSummary speciesId="monstera" onOpen={onOpen} />);
    expect(
      screen.getByLabelText('Repères : arrosage tous les 8 jours, Vive, indirecte, 18 à 27 degrés'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Voir son guide d’entretien' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('CareGuideSheet', () => {
  it('détaille chaque sujet et suit le rythme réglé sur la plante', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <CareGuideSheet
          speciesId="monstera"
          name="Gaston"
          waterEveryDays={10}
          visible
          onClose={() => undefined}
        />
      </SafeAreaProvider>,
    );
    expect(screen.getByRole('header', { name: 'Prendre soin de Gaston' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Arrosage : Tous les 10 jours environ/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Terre : Terreau de plantes vertes allégé/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Pot : Pot percé avec une soucoupe/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Engrais : Engrais pour plantes vertes/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Rempotage : Tous les 1 à 2 ans/)).toBeOnTheScreen();
  });
});
