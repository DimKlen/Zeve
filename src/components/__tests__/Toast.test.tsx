import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { duration } from '@/motion';

import { showToast, ToastHost, useToastStore } from '../Toast';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderHost = () =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ToastHost />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.useFakeTimers();
  useToastStore.setState({ message: null, key: 0 });
});
afterEach(() => jest.useRealTimers());

describe('Toast', () => {
  it('affiche un seul message à la fois, annoncé comme alerte', async () => {
    await renderHost();
    await act(() => showToast('Gaston te dit merci !'));
    expect(screen.getByRole('alert')).toHaveTextContent('Gaston te dit merci !');
    await act(() => showToast('Rappels activés'));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Rappels activés');
  });

  it('disparaît après 2.6 s', async () => {
    await renderHost();
    await act(() => showToast('Lien envoyé'));
    expect(screen.getByText('Lien envoyé')).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(duration.toastVisible + 10));
    expect(useToastStore.getState().message).toBeNull();
  });
});
