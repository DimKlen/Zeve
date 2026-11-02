// Jardins (lieux) : lecture, renommage, lieu, suppression, déplacement d'une plante.
// La base garantit qu'un jardin n'est jamais vide (migration 0006) : supprimer un jardin revient à
// retirer ses plantes, et il disparaît avec la dernière.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/authStore';
import { plantsKey } from '@/features/garden/api';
import { rescheduleReminders } from '@/features/notifications/schedule';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { Garden } from './gardenRules';

type GardenRow = Database['public']['Tables']['gardens']['Row'];

export const gardensKey = (userId: string | undefined) => ['gardens', userId] as const;

export const toGarden = (row: GardenRow): Garden => ({
  id: row.id,
  name: row.name,
  city: row.city,
  country: row.country,
  countryCode: row.country_code,
  latitude: row.latitude,
  longitude: row.longitude,
  createdAt: new Date(row.created_at),
});

/** Lieu d'un jardin (création ou modification). */
export type GardenPlace = {
  city: string;
  country: string;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

// Cache persisté en lignes brutes (dates ISO), comme les plantes.
export function useGardens() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: gardensKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<GardenRow[]> => {
      const { data, error } = await supabase
        .from('gardens')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    select: (rows) => rows.map(toGarden),
  });
}

/** Rafraîchit tout ce qui dépend des jardins. */
export function useRefreshGardens() {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return () => {
    void client.invalidateQueries({ queryKey: gardensKey(userId) });
    void client.invalidateQueries({ queryKey: plantsKey(userId) });
    void client.invalidateQueries({ queryKey: ['rooms', userId] });
  };
}

export function useUpdateGarden() {
  const refresh = useRefreshGardens();
  return useMutation({
    mutationFn: async ({ id, name, place }: { id: string; name?: string; place?: GardenPlace }) => {
      const { error } = await supabase
        .from('gardens')
        .update({
          ...(name !== undefined && { name: name.trim() }),
          ...(place && {
            city: place.city.trim() || null,
            country: place.country.trim() || null,
            country_code: place.countryCode,
            latitude: place.latitude,
            longitude: place.longitude,
          }),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSettled: refresh,
  });
}

/** Supprimer un jardin = retirer toutes ses plantes ; la base supprime le jardin vide. */
export function useDeleteGarden() {
  const refresh = useRefreshGardens();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plants')
        .update({ archived_at: new Date().toISOString() })
        .eq('garden_id', id)
        .is('archived_at', null);
      if (error) throw error;
    },
    onSettled: () => {
      refresh();
      void rescheduleReminders();
    },
  });
}

/**
 * Déplace une plante vers un autre jardin. Sa pièce suit si le jardin d'arrivée en a une du même
 * nom, sinon elle reste sans pièce. Le jardin de départ disparaît s'il était sa dernière plante.
 */
export function useMovePlant() {
  const refresh = useRefreshGardens();
  return useMutation({
    mutationFn: async ({
      plantId,
      gardenId,
      roomName,
    }: {
      plantId: string;
      gardenId: string;
      roomName: string | null;
    }) => {
      let roomId: string | null = null;
      if (roomName) {
        const { data } = await supabase
          .from('rooms')
          .select('id')
          .eq('garden_id', gardenId)
          .eq('name', roomName)
          .maybeSingle();
        roomId = data?.id ?? null;
      }
      const { error } = await supabase
        .from('plants')
        .update({ garden_id: gardenId, room_id: roomId })
        .eq('id', plantId);
      if (error) throw error;
    },
    onSettled: refresh,
  });
}
