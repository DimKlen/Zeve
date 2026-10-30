import type { Light } from '@/plants/careInfo';
import { create } from 'zustand';

/** Brouillon partagé par new-plant/* (docs/05), réinitialisé à chaque ouverture depuis le +. */
export type Draft = {
  speciesId: string | null;
  source: 'photo' | 'list' | null;
  /** Confiance de la reconnaissance (< 0.6 : bandeau « Pas sûr à 100 % »). */
  confidence: number | null;
  /** Photo de reconnaissance dans Storage : {uid}/tmp/{uuid}.jpg. */
  photoPath: string | null;
  name: string;
  roomId: string | null;
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
  roomId: null,
  light: 'indirect',
  status: 'idle',
  wantsPhoto: false,
  created: null,
};

type Store = Draft & {
  set: (patch: Partial<Draft>) => void;
  reset: () => void;
};

export const useNewPlantDraft = create<Store>((set) => ({
  ...EMPTY,
  set: (patch) => set(patch),
  reset: () => set(EMPTY),
}));
