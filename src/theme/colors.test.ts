import { act, renderHook } from '@testing-library/react-native';

import { darkColors, lightColors, type Palette } from './colors';
import { makeStyles, useColors, useSchemeStore } from './scheme';

/** Luminance relative WCAG d'une couleur #RRGGBB. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// Paires texte / fond utilisées par l'UI (docs/11 : textes ≥ 4.5:1).
const TEXT_PAIRS: [keyof Palette, keyof Palette][] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['inkMuted', 'bg'],
  ['inkMuted', 'surface'],
  ['inkSoft', 'well'],
  ['forest', 'bg'],
  ['forest', 'surface'],
  ['forest', 'sage'],
  ['forest', 'butter'],
  ['forestText', 'sage'],
  ['bg', 'forest'],
  ['onSun', 'sun'],
  ['bg', 'ink'],
  ['darkText', 'heroBg'],
  ['danger', 'surface'],
  ['onNav', 'navBg'],
];

describe.each([
  ['clair', lightColors],
  ['sombre', darkColors],
])('palette %s', (_name, palette) => {
  it.each(TEXT_PAIRS)('%s sur %s : contraste ≥ 4.5:1', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('mode clair / sombre', () => {
  afterEach(() => act(() => useSchemeStore.getState().setScheme('light')));

  it('clair par défaut, puis bascule palette et feuille de styles', async () => {
    const useStyles = makeStyles((colors) => ({ box: { backgroundColor: colors.bg } }));
    const { result } = await renderHook(() => ({ colors: useColors(), styles: useStyles() }));
    expect(result.current.colors.bg).toBe(lightColors.bg);
    expect(result.current.styles.box.backgroundColor).toBe(lightColors.bg);

    await act(() => useSchemeStore.getState().setScheme('dark'));
    expect(result.current.colors.bg).toBe(darkColors.bg);
    expect(result.current.styles.box.backgroundColor).toBe(darkColors.bg);
  });
});
