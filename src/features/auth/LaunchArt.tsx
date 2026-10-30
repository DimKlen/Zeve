import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { ease, splashTimings } from '@/motion';
import { colors } from '@/theme';

const APath = Animated.createAnimatedComponent(Path);

// Illustration du lancement (docs/04 §1), repère 120×130.
const W = 120;
const H = 130;
const STEM = 'M60 124 C60 100 58 76 60 40';
const STEM_LENGTH = 140; // stroke-dasharray du prototype
const LEAF_L = 'M60 84 C40 84 26 72 22 52 C42 52 58 64 60 84 Z';
const LEAF_R = 'M60 66 C80 65 94 52 97 32 C77 32 62 45 60 66 Z';
const LEAF_MS = 550;

// Chaque élément pousse depuis sa base : coin bas-droit de la feuille gauche (60,84),
// coin bas-gauche de la droite (60,66), centre du bourgeon (60,30).
const origin = (x: number, y: number) => `${(x / W) * 100}% ${(y / H) * 100}%`;

/** Tige qui se dessine, feuilles qui poussent, bourgeon (docs/03 §6). */
export function LaunchArt() {
  const reduced = useReducedMotion();
  const stem = useSharedValue(reduced ? 0 : STEM_LENGTH);
  const leafL = useSharedValue(reduced ? 1 : 0);
  const leafR = useSharedValue(reduced ? 1 : 0);
  const bud = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const grow = (delay: number) =>
      withDelay(delay, withTiming(1, { duration: LEAF_MS, easing: ease.overshoot }));
    stem.set(
      withDelay(
        splashTimings.stemDelay,
        withTiming(0, { duration: splashTimings.stem, easing: ease.out }),
      ),
    );
    leafL.set(grow(splashTimings.leafL));
    leafR.set(grow(splashTimings.leafR));
    bud.set(grow(splashTimings.bud));
  }, [reduced, stem, leafL, leafR, bud]);

  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: stem.value }));
  const leafLStyle = useAnimatedStyle(() => ({ transform: [{ scale: leafL.value }] }));
  const leafRStyle = useAnimatedStyle(() => ({ transform: [{ scale: leafR.value }] }));
  const budStyle = useAnimatedStyle(() => ({ transform: [{ scale: bud.value }] }));

  return (
    <View
      style={styles.box}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        <APath
          d={STEM}
          stroke={colors.splashStem}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={STEM_LENGTH}
          animatedProps={stemProps}
        />
      </Svg>
      <Layer style={[styles.leafL, leafLStyle]}>
        <Path d={LEAF_L} fill={colors.splashLeaf} />
      </Layer>
      <Layer style={[styles.leafR, leafRStyle]}>
        <Path d={LEAF_R} fill={colors.splashStem} />
      </Layer>
      <Layer style={[styles.bud, budStyle]}>
        <Circle cx={60} cy={30} r={8} fill={colors.sun} />
      </Layer>
    </View>
  );
}

function Layer({
  style,
  children,
}: {
  style: React.ComponentProps<typeof Animated.View>['style'];
  children: React.ReactNode;
}) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { width: W, height: H },
  leafL: { transformOrigin: origin(60, 84) },
  leafR: { transformOrigin: origin(60, 66) },
  bud: { transformOrigin: origin(60, 30) },
});
