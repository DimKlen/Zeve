// Mode « Découvrir » (docs/06 F16) : photo → Storage tmp → Edge Function discover-plant.
import * as Crypto from 'expo-crypto';

import { pickPlantPhoto, uploadTmpPhoto } from '@/features/newPlant/api';
import { supabase } from '@/lib/supabase';

import type { Discovery, DiscoveryCandidate } from './history';
import type { PlantFacts } from './model';

const TIMEOUT_MS = 25_000;

export class DiscoverError extends Error {
  constructor(readonly reason: 'timeout' | 'quota' | 'failed') {
    super(reason);
  }
}

async function invoke<T>(body: object): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new DiscoverError('timeout')), TIMEOUT_MS),
  );
  const call = supabase.functions
    .invoke<T>('discover-plant', { body })
    .then(async ({ data, error }) => {
      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status;
        throw new DiscoverError(status === 429 ? 'quota' : 'failed');
      }
      if (!data) throw new DiscoverError('failed');
      return data;
    });
  return Promise.race([call, timeout]);
}

/**
 * Photo (appareil photo ou galerie) → découverte : candidats Pl@ntNet et fiche du plus probable.
 * Null si l'utilisateur annule la photo. `onUploading` : la photo est choisie, l'attente commence.
 */
export async function discoverFromPhoto(
  userId: string,
  source: 'camera' | 'library',
  onUploading: () => void,
): Promise<Discovery | null> {
  const photo = await pickPlantPhoto(source);
  if (!photo) return null;
  onUploading();
  const photoPath = await uploadTmpPhoto(photo, userId);
  const result = await invoke<{ candidates: DiscoveryCandidate[]; facts: PlantFacts | null }>({
    photoPath,
  });
  const top = result.candidates[0];
  return {
    id: Crypto.randomUUID(),
    at: new Date().toISOString(),
    photoUri: photo.uri,
    candidates: result.candidates,
    selected: 0,
    facts: top ? { [top.latin]: result.facts } : {},
  };
}

/** Fiche d'un autre candidat (à la demande, mise en cache côté serveur). */
export async function factsFor(c: DiscoveryCandidate): Promise<PlantFacts | null> {
  const { facts } = await invoke<{ facts: PlantFacts | null }>({
    latin: c.latin,
    commonName: c.commonName,
    family: c.family,
  });
  return facts;
}
