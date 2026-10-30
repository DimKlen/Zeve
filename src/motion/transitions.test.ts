import { router } from 'expo-router';

import {
  go,
  goBack,
  resetTransitions,
  setCurrentScreen,
  takePendingAnim,
  transitionFor,
} from './transitions';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

beforeEach(() => {
  resetTransitions();
  jest.clearAllMocks();
});

describe('transitionFor', () => {
  it('suit la table de docs/03 §2', () => {
    expect(transitionFor('garden', 'plant')).toBe('zoom');
    expect(transitionFor('plant', 'chat')).toBe('fwd');
    expect(transitionFor('garden', 'newPlant')).toBe('up');
    expect(transitionFor('newPlant', 'species')).toBe('fwd');
    expect(transitionFor('species', 'newPlant')).toBe('back');
    expect(transitionFor('newPlant', 'added')).toBe('up');
    expect(transitionFor('added', 'plant')).toBe('zoom');
    expect(transitionFor('garden', 'settings')).toBe('fade');
    expect(transitionFor('reminders', 'garden')).toBe('up');
    expect(transitionFor('connecting', 'reminders')).toBe('fwd');
    expect(transitionFor('settings', 'login')).toBe('back');
  });

  it('fait un fondu sans écran d’origine et va de l’avant par défaut', () => {
    expect(transitionFor(null, 'garden')).toBe('fade');
    expect(transitionFor('chat', 'rooms')).toBe('fwd');
  });
});

describe('go / goBack', () => {
  it('pousse la route et prépare l’animation de la paire', () => {
    setCurrentScreen('garden');
    go('plant', { id: 'gaston' });
    expect(router.push).toHaveBeenCalledWith('/plant/gaston');
    expect(takePendingAnim()).toBe('zoom');
    expect(takePendingAnim()).toBeNull();
  });

  it('remplace la route et accepte une animation forcée', () => {
    setCurrentScreen('launch');
    go('login', { replace: true });
    expect(router.replace).toHaveBeenCalledWith('/login');
    expect(takePendingAnim()).toBe('fade');

    go('chat', { id: 'p1', anim: 'up' });
    expect(router.push).toHaveBeenCalledWith('/plant/p1/chat');
    expect(takePendingAnim()).toBe('up');
  });

  it('rejoue back au retour', () => {
    goBack();
    expect(router.back).toHaveBeenCalled();
    expect(takePendingAnim()).toBe('back');
  });
});
