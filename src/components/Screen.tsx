import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { duration, ease, type ScreenAnim } from '@/motion';
import { setCurrentScreen, takePendingAnim, type ScreenKey } from '@/motion/transitions';
import { colors } from '@/theme';

type Props = {
  /** Identifiant de l'écran pour la table des transitions (docs/03 §2). */
  name?: ScreenKey;
  children?: ReactNode;
  /** Fond : crème par défaut, forêt pour Lancement / Plante ajoutée. */
  tone?: 'light' | 'dark';
  /** Entrée au premier affichage si aucune navigation `go()` ne l'a fixée. */
  enter?: ScreenAnim;
  /** Entrée quand l'écran reprend le focus sans `go()` (geste retour iOS, bouton Android, onglet). */
  refocusEnter?: ScreenAnim;
  /** Zones sûres appliquées en padding (les écrans à en-tête maison gèrent le haut eux-mêmes). */
  edges?: ('top' | 'bottom')[];
  style?: StyleProp<ViewStyle>;
};

// Valeurs de départ de chaque entrée (docs/03 §2) ; toutes finissent à l'état neutre.
const FROM: Record<ScreenAnim, { opacity: number; x: number; y: number; scale: number }> = {
  fwd: { opacity: 0, x: 60, y: 0, scale: 1 },
  back: { opacity: 0, x: -60, y: 0, scale: 1 },
  up: { opacity: 0, x: 0, y: 90, scale: 1 },
  fade: { opacity: 0, x: 0, y: 0, scale: 1 },
  zoom: { opacity: 0, x: 0, y: 0, scale: 0.92 },
};

/** Conteneur racine de chaque écran : fond, zones sûres et animation d'entrée. */
export function Screen({
  name,
  children,
  tone = 'light',
  enter = 'fade',
  refocusEnter = 'back',
  edges = ['top', 'bottom'],
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const firstFocus = useRef(true);
  const opacity = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      if (name) setCurrentScreen(name);
      const anim = takePendingAnim() ?? (firstFocus.current ? enter : refocusEnter);
      firstFocus.current = false;
      if (reduced) return;
      const from = FROM[anim];
      const config = {
        duration: anim === 'fwd' || anim === 'back' ? duration.screen : duration.screenUp,
        easing: anim === 'fade' ? ease.inOut : ease.screen,
      };
      opacity.set(from.opacity);
      x.set(from.x);
      y.set(from.y);
      scale.set(from.scale);
      opacity.set(withTiming(1, config));
      x.set(withTiming(0, config));
      y.set(withTiming(0, config));
      scale.set(withTiming(1, config));
    }, [name, enter, refocusEnter, reduced, opacity, x, y, scale]),
  );

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.root,
        tone === 'dark' && styles.dark,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        },
        animated,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  dark: { backgroundColor: colors.forest },
});
