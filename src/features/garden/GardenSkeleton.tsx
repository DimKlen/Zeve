import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { t } from '@/i18n';
import { ease } from '@/motion';
import { colors, radius, space } from '@/theme';

const PULSE_MS = 600; // .6 ↔ 1 sur 1.2 s aller-retour

/** Chargement (non maquetté, docs/04 §7) : squelettes des cartes avec pulsation d'opacité. */
export function GardenSkeleton() {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    opacity.set(withRepeat(withTiming(0.6, { duration: PULSE_MS, easing: ease.inOut }), -1, true));
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.grid, pulse]}
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
    >
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.well} />
          <View style={[styles.line, styles.lineLong]} />
          <View style={[styles.line, styles.lineShort]} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.m },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingTop: space.m,
    paddingHorizontal: space.ml,
    paddingBottom: space.ml,
    gap: space.s,
  },
  well: { height: 104, borderRadius: radius.md, backgroundColor: colors.well },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.track },
  lineLong: { width: '70%' },
  lineShort: { width: '45%' },
});
