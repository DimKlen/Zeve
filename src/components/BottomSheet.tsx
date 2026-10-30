import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { duration, ease } from '@/motion';
import { colors, radius, space } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

const OFFSCREEN = 600;

/** Feuille du bas (docs/02 §7) : voile en fondu 300 ms, feuille qui monte en 500 ms. */
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  // Ouverture : montée pendant le rendu ; la fermeture attend la fin de l'animation de sortie.
  if (visible && !mounted) setMounted(true);
  const dim = useSharedValue(0);
  const y = useSharedValue(OFFSCREEN);

  useEffect(() => {
    const ms = (value: number) => (reduced ? 0 : value);
    if (visible) {
      dim.set(withTiming(1, { duration: ms(duration.dim) }));
      y.set(withTiming(0, { duration: ms(duration.sheet), easing: ease.sheet }));
      return;
    }
    dim.set(withTiming(0, { duration: ms(duration.dim) }));
    y.set(withTiming(OFFSCREEN, { duration: ms(duration.dim), easing: ease.in }));
    // Démonté après l'animation de sortie (le Modal ne joue pas d'animation de sortie).
    const timer = setTimeout(() => setMounted(false), ms(duration.dim));
    return () => clearTimeout(timer);
  }, [visible, reduced, dim, y]);

  const overlay = useAnimatedStyle(() => ({ opacity: dim.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlay]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: insets.bottom + space.l }, sheet]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: space.l,
    paddingHorizontal: space.l,
  },
});
