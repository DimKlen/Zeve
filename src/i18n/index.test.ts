import { t, tList } from './index';

describe('t', () => {
  it('renvoie le texte de la clé', () => {
    expect(t('garden.title')).toBe('Mon jardin');
  });

  it('remplace les paramètres', () => {
    const greeting = t('chat.greeting', { name: 'Gaston' });
    expect(greeting).toContain('Je suis Gaston.');
    expect(greeting).not.toContain('{name}');
    expect(t('species.countAll', { count: 52, types: 19 })).toBe('52 espèces · 19 types');
  });

  it('laisse un paramètre absent tel quel', () => {
    expect(t('chat.greeting')).toContain('{name}');
  });

  it('renvoie la clé si elle est inconnue', () => {
    expect(t('nope.missing')).toBe('nope.missing');
    expect(t('garden')).toBe('garden');
  });
});

describe('tList', () => {
  it('renvoie une liste', () => {
    expect(tList('chat.suggestions')).toHaveLength(3);
    expect(tList('garden.title')).toEqual([]);
  });
});
