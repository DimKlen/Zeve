import { Stack } from 'expo-router';

// Parcours d'ajout ouvert en modale depuis le + du jardin ; brouillon Zustand partagé (Phase 4).
export default function NewPlantLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
