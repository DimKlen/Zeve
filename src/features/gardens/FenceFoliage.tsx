import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

import { ease } from '@/motion';
import { useColors } from '@/theme';

/** Feuille en goutte, pointe vers le haut, dans un repère local (base en 0,0). */
const LEAF = 'M0 0C2.2 -1.8 2.2 -4.6 0 -6.2C-2.2 -4.6 -2.2 -1.8 0 0Z';
const RAIL_MID = 5.5;
const FAR = 94.5;
const STEPS = [9, 17, 26, 35, 44, 53, 62, 71, 80, 88];
const SWAY_DEG = 1.1;
const SWAY_MS = 2600;

type Leaf = { x: number; y: number; rot: number; dark: boolean };

/** Feuillage déterministe le long des quatre côtés : un jardin garde toujours la même allure. */
const side = (at: (v: number) => [number, number], outward: number, seed: number): Leaf[] =>
  STEPS.flatMap((v, i) => {
    const [x, y] = at(v);
    const k = (i + seed) % 3;
    if (k === 2) return [];
    return [
      {
        x,
        y,
        rot: outward + (k === 0 ? -38 : 38) + ((i * 7 + seed * 5) % 17) - 8,
        dark: i % 2 === 0,
      },
      { x, y, rot: outward + (k === 0 ? 30 : -30) + ((i * 5) % 11) - 5, dark: i % 2 === 1 },
    ];
  });

const HORIZONTAL: Leaf[] = [...side((v) => [v, RAIL_MID], 0, 0), ...side((v) => [v, FAR], 180, 1)];
const VERTICAL: Leaf[] = [...side((v) => [RAIL_MID, v], -90, 2), ...side((v) => [FAR, v], 90, 0)];

/**
 * Feuillage qui court sur la clôture d'un jardin. Deux calques (haut/bas, gauche/droite) se
 * balancent en opposition de phase ; immobile si `active` est faux ou en mouvement réduit.
 */
function FenceFoliageBase({ size, active }: { size: number; active: boolean }) {
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(a);
      a.value = 0;
      return;
    }
    a.value = -1;
    a.value = withDelay(
      0,
      withRepeat(withTiming(1, { duration: SWAY_MS, easing: ease.inOut }), -1, true),
    );
    return () => cancelAnimation(a);
  }, [active, reduced, a]);
  const horizontal = useAnimatedStyle(() => ({
    transform: [{ rotate: `${a.value * SWAY_DEG}deg` }],
  }));
  const vertical = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-a.value * SWAY_DEG}deg` }],
  }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, horizontal]}>
        <Leaves size={size} leaves={HORIZONTAL} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, vertical]}>
        <Leaves size={size} leaves={VERTICAL} />
      </Animated.View>
    </>
  );
}

function Leaves({ size, leaves }: { size: number; leaves: Leaf[] }) {
  const colors = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {leaves.map((l, i) => (
          <Path
            key={i}
            d={LEAF}
            transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(1.15)`}
            fill={l.dark ? colors.fenceLeafDark : colors.fenceLeaf}
          />
        ))}
      </G>
    </Svg>
  );
}

export const FenceFoliage = memo(FenceFoliageBase);
