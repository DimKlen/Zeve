import { Stack } from 'expo-router';

// Redirection vers (app) si une session existe : Phase 2 (docs/05).
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
