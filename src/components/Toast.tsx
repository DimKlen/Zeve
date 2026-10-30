import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { duration, toastEnter } from '@/motion';
import { colors, layout, radius, shadow, space, type } from '@/theme';

import { IconCheck } from './icons';

type ToastState = {
  message: string | null;
  /** Change à chaque toast : un nouveau message remplace l'ancien et relance l'animation. */
  key: number;
  show: (message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) => set((s) => ({ message, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

/** Affiche un toast (un seul à la fois, visible 2.6 s). */
export const showToast = (message: string) => useToastStore.getState().show(message);

/** Hôte des toasts, monté une fois dans le layout racine (docs/02 §7). */
export function ToastHost() {
  const { message, key, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, duration.toastVisible);
    return () => clearTimeout(timer);
  }, [message, key, hide]);

  if (!message) return null;
  return (
    <Animated.View
      key={key}
      entering={reduced ? undefined : toastEnter}
      exiting={reduced ? undefined : FadeOut.duration(duration.toastOut)}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.toast, shadow.toast, { top: insets.top + space.s }]}
    >
      <IconCheck size={18} color={colors.sun} strokeWidth={2.4} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: layout.screenPadTabs,
    right: layout.screenPadTabs,
    minHeight: 48,
    borderRadius: radius.section,
    paddingVertical: space.m,
    paddingHorizontal: space.ml + 2,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    zIndex: 100,
  },
  text: { ...type.buttonS, color: colors.bg, flexShrink: 1 },
});
