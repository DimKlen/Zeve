// Lieu d'un jardin : position du téléphone (permission demandée au moment du besoin) ou saisie.
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { GardenPlace } from './api';

export type LocateResult =
  { status: 'ok'; place: GardenPlace } | { status: 'denied' } | { status: 'failed' };

/** Position actuelle → ville et pays (géocodage inverse du téléphone). */
export async function locateGarden(): Promise<LocateResult> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { status: 'denied' };
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    // Le web n'a pas de géocodage inverse sans clé : la ville reste à écrire.
    const [address] =
      Platform.OS === 'web' ? [] : await Location.reverseGeocodeAsync({ latitude, longitude });
    return {
      status: 'ok',
      place: {
        city: address?.city ?? address?.subregion ?? address?.region ?? '',
        country: address?.country ?? '',
        countryCode: address?.isoCountryCode?.toUpperCase() ?? null,
        latitude,
        longitude,
      },
    };
  } catch {
    return { status: 'failed' };
  }
}

/**
 * Lieu saisi à la main : coordonnées retrouvées si possible (saisons de l'hémisphère sud),
 * sans jamais bloquer l'enregistrement.
 */
export async function geocodePlace(city: string, country: string): Promise<GardenPlace> {
  const place: GardenPlace = { city, country, countryCode: null, latitude: null, longitude: null };
  const query = [city, country]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
  if (!query || Platform.OS === 'web') return place;
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) return place;
    const [hit] = await Location.geocodeAsync(query);
    return hit ? { ...place, latitude: hit.latitude, longitude: hit.longitude } : place;
  } catch {
    return place;
  }
}
