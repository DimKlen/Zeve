import type { Light } from '@/plants/careInfo';
import { create } from 'zustand';

import type { GardenChoice } from './api';

/** Brouillon partagé par new-plant/* (docs/05), réinitialisé à chaque ouverture depuis le +. */
export type Draft = {
  speciesId: string | null;
  source: 'photo' | 'list' | null;
  /** Confiance de la reconnaissance (< 0.6 : bandeau « Pas sûr à 100 % »). */
  confidence: number | null;
  /** Photo de reconnaissance dans Storage : {uid}/tmp/{uuid}.jpg. */
  photoPath: string | null;
  name: string;
  /** Nom suggéré affiché (« Autre nom » en tire un différent). */
  suggestedName: string | null;
  /** Jardin choisi ; null tant que les jardins ne sont pas chargés. */
  garden: GardenChoice | null;
  roomId: string | null;
  /** Pièce par défaut d'un nouveau jardin (créée avec lui). */
  roomName: string | null;
  light: Light;
  status: 'idle' | 'recognizing';
  /** Demande de la liste des espèces (aucun résultat → « Prendre une photo »). */
  wantsPhoto: boolean;
  /** Plante créée, pour l'écran Plante ajoutée. */
  created: { id: string; name: string; speciesId: string } | null;
};

const EMPTY: Draft = {
  speciesId: null,
  source: null,
  confidence: null,
  photoPath: null,
  name: '',
  suggestedName: null,
  garden: null,
  roomId: null,
  roomName: null,
  light: 'indirect',
  status: 'idle',
  wantsPhoto: false,
  created: null,
};

type Store = Draft & {
  set: (patch: Partial<Draft>) => void;
  /** Brouillon vidé, avec le jardin d'où part l'ajout (jardin ouvert). */
  reset: (gardenId?: string) => void;
};

export const useNewPlantDraft = create<Store>((set) => ({
  ...EMPTY,
  set: (patch) => set(patch),
  reset: (gardenId) =>
    set({ ...EMPTY, garden: gardenId ? { kind: 'existing', id: gardenId } : null }),
}));
