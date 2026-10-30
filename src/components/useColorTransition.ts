import { useEffect } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ease } from '@/motion';

/** Couleur animée vers `color` en `ms` (chips, choix de lumière, onglets, interrupteur). */
export function useColorTransition(color: string, ms: number): SharedValue<string> {
  const reduced = useReducedMotion();
  const value = useSharedValue(color);
  useEffect(() => {
    value.value = reduced ? color : withTiming(color, { duration: ms, easing: ease.inOut });
  }, [color, ms, reduced, value]);
  return value;
}
