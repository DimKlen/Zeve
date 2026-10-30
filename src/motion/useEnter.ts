// Animations d'apparition jouées par valeurs partagées plutôt que par `entering` (layout animations) :
// sur le web, Reanimated laisse les éléments animés par `entering` en position absolue, ce qui casse
// les piles d'éléments. Rendu identique à rise / pop de docs/03.
import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { duration, ease } from './index';

const RISE_FROM = 26;

/** rise : translateY 26 → 0 + opacité, 550 ms ease.screen, après `delayMs`. */
export function useRise(delayMs = 0) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    progress.set(
      withDelay(delayMs, withTiming(1, { duration: duration.rise, easing: ease.screen })),
    );
  }, [delayMs, reduced, progress]);
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * RISE_FROM }],
  }));
}

/**
 * pop : scale .9 → 1.05 (60 %) → 1, 500 ms ease-out.
 * Joué quand `trigger` change, et au montage si `onMount`.
 */
export function usePop(trigger: unknown, onMount = false) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    const skip = first.current && !onMount;
    first.current = false;
    if (skip || reduced) return;
    scale.set(
      withSequence(
        withTiming(0.9, { duration: 0 }),
        withTiming(1.05, { duration: duration.pop * 0.6, easing: ease.out }),
        withTiming(1, { duration: duration.pop * 0.4, easing: ease.out }),
      ),
    );
  }, [trigger, onMount, reduced, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
