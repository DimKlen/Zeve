import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, ease } from '@/motion';
import { colors } from '@/theme';

type Props = {
  /** Niveau d'eau 0..1 (plantStatus.waterLevel). */
  level: number;
};

/** Jauge d'eau (docs/02 §7) : piste h 8 r 4, remplissage animé en 800 ms. */
export function WaterGauge({ level }: Props) {
  const reduced = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, level));
  const width = useSharedValue(clamped * 100);
  useEffect(() => {
    const to = clamped * 100;
    width.value = reduced ? to : withTiming(to, { duration: duration.gauge, easing: ease.screen });
  }, [clamped, reduced, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.water },
});
