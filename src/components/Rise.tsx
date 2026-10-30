import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { riseDelay } from '@/motion';
import { useRise } from '@/motion/useEnter';

type Props = {
  children: ReactNode;
  /** Cascade de docs/03 §3 : d0 (sans délai) à d6. */
  delay?: keyof typeof riseDelay;
  style?: StyleProp<ViewStyle>;
};

/** Apparition d'un élément : translateY 26 → 0 + opacité, 550 ms, avec retard en cascade. */
export function Rise({ children, delay = 'd0', style }: Props) {
  const rise = useRise(riseDelay[delay]);
  return <Animated.View style={[style, rise]}>{children}</Animated.View>;
}
