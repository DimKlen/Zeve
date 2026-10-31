import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  it('affiche son libellé et réagit au tap', async () => {
    const onPress = jest.fn();
    await render(<Button label="Ajouter au jardin" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter au jardin' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('désactivé : annoncé comme tel et sans effet', async () => {
    const onPress = jest.fn();
    await render(<Button label="Choisis d’abord son espèce" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Choisis d’abord son espèce' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('en cours : occupé, sans libellé visible ni tap', async () => {
    const onPress = jest.fn();
    await render(<Button label="Ajouter au jardin" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Ajouter au jardin' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.queryByText('Ajouter au jardin')).toBeNull();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
