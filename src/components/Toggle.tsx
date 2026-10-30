import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, ease } from '@/motion';
import { colors, control, layout, shadow } from '@/theme';

import { useColorTransition } from './useColorTransition';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

const { w, h, knob } = control.toggle;
const PAD = (h - knob) / 2;
const TRAVEL = w - knob - PAD * 2;

/** Interrupteur 56×34 (docs/02 §7) : fond et position animés en 250 ms. */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled = false }: Props) {
  const reduced = useReducedMotion();
  const bg = useColorTransition(value ? colors.forest2 : colors.strongBorder, duration.toggle);
  const x = useSharedValue(value ? TRAVEL : 0);
  useEffect(() => {
    const to = value ? TRAVEL : 0;
    x.value = reduced ? to : withTiming(to, { duration: duration.toggle, easing: ease.inOut });
  }, [value, reduced, x]);

  const track = useAnimatedStyle(() => ({ backgroundColor: bg.value }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={(layout.touchMin - h) / 2}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, shadow.toggleKnob, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: w, height: h, borderRadius: h / 2, padding: PAD },
  knob: { width: knob, height: knob, borderRadius: knob / 2, backgroundColor: colors.white },
});
