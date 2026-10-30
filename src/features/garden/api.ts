// Données du jardin (docs/07 : vue plant_overview) et arrosage optimiste (docs/06 F4).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { showToast } from '@/components/Toast';
import { useAuthStore } from '@/features/auth/authStore';
import { rescheduleReminders } from '@/features/notifications/schedule';
import { t } from '@/i18n';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { GardenPlant } from './gardenRules';

type OverviewRow = Database['public']['Views']['plant_overview']['Row'];

const date = (value: string | null) => (value ? new Date(value) : null);

export function toGardenPlant(row: OverviewRow): GardenPlant {
  return {
    id: row.id!,
    nickname: row.nickname!,
    speciesId: row.species_id!,
    speciesName: row.species_name!,
    latin: row.latin!,
    roomId: row.room_id,
    roomName: row.room_name,
    light: row.light!,
    lightLabel: row.light_label!,
    air: row.air!,
    tip: row.tip ?? '',
    createdAt: new Date(row.created_at!),
    waterEveryDays: row.water_every_days!,
    lastWateredAt: date(row.last_watered_at),
    previousWateredAt: date(row.previous_watered_at),
  };
}

export const plantsKey = (userId: string | undefined) => ['plants', userId] as const;

// Le cache garde les lignes brutes (dates ISO) : il est persisté en JSON, où une Date ne survit pas.
async function fetchPlants(): Promise<OverviewRow[]> {
  const { data, error } = await supabase.from('plant_overview').select('*');
  if (error) throw error;
  return data;
}

const toGarden = (rows: OverviewRow[]) => rows.map(toGardenPlant);

/** Toutes les plantes de l'utilisateur (le cache est persisté : affichage hors ligne). */
export function usePlants() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: plantsKey(userId),
    queryFn: fetchPlants,
    select: toGarden,
    enabled: !!userId,
  });
}

/** Une plante, lue dans la liste du jardin (mêmes données optimistes partout). */
export function usePlant(id: string | undefined) {
  const query = usePlants();
  return { ...query, data: query.data?.find((p) => p.id === id) };
}

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

type Vars = { plant: GardenPlant };
type Context = { previous: OverviewRow[] | undefined };

/** Arroser / annuler l'arrosage du jour, avec mise à jour immédiate et retour arrière si échec. */
export function useWatering() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const key = plantsKey(userId);

  const optimistic = async (update: (row: OverviewRow) => OverviewRow, plantId: string) => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<OverviewRow[]>(key);
    queryClient.setQueryData<OverviewRow[]>(key, (rows) =>
      rows?.map((row) => (row.id === plantId ? update(row) : row)),
    );
    return { previous };
  };
  const rollback = (_e: unknown, _v: Vars, context: Context | undefined) => {
    if (context?.previous) queryClient.setQueryData(key, context.previous);
    showToast(t('toast.offline'));
  };
  const settle = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void rescheduleReminders();
  };

  const water = useMutation<void, Error, Vars, Context>({
    mutationFn: async ({ plant }) => {
      const { error } = await supabase
        .from('watering_events')
        .insert({ plant_id: plant.id, user_id: userId! });
      if (error) throw error;
    },
    onMutate: ({ plant }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(t('plant.thanksToast', { name: plant.nickname }));
      return optimistic(
        (row) => ({
          ...row,
          previous_watered_at: row.last_watered_at,
          last_watered_at: new Date().toISOString(),
        }),
        plant.id,
      );
    },
    onError: rollback,
    onSettled: settle,
  });

  const undo = useMutation<void, Error, Vars, Context>({
    mutationFn: async ({ plant }) => {
      // Un seul arrosage compté par jour : on retire ceux d'aujourd'hui (docs/06 F4).
      const { error } = await supabase
        .from('watering_events')
        .delete()
        .eq('plant_id', plant.id)
        .gte('watered_at', startOfToday().toISOString());
      if (error) throw error;
    },
    onMutate: ({ plant }) =>
      optimistic(
        (row) => ({ ...row, last_watered_at: row.previous_watered_at, previous_watered_at: null }),
        plant.id,
      ),
    onError: rollback,
    onSettled: settle,
  });

  return {
    water: (plant: GardenPlant) => water.mutate({ plant }),
    undo: (plant: GardenPlant) => undo.mutate({ plant }),
  };
}
