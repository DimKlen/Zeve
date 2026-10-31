import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { Chip } from '../Chip';
import { LightOption } from '../LightOption';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  function Controlled() {
    const [on, setOn] = useState(false);
    return <Toggle value={on} onValueChange={setOn} accessibilityLabel="Rappels d'arrosage" />;
  }

  it('est un interrupteur qui bascule et annonce son état', async () => {
    await render(<Controlled />);
    const toggle = screen.getByRole('switch', { name: "Rappels d'arrosage" });
    expect(toggle).not.toBeChecked();
    await fireEvent.press(toggle);
    expect(toggle).toBeChecked();
    await fireEvent.press(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('désactivé : ne bascule pas', async () => {
    const onChange = jest.fn();
    await render(
      <Toggle value={false} onValueChange={onChange} accessibilityLabel="Rappels" disabled />,
    );
    await fireEvent.press(screen.getByRole('switch', { name: 'Rappels' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('annonce la sélection et réagit au tap', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Salon" variant="room" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Salon' });
    expect(chip).toBeSelected();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('non sélectionnée par défaut ; la suggestion n’a pas d’état de sélection', async () => {
    await render(
      <>
        <Chip label="Feuillage" />
        <Chip label="Engrais ?" variant="suggestion" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Feuillage' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Engrais ?' })).not.toBeSelected();
  });
});

describe('LightOption', () => {
  it('lit le libellé et l’indice, et annonce la sélection', async () => {
    await render(<LightOption label="Lumineux" hint="sans soleil direct" selected />);
    expect(screen.getByRole('button', { name: 'Lumineux, sans soleil direct' })).toBeSelected();
  });
});
