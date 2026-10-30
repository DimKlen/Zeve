// Chat par plante (docs/06 F8) : fil, envoi via l'Edge Function plant-chat, photos, rappels.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useAuthStore } from '@/features/auth/authStore';
import { uploadPhoto, type PickedPhoto } from '@/features/newPlant/api';
import { REMIND_KIND } from '@/features/notifications/schedule';
import { t } from '@/i18n';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { ChatAction, ChatMessage } from './thread';

type Row = Database['public']['Tables']['chat_messages']['Row'];

const BUCKET = 'plant-photos';
const SIGNED_URL_SECONDS = 60 * 60;
const MAX_MESSAGES = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export const chatKey = (plantId: string) => ['chat', plantId] as const;

const toMessage = (row: Row): ChatMessage => ({
  id: row.id,
  role: row.role === 'assistant' ? 'assistant' : 'user',
  content: row.content,
  photoPath: row.photo_path,
  actions: Array.isArray(row.actions) ? (row.actions as ChatAction[]) : [],
  createdAt: new Date(row.created_at),
});
const toMessages = (rows: Row[]) => rows.map(toMessage);

/** Fil d'une plante, du plus ancien au plus récent (cache : lignes brutes, persistables). */
export function useChat(plantId: string) {
  return useQuery({
    queryKey: chatKey(plantId),
    select: toMessages,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: true })
        .limit(MAX_MESSAGES);
      if (error) throw error;
      return data;
    },
  });
}

/** Adresses temporaires des photos du fil (bucket privé). */
export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ['photo-urls', paths],
    enabled: paths.length > 0,
    staleTime: (SIGNED_URL_SECONDS / 2) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_SECONDS);
      if (error) throw error;
      return Object.fromEntries(data.map((d) => [d.path, d.signedUrl]));
    },
  });
}

export type SendInput = { text?: string; photo?: PickedPhoto; photoPath?: string };

/** Erreur d'envoi : quota du jour atteint, ou échec qu'on peut réessayer. */
export class ChatError extends Error {
  constructor(
    readonly kind: 'quota' | 'failed',
    /** Photo déjà envoyée dans Storage : « Réessayer » ne la renvoie pas. */
    readonly photoPath?: string,
  ) {
    super(kind);
  }
}

/** Envoi d'un message ; la photo est envoyée d'abord (une seule fois, même si on réessaie). */
export function useSendMessage(plantId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: SendInput): Promise<SendInput> => {
      let photoPath = input.photoPath;
      if (input.photo && !photoPath) {
        photoPath = await uploadPhoto(
          input.photo,
          `${userId}/${plantId}/chat/${Crypto.randomUUID()}.jpg`,
        );
      }
      const { error } = await supabase.functions.invoke('plant-chat', {
        body: { plantId, text: input.text, photoPath },
      });
      if (error) {
        const body =
          error instanceof FunctionsHttpError
            ? ((await error.context.json().catch(() => null)) as { error?: string } | null)
            : null;
        throw new ChatError(body?.error === 'quota' ? 'quota' : 'failed', photoPath);
      }
      return { ...input, photoPath };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKey(plantId) }),
  });
}

/** « Me rappeler dans N jours » : ligne `reminders` + notification locale (docs/06 F8). */
export async function createReminder(plant: { id: string; nickname: string }, days: number) {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) throw new Error('Pas de session.');
  const dueAt = new Date(Date.now() + days * DAY_MS);
  const message = t('chat.remindNotifBody');
  const { error } = await supabase
    .from('reminders')
    .insert({ user_id: userId, plant_id: plant.id, due_at: dueAt.toISOString(), message });
  if (error) throw error;
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync().catch(() => null);
  if (!permission?.granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t('chat.remindNotifTitle', { name: plant.nickname }),
      body: message,
      data: { kind: REMIND_KIND, plantId: plant.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueAt },
  });
}
