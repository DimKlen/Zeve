import { Stack } from 'expo-router';

// Garde « session obligatoire, onboarding fait » : Phase 2 (docs/05).
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-plant" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
