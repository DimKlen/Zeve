// Réglages (docs/06 F10) : préférences du profil, pièces, export des données, suppression du compte.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform, Share } from 'react-native';

import { useAuthStore } from '@/features/auth/authStore';
import { profileKey, type Profile } from '@/features/auth/profile';
import { plantsKey } from '@/features/garden/api';
import { cancelAllReminders, rescheduleReminders } from '@/features/notifications/schedule';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

type ProfilePatch = Partial<Pick<Profile, 'reminders_enabled' | 'reminder_time'>>;

/** Rappels et heure : mise à jour immédiate, puis recalcul des notifications. */
export function useUpdateProfile() {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const key = profileKey(userId);
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId!);
      if (error) throw error;
    },
    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Profile>(key);
      if (previous) client.setQueryData<Profile>(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, _patch, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
      void rescheduleReminders();
    },
  });
}

/** Pièces (écran « Mes pièces », non maquetté) : renommer, supprimer. */
export function useRoomMutations() {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['rooms', userId] });
    void client.invalidateQueries({ queryKey: plantsKey(userId) });
  };
  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('rooms').update({ name: name.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Les plantes de la pièce gardent leur place au jardin (room_id → null, docs/07).
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: refresh,
  });
  return { rename, remove };
}

/** Export JSON de toutes les données de l'utilisateur (confidentialité, docs/06 F10). */
export async function exportMyData(): Promise<void> {
  const tables = [
    'profiles',
    'rooms',
    'plants',
    'watering_events',
    'chat_messages',
    'reminders',
  ] as const;
  const results = await Promise.all(tables.map((table) => supabase.from(table).select('*')));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  const data = Object.fromEntries(tables.map((table, i) => [table, results[i]!.data]));
  const json = JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2);
  const name = `zeve-export-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: name, message: json });
}

/** Suppression du compte (obligatoire App Store) : Edge Function delete-account, puis déconnexion. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
  await cancelAllReminders();
  await supabase.auth.signOut();
  queryClient.clear();
}
