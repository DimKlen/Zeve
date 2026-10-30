// Ajout d'une plante (docs/06 F6–F7) : photo → Storage → identify-species, création, pièces.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { useAuthStore } from '@/features/auth/authStore';
import { plantsKey } from '@/features/garden/api';
import { rescheduleReminders } from '@/features/notifications/schedule';
import { supabase } from '@/lib/supabase';
import type { Light } from '@/plants/careInfo';

import { SPECIES_BY_ID } from '@/plants/species';

import { waterEveryDaysOf } from './searchSpecies';

const BUCKET = 'plant-photos';
const MAX_SIDE = 1280;
const QUALITY = 0.7;
const IDENTIFY_TIMEOUT_MS = 20_000;
const LAST_ROOM_KEY = 'zeve-last-room';

export type PickedPhoto = { uri: string; width: number; height: number };

/** Photo prise (caméra par défaut, galerie si la caméra est refusée ou absente), ou null si annulé. */
export async function pickPlantPhoto(): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  let result: ImagePicker.ImagePickerResult;
  const camera =
    Platform.OS === 'web' ? { granted: false } : await ImagePicker.requestCameraPermissionsAsync();
  if (camera.granted) {
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/** JPEG ≤ 1280 px, qualité 0.7 (docs/06 F7), envoyé dans Storage au chemin donné. */
export async function uploadPhoto(photo: PickedPhoto, path: string): Promise<string> {
  // Plus grand côté ramené à 1280 px, sans jamais agrandir.
  const landscape = photo.width >= photo.height;
  const longest = landscape ? photo.width : photo.height;
  const resize =
    longest > MAX_SIDE ? [{ resize: landscape ? { width: MAX_SIDE } : { height: MAX_SIDE } }] : [];
  const image = await ImageManipulator.manipulateAsync(photo.uri, resize, {
    compress: QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const body = await (await fetch(image.uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

/** Photo de reconnaissance : {uid}/tmp/{uuid}.jpg, déplacée à la création de la plante. */
export const uploadTmpPhoto = (photo: PickedPhoto, userId: string) =>
  uploadPhoto(photo, `${userId}/tmp/${Crypto.randomUUID()}.jpg`);

export type Identification = {
  speciesId: string | null;
  confidence: number;
  alternatives: string[];
};

export class IdentifyTimeoutError extends Error {}

/** Edge Function identify-species, abandonnée après 20 s. */
export async function identifySpecies(photoPath: string): Promise<Identification> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new IdentifyTimeoutError()), IDENTIFY_TIMEOUT_MS),
  );
  const call = supabase.functions
    .invoke<Identification>('identify-species', { body: { photoPath } })
    .then(({ data, error }) => {
      if (error || !data) throw error ?? new Error('Réponse vide.');
      // Garde-fou : seule une espèce du catalogue de l'app est acceptée.
      if (data.speciesId && !SPECIES_BY_ID[data.speciesId]) return { ...data, speciesId: null };
      return data;
    });
  return Promise.race([call, timeout]);
}

/** Pièce par défaut : la dernière utilisée (docs/06 F6). */
export const loadLastRoom = () => AsyncStorage.getItem(LAST_ROOM_KEY).catch(() => null);

type CreateInput = {
  speciesId: string;
  source: 'photo' | 'list';
  name: string;
  roomId: string | null;
  light: Light;
  photoPath: string | null;
};

/** Création de la plante ; la photo est déplacée de tmp/ vers le dossier de la plante. */
export function useCreatePlant() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const species = SPECIES_BY_ID[input.speciesId];
      if (!userId || !species) throw new Error('Données incomplètes.');
      const nickname = input.name.trim() || species.name;
      const { data, error } = await supabase
        .from('plants')
        .insert({
          user_id: userId,
          species_id: species.id,
          nickname,
          room_id: input.roomId,
          light: input.light,
          water_every_days: waterEveryDaysOf(species),
          species_source: input.source,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (input.photoPath) {
        const finalPath = `${userId}/${data.id}/${input.photoPath.split('/').pop()}`;
        const moved = await supabase.storage.from(BUCKET).move(input.photoPath, finalPath);
        // La photo est un bonus : un échec ne fait pas échouer l'ajout.
        if (!moved.error) {
          await supabase.from('plants').update({ photo_path: finalPath }).eq('id', data.id);
        }
      }
      if (input.roomId) await AsyncStorage.setItem(LAST_ROOM_KEY, input.roomId).catch(() => null);
      return { id: data.id, name: nickname, speciesId: species.id };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantsKey(userId) });
      void rescheduleReminders();
    },
  });
}

/** « + Pièce » (non maquetté) : nouvelle pièce en fin de liste. */
export function useCreateRoom() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ name, position }: { name: string; position: number }) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ user_id: userId!, name: name.trim(), position })
        .select('id, name')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rooms', userId] }),
  });
}
