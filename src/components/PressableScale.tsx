import type { ComponentProps, ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, ease, pressScale } from '@/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Style du conteneur animé (fond, taille, rayon…) ; accepte les styles Reanimated. */
  style?: ComponentProps<typeof Animated.View>['style'];
};

/** Élément tappable avec l'animation « press » : scale .96 au toucher, 150 ms (docs/03 §4). */
export function PressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const to = (value: number) => {
    if (reduced) return;
    scale.set(withTiming(value, { duration: duration.press, easing: ease.out }));
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        to(pressScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
