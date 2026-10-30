import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Stockage de la session Supabase (docs/08) : trousseau iOS / Keystore Android via SecureStore.
// SecureStore limite chaque valeur à ~2 Ko et une session en fait davantage : on la découpe.
// Sur le web (pas de SecureStore), AsyncStorage = localStorage.

const CHUNK = 1800;
const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;

/** Les clés SecureStore n'acceptent que [A-Za-z0-9._-]. */
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

async function getChunked(key: string): Promise<string | null> {
  const k = safe(key);
  const count = Number(await SecureStore.getItemAsync(countKey(k)));
  if (!count) return null;
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(k, i))),
  );
  if (parts.some((p) => p === null)) return null;
  return parts.join('');
}

async function removeChunked(key: string): Promise<void> {
  const k = safe(key);
  const count = Number(await SecureStore.getItemAsync(countKey(k)));
  await Promise.all(
    Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(chunkKey(k, i))),
  );
  await SecureStore.deleteItemAsync(countKey(k));
}

async function setChunked(key: string, value: string): Promise<void> {
  await removeChunked(key);
  const k = safe(key);
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK) parts.push(value.slice(i, i + CHUNK));
  await Promise.all(parts.map((part, i) => SecureStore.setItemAsync(chunkKey(k, i), part)));
  await SecureStore.setItemAsync(countKey(k), String(parts.length));
}

export const sessionStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      }
    : { getItem: getChunked, setItem: setChunked, removeItem: removeChunked };
