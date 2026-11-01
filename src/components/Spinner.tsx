import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { t } from '@/i18n';
import { duration, ease } from '@/motion';
import { space, type, useColors } from '@/theme';

import { IconSpinner } from './icons';

type Props = { size?: number; color?: string };

/** Arc de chargement qui tourne (spin 1.1 s linéaire). Mouvement réduit : arc fixe + « Chargement… ». */
export function Spinner({ size = 30, color: colorProp }: Props) {
  const colors = useColors();
  const color = colorProp ?? colors.forest;
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: duration.spin, easing: ease.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [reduced, rotation]);

  const animated = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={animated}>
        <IconSpinner size={size} color={color} />
      </Animated.View>
      {reduced && <Text style={[styles.label, { color }]}>{t('common.loading')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  label: { ...type.small },
});
