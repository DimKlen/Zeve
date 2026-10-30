// Mutations de la fiche plante (menu « … », docs/04 §8) et données associées.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/authStore';
import { plantsKey } from '@/features/garden/api';
import { rescheduleReminders } from '@/features/notifications/schedule';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type PlantUpdate = Pick<
  Database['public']['Tables']['plants']['Update'],
  'nickname' | 'room_id' | 'water_every_days' | 'archived_at'
>;

export type Room = { id: string; name: string };

/** Pièces de l'utilisateur, dans l'ordre choisi. */
export function useRooms() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['rooms', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name')
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Derniers arrosages d'une plante (historique du menu). */
export function useWateringHistory(plantId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['watering', plantId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watering_events')
        .select('id, watered_at')
        .eq('plant_id', plantId)
        .order('watered_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data.map((row) => ({ id: row.id, wateredAt: new Date(row.watered_at) }));
    },
  });
}

/** Renommer, changer de pièce, de rythme ou archiver (= supprimer du jardin). */
export function useUpdatePlant() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async ({ plantId, update }: { plantId: string; update: PlantUpdate }) => {
      const { error } = await supabase.from('plants').update(update).eq('id', plantId);
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: plantsKey(userId) });
      void rescheduleReminders();
    },
  });
}
