// Historique local des découvertes (docs/06 F16) : les 10 dernières, gardées sur l'appareil.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Candidate, PlantFacts } from './model';

export const HISTORY_MAX = 10;

export type DiscoveryCandidate = Candidate & { catalogSpeciesId: string | null };

export type Discovery = {
  id: string;
  /** ISO, pour la persistance JSON. */
  at: string;
  /** Photo sur l'appareil (le serveur ne la garde pas). */
  photoUri: string;
  candidates: DiscoveryCandidate[];
  /** Candidat affiché (« Pas sûr » → un autre). */
  selected: number;
  /** Fiches déjà chargées, par nom latin ; null si la génération a échoué. */
  facts: Record<string, PlantFacts | null>;
};

/** Ajoute en tête (une découverte rouverte remonte), au plus HISTORY_MAX. */
export function addDiscovery(list: Discovery[], d: Discovery, max = HISTORY_MAX): Discovery[] {
  return [d, ...list.filter((x) => x.id !== d.id)].slice(0, max);
}

type Store = {
  items: Discovery[];
  add: (d: Discovery) => void;
  update: (id: string, patch: Partial<Discovery>) => void;
};

export const useDiscoveries = create<Store>()(
  persist(
    (set) => ({
      items: [],
      add: (d) => set((s) => ({ items: addDiscovery(s.items, d) })),
      update: (id, patch) =>
        set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    }),
    { name: 'zeve-discoveries', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
