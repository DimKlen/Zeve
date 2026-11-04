import { Stack } from 'expo-router';

import { makeStyles } from '@/theme';

// Parcours d'ajout ouvert en modale depuis le + du jardin ; brouillon Zustand partagé (Phase 4).
export default function NewPlantLayout() {
  const styles = useStyles();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: styles.screen }} />
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { backgroundColor: colors.bg },
}));
