// Données du jardin (docs/07 : vue plant_overview) et arrosage optimiste (docs/06 F4).
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { showToast } from '@/components/Toast';
import { useAuthStore } from '@/features/auth/authStore';
import { dryingLookup, useWeather } from '@/features/gardens/weather';
import { rescheduleReminders } from '@/features/notifications/schedule';
import { t } from '@/i18n';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { normalizePot } from '@/plants/pots';
import type { WateringEvent } from '@/plants/wateringModel';

import type { GardenPlant } from './gardenRules';

type OverviewRow = Database['public']['Views']['plant_overview']['Row'];

const date = (value: string | null) => (value ? new Date(value) : null);

export function toGardenPlant(row: OverviewRow): GardenPlant {
  return {
    id: row.id!,
    nickname: row.nickname!,
    speciesId: row.species_id!,
    pot: normalizePot(row.pot),
    speciesName: row.species_name!,
    latin: row.latin!,
    lightLabel: row.light_label!,
    air: row.air!,
    tip: row.tip ?? '',
    createdAt: new Date(row.created_at!),
    waterEveryDays: row.water_every_days!,
    lastWateredAt: date(row.last_watered_at),
    previousWateredAt: date(row.previous_watered_at),
    gardenId: row.garden_id!,
    gardenName: row.garden_name ?? '',
    gardenPlace: {
      latitude: row.garden_latitude,
      countryCode: row.garden_country_code,
      country: row.garden_country,
      city: row.garden_city,
    },
    history: parseHistory(row.watering_history),
    learnedEveryDays: row.learned_every_days,
    declined:
      row.suggestion_declined_days !== null && row.suggestion_declined_count !== null
        ? { days: row.suggestion_declined_days, count: row.suggestion_declined_count }
        : null,
    drying: null,
  };
}

/** Historique de la vue ({ at, expected }[], plus récent d'abord) → arrosages typés. */
function parseHistory(value: OverviewRow['watering_history']): WateringEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const at = typeof item.at === 'string' ? new Date(item.at) : null;
    const expected = typeof item.expected === 'number' ? item.expected : null;
    return at ? [{ at, expectedDays: expected }] : [];
  });
}

export const wateringKey = (plantId: string) => ['watering', plantId] as const;

export const plantsKey = (userId: string | undefined) => ['plants', userId] as const;

// Le cache garde les lignes brutes (dates ISO) : il est persisté en JSON, où une Date ne survit pas.
async function fetchPlants(): Promise<OverviewRow[]> {
  const { data, error } = await supabase.from('plant_overview').select('*');
  if (error) throw error;
  return data;
}

const toGarden = (rows: OverviewRow[]) => rows.map(toGardenPlant);

/**
 * Toutes les plantes de l'utilisateur (le cache est persisté : affichage hors ligne), avec l'effet
 * de la météo de leur jardin : la date d'arrosage en tient compte partout (plantStatus).
 */
export function usePlants() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const query = useQuery({
    queryKey: plantsKey(userId),
    queryFn: fetchPlants,
    select: toGarden,
    enabled: !!userId,
  });
  const { data: weather } = useWeather();
  const data = useMemo(() => {
    if (!query.data) return query.data;
    const drying = dryingLookup(weather);
    return query.data.map((p) => ({ ...p, drying: drying(p.gardenId) }));
  }, [query.data, weather]);
  return { ...query, data };
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

// Arrosage hors ligne (docs/06 F12) : les mutations ont une clé et une fonction enregistrées une
// fois pour toutes ; sans réseau elles sont mises en pause, persistées avec le cache et rejouées
// au retour du réseau, même après un redémarrage. Les variables sont donc de simples valeurs JSON.
type WaterVars = {
  plantId: string;
  userId: string;
  nickname: string;
  wateredAt: string;
  /** Rythme attendu au moment de l'arrosage (apprentissage du rythme). */
  expectedDays?: number;
};
type UndoVars = { plantId: string; since: string };
const WATER_KEY = ['water'] as const;
const UNDO_KEY = ['unwater'] as const;

/** À appeler au démarrage, avant la reprise des mutations en pause. */
export function registerWateringMutations(client: QueryClient) {
  client.setMutationDefaults(WATER_KEY, {
    mutationFn: async ({ plantId, userId, wateredAt, expectedDays }: WaterVars) => {
      // L'heure du tap, pas celle de l'envoi : l'arrosage compte pour le bon jour.
      const { error } = await supabase.from('watering_events').insert({
        plant_id: plantId,
        user_id: userId,
        watered_at: wateredAt,
        expected_days: expectedDays ?? null,
      });
      if (error) throw error;
    },
  });
  client.setMutationDefaults(UNDO_KEY, {
    mutationFn: async ({ plantId, since }: UndoVars) => {
      // Un seul arrosage compté par jour : on retire ceux du jour du tap (docs/06 F4).
      const { error } = await supabase
        .from('watering_events')
        .delete()
        .eq('plant_id', plantId)
        .gte('watered_at', since);
      if (error) throw error;
    },
  });
}

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
  const rollback = (_e: unknown, _v: unknown, context: Context | undefined) => {
    if (context?.previous) queryClient.setQueryData(key, context.previous);
    showToast(t('toast.offline'));
  };
  // Le menu « Historique d'arrosage » garde sa propre requête : sans ce rafraîchissement, elle
  // restait sur la liste lue avant l'arrosage (vide pour une plante jamais arrosée).
  const settle = (_data: unknown, _error: unknown, vars: { plantId: string }) => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: wateringKey(vars.plantId) });
    void rescheduleReminders();
  };

  const water = useMutation<void, Error, WaterVars, Context>({
    mutationKey: WATER_KEY,
    onMutate: (vars) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(t('plant.thanksToast', { name: vars.nickname }));
      return optimistic(
        (row) => ({
          ...row,
          previous_watered_at: row.last_watered_at,
          last_watered_at: vars.wateredAt,
          watering_history: [
            { at: vars.wateredAt, expected: vars.expectedDays ?? null },
            ...(Array.isArray(row.watering_history) ? row.watering_history : []),
          ],
        }),
        vars.plantId,
      );
    },
    onError: rollback,
    onSettled: settle,
  });

  const undo = useMutation<void, Error, UndoVars, Context>({
    mutationKey: UNDO_KEY,
    onMutate: (vars) =>
      optimistic(
        (row) => ({
          ...row,
          last_watered_at: row.previous_watered_at,
          previous_watered_at: null,
          watering_history: (Array.isArray(row.watering_history)
            ? row.watering_history
            : []
          ).filter(
            (item) =>
              !item ||
              typeof item !== 'object' ||
              Array.isArray(item) ||
              typeof item.at !== 'string' ||
              new Date(item.at).getTime() < new Date(vars.since).getTime(),
          ),
        }),
        vars.plantId,
      ),
    onError: rollback,
    onSettled: settle,
  });

  return {
    water: (plant: GardenPlant) => {
      if (!userId) return;
      water.mutate({
        plantId: plant.id,
        userId,
        nickname: plant.nickname,
        wateredAt: new Date().toISOString(),
        expectedDays: plant.waterEveryDays,
      });
    },
    undo: (plant: GardenPlant) =>
      undo.mutate({ plantId: plant.id, since: startOfToday().toISOString() }),
  };
}
