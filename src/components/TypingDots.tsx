import { useEffect } from 'react';
import { Text, View } from 'react-native';
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
import { makeStyles, radius, space, type, useColors } from '@/theme';

/** Indicateur « l'assistant écrit » (docs/03 §5) : 3 points, décalés de 0.2 s. Mouvement réduit : « … ». */
export function TypingDots() {
  const styles = useStyles();
  return (
    <View
      style={styles.bubble}
      accessibilityRole="text"
      accessibilityLabel={t('chat.typingA11y')}
      accessibilityLiveRegion="polite"
    >
      <Dots />
    </View>
  );
}

/** Les 3 points animés seuls (aussi dans un bouton en cours d'enregistrement). */
export function Dots({ color: colorProp }: { color?: string }) {
  const colors = useColors();
  const color = colorProp ?? colors.inkMuted;
  const styles = useStyles();
  const reduced = useReducedMotion();
  if (reduced) return <Text style={[styles.static, { color }]}>…</Text>;
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} color={color} />
      ))}
    </View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const styles = useStyles();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        index * duration.typingStagger,
        withRepeat(withTiming(1, { duration: duration.typingDot, easing: ease.linear }), -1, false),
      ),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // Cycle de 1.2 s : monte jusqu'à 30 %, redescend jusqu'à 60 %, repos jusqu'à 100 %.
    const k = p < 0.3 ? p / 0.3 : p < 0.6 ? 1 - (p - 0.3) / 0.3 : 0;
    return { opacity: 0.25 + 0.75 * k, transform: [{ translateY: -3 * k }] };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const useStyles = makeStyles((colors) => ({
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
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  static: { ...type.bodyS, color: colors.inkMuted },
}));
