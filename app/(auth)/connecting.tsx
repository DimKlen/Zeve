import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { isNetworkError } from '@/features/auth/auth';
import { takePendingSignIn, useAuthStore, type Provider } from '@/features/auth/authStore';
import { fetchProfile, profileKey } from '@/features/auth/profile';
import { nextRoute } from '@/features/auth/rules';
import { t } from '@/i18n';
import { queryClient } from '@/lib/queryClient';
import { duration, ease, flowTimings } from '@/motion';
import { go } from '@/motion/transitions';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { makeStyles, space, type, useColors } from '@/theme';

const PROVIDER_NAME: Record<Provider, string> = {
  google: 'Google',
  apple: 'Apple',
  email: t('connecting.providerEmail'),
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connexion en cours (docs/04 §5) : termine la connexion commencée sur Connexion (ou par le lien
 * magique), charge le profil, puis Bienvenue · rappels ou Jardin. Minimum 1.8 s à l'écran.
 */
export default function ConnectingScreen() {
  const styles = useStyles();
  const [provider] = useState<Provider>(() => useAuthStore.getState().pending?.provider ?? 'email');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const pending = takePendingSignIn();
    void (async () => {
      try {
        await Promise.all([pending?.finish(), wait(flowTimings.connectingMin)]);
        const session = useAuthStore.getState().session;
        const userId = session?.user.id;
        if (!userId) throw new Error('Pas de session après la connexion.');
        const profile = await queryClient.fetchQuery({
          queryKey: profileKey(userId),
          queryFn: () => fetchProfile(userId),
        });
        go(nextRoute(true, profile), { replace: true });
      } catch (e) {
        showToast(isNetworkError(e) ? t('toast.offline') : t('connecting.failed'));
        go('login', { replace: true, anim: 'back' });
      }
    })();
  }, []);

  return (
    <Screen name="connecting">
      <View style={styles.center}>
        <View style={styles.disc}>
          <Ring />
          <PlantAvatar speciesId="monstera" stage={3} size={120} face="simple" bob />
        </View>
        <View style={styles.texts} accessibilityRole="text" accessibilityLiveRegion="polite">
          <Text style={styles.title}>
            {t('connecting.title', { provider: PROVIDER_NAME[provider] })}
          </Text>
          <Text style={styles.subtitle}>{t('connecting.subtitle')}</Text>
        </View>
      </View>
    </Screen>
  );
}

const DISC = 200;

/** Disque sauge r 90 + anneau pointillé r 96 qui tourne (spin 1.1 s). */
function Ring() {
  const colors = useColors();
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    rotation.set(
      withRepeat(withTiming(360, { duration: duration.spin, easing: ease.linear }), -1, false),
    );
    return () => cancelAnimation(rotation);
  }, [reduced, rotation]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <>
      <Svg width={DISC} height={DISC} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        <Circle cx={100} cy={100} r={90} fill={colors.sage} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, spin]}>
        <Svg width={DISC} height={DISC} viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={96}
            fill="none"
            stroke={colors.forest}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray="120 484"
          />
        </Svg>
      </Animated.View>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.x3 },
  disc: { width: DISC, height: DISC, alignItems: 'center', justifyContent: 'center' },
  texts: { alignItems: 'center', gap: space.xs },
  title: { ...type.subTitle, color: colors.forest, textAlign: 'center' },
  subtitle: { ...type.bodyS, color: colors.inkMuted, textAlign: 'center' },
}));
