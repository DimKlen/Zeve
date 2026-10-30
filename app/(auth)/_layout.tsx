import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuthStore } from '@/features/auth/authStore';

// Déjà connecté sur Connexion (session restaurée, retour arrière…) : direction l'app, dont la garde
// choisit Jardin ou onboarding. « Connexion en cours » reste affiché pendant qu'il termine son travail.
export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  const pending = useAuthStore((s) => s.pending);
  const pathname = usePathname();
  if (session && !pending && pathname === '/login') return <Redirect href="/garden" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
