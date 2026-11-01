import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/features/auth/authStore';
import { LaunchArt } from '@/features/auth/LaunchArt';
import { fetchProfile, profileKey, type Profile } from '@/features/auth/profile';
import { nextRoute } from '@/features/auth/rules';
import { t } from '@/i18n';
import { queryClient } from '@/lib/queryClient';
import { splashTimings } from '@/motion';
import { go } from '@/motion/transitions';
import { a11y, makeStyles, space, type } from '@/theme';

/**
 * Lancement (docs/04 §1) : séquence animée de 2.6 s pendant la restauration de session,
 * puis Connexion, Bienvenue · rappels ou Jardin (fade). Notification d'ouverture : Phase 6.
 */
export default function LaunchScreen() {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const ready = useAuthStore((s) => s.ready);
  const session = useAuthStore((s) => s.session);
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), reduced ? 0 : splashTimings.autoAdvance);
    return () => clearTimeout(timer);
  }, [reduced]);

  useEffect(() => {
    if (!ready || !elapsed) return;
    let cancelled = false;
    void (async () => {
      let profile: Profile | null = null;
      if (session) {
        const key = profileKey(session.user.id);
        try {
          profile = await queryClient.fetchQuery({
            queryKey: key,
            queryFn: () => fetchProfile(session.user.id),
          });
        } catch {
          // Hors ligne : le profil en cache (s'il existe) suffit pour choisir l'écran.
          profile = queryClient.getQueryData<Profile | null>(key) ?? null;
        }
      }
      if (!cancelled) go(nextRoute(!!session, profile), { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, elapsed, session]);

  return (
    <Screen name="launch" tone="dark">
      <View style={styles.center}>
        <LaunchArt />
        <Rise delay="d5">
          <Text
            style={styles.word}
            accessibilityRole="header"
            maxFontSizeMultiplier={a11y.maxTitleScale}
          >
            {t('app.name')}
          </Text>
        </Rise>
        <Rise delay="d6">
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </Rise>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.l },
  word: { ...type.splash, color: colors.darkText },
  tagline: { ...type.body, color: colors.darkMuted },
}));
