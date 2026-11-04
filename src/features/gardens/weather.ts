// Météo des jardins : cache journalier en base (garden_weather), rafraîchi par l'Edge Function
// garden-weather (Open-Meteo, sans clé). Sert à la date d'arrosage (wateringModel).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/authStore';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { dayKey, dryingFromWeather, type DailyWeather, type Drying } from '@/plants/wateringModel';

type WeatherRow = Database['public']['Tables']['garden_weather']['Row'];

/** Jours de météo gardés pour la normale du lieu et l'apprentissage. */
const HISTORY_DAYS = 45;
const REFRESH_EVERY_MS = 6 * 3_600_000;
const LAST_REFRESH_KEY = 'zeve-weather-refreshed-at';

export const weatherKey = (userId: string | undefined) => ['weather', userId] as const;

export type WeatherByGarden = Record<string, DailyWeather[]>;

/** Lignes de météo d'un utilisateur → météo par jardin (le cache garde les lignes brutes). */
export function groupWeather(rows: WeatherRow[]): WeatherByGarden {
  const out: WeatherByGarden = {};
  for (const r of rows) {
    (out[r.garden_id] ??= []).push({
      day: r.day,
      et0: r.et0_mm,
      tempMean: r.temp_mean,
      humidity: r.humidity_mean,
    });
  }
  return out;
}

export async function fetchWeatherRows(): Promise<WeatherRow[]> {
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000);
  const { data, error } = await supabase
    .from('garden_weather')
    .select('*')
    .gte('day', dayKey(since))
    .order('day', { ascending: true });
  if (error) throw error;
  return data;
}

export function useWeather() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: weatherKey(userId),
    enabled: !!userId,
    queryFn: fetchWeatherRows,
    select: groupWeather,
  });
}

/** Effet séchant par jardin, calculé une fois par jeu de données. */
export function dryingLookup(weather: WeatherByGarden | undefined) {
  const cache = new Map<string, Drying | null>();
  return (gardenId: string): Drying | null => {
    if (!cache.has(gardenId)) {
      const days = weather?.[gardenId];
      cache.set(gardenId, days ? dryingFromWeather(days) : null);
    }
    return cache.get(gardenId) ?? null;
  };
}

/**
 * Rafraîchit la météo des jardins au plus toutes les 6 h (au lancement de l'app connectée).
 * Hors ligne ou en échec : on garde le cache, la date d'arrosage retombe sur le rythme fixe.
 */
export function useWeatherRefresh(onRefreshed: () => void) {
  const client = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const last = Number((await AsyncStorage.getItem(LAST_REFRESH_KEY).catch(() => null)) ?? 0);
      if (Date.now() - last < REFRESH_EVERY_MS) return;
      const { error } = await supabase.functions.invoke('garden-weather', { body: {} });
      if (error || cancelled) return;
      await AsyncStorage.setItem(LAST_REFRESH_KEY, String(Date.now())).catch(() => null);
      await client.invalidateQueries({ queryKey: weatherKey(userId) });
      onRefreshed();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, client, onRefreshed]);
}
