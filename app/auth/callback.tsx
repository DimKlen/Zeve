import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { finishFromUrl } from '@/features/auth/auth';
import { claimCode, useAuthStore } from '@/features/auth/authStore';
import { parseAuthCallback } from '@/features/auth/rules';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';

/**
 * Lien profond `zeve://auth/callback` (OAuth et lien magique, docs/05) : confie l'échange du code
 * à « Connexion en cours ». Écran vide, remplacé aussitôt.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>();
  const url = Linking.useURL();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    // URL complète si c'est bien ce lien (le fragment des jetons n'arrive pas dans les params),
    // sinon les paramètres de la route (web, ouverture à froid).
    const fromParams = `zeve://auth/callback?${new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => typeof e[1] === 'string'),
    ).toString()}`;
    const source = url?.includes('auth/callback') ? url : fromParams;
    const parsed = parseAuthCallback(source);
    if (!parsed.code && !parsed.accessToken && !parsed.error) return;
    handled.current = true;

    if (parsed.error) {
      showToast(t(parsed.error === 'access_denied' ? 'toast.loginCancelled' : 'connecting.failed'));
      go('login', { replace: true, anim: 'back' });
      return;
    }
    if (parsed.code && !claimCode(parsed.code)) {
      // Déjà traité par WebBrowser (retour OAuth) : cet écran a seulement été empilé en trop.
      if (router.canGoBack()) router.back();
      return;
    }
    // Un lien profond qui arrive seul vient du lien magique (l'OAuth repasse par WebBrowser).
    useAuthStore.getState().setPending({ provider: 'email', finish: () => finishFromUrl(source) });
    go('connecting', { replace: true, anim: 'fade' });
  }, [params, url]);

  return <Screen />;
}
