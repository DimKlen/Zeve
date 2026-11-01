import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { StyleSheet } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { darkColors, lightColors, type Palette } from './colors';

export type ColorScheme = 'light' | 'dark';

type SchemeState = {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
};

/** Mode clair / sombre choisi dans Réglages, gardé sur l'appareil. */
export const useSchemeStore = create<SchemeState>()(
  persist((set) => ({ scheme: 'light', setScheme: (scheme) => set({ scheme }) }), {
    name: 'zeve-color-scheme',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

const PALETTES: Record<ColorScheme, Palette> = { light: lightColors, dark: darkColors };

export const useColorScheme = () => useSchemeStore((s) => s.scheme);

/** Vrai une fois le mode enregistré relu (le splash attend : pas d'éclair du mauvais thème). */
export const useSchemeHydrated = () =>
  useSyncExternalStore(
    useSchemeStore.persist.onFinishHydration,
    useSchemeStore.persist.hasHydrated,
  );

/** Palette du mode courant (couleurs passées en props : icônes, tintColor…). */
export const useColors = (): Palette => PALETTES[useColorScheme()];

/**
 * Feuille de styles thémée : construite une fois par mode au chargement du module,
 * le hook renvoie celle du mode courant.
 */
export function makeStyles<T extends Parameters<typeof StyleSheet.create>[0]>(
  factory: (colors: Palette) => T,
) {
  const sheets: Record<ColorScheme, Readonly<T>> = {
    light: StyleSheet.create(factory(lightColors)),
    dark: StyleSheet.create(factory(darkColors)),
  };
  return (): Readonly<T> => sheets[useColorScheme()];
}
