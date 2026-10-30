import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { t } from '@/i18n';
import { duration, ease } from '@/motion';
import { colors, radius, space, type } from '@/theme';

/** Indicateur « l'assistant écrit » (docs/03 §5) : 3 points, décalés de 0.2 s. Mouvement réduit : « … ». */
export function TypingDots() {
  const reduced = useReducedMotion();
  return (
    <View
      style={styles.bubble}
      accessibilityRole="text"
      accessibilityLabel={t('chat.typingA11y')}
      accessibilityLiveRegion="polite"
    >
      {reduced ? (
        <Text style={styles.static}>…</Text>
      ) : (
        [0, 1, 2].map((i) => <Dot key={i} index={i} />)
      )}
    </View>
  );
}

function Dot({ index }: { index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      index * duration.typingStagger,
      withRepeat(withTiming(1, { duration: duration.typingDot, easing: ease.linear }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Cycle de 1.2 s : monte jusqu'à 30 %, redescend jusqu'à 60 %, repos jusqu'à 100 %.
    const k = p < 0.3 ? p / 0.3 : p < 0.6 ? 1 - (p - 0.3) / 0.3 : 0;
    return { opacity: 0.25 + 0.75 * k, transform: [{ translateY: -3 * k }] };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    paddingVertical: space.ml + 2,
    paddingHorizontal: space.l,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomLeftRadius: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkMuted },
  static: { ...type.bodyS, color: colors.inkMuted },
});
