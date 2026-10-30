import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { duration } from '@/motion';
import { colors, control, space, type } from '@/theme';

import { PressableScale } from './PressableScale';
import { useColorTransition } from './useColorTransition';

type Variant = 'category' | 'room' | 'suggestion';

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  /** category : h 38 (liste d'espèces) · room : h 44 (pièces) · suggestion : h 40 fond butter (chat). */
  variant?: Variant;
};

const HEIGHT: Record<Variant, number> = {
  category: control.chip,
  room: control.roomChip,
  suggestion: control.suggestion,
};

/** Chip pilule (docs/02 §7) : fond et couleur animés en 200 ms à la sélection. */
export function Chip({ label, onPress, selected = false, variant = 'category' }: Props) {
  const suggestion = variant === 'suggestion';
  const bg = suggestion ? colors.butter : selected ? colors.forest : colors.surface;
  const border = suggestion ? colors.butter : selected ? colors.forest : colors.inputBorder;
  const fg = suggestion ? colors.forest : selected ? colors.bg : colors.ink;

  const bgValue = useColorTransition(bg, duration.chip);
  const borderValue = useColorTransition(border, duration.chip);
  const fgValue = useColorTransition(fg, duration.chip);
  const box = useAnimatedStyle(() => ({
    backgroundColor: bgValue.value,
    borderColor: borderValue.value,
  }));
  const text = useAnimatedStyle(() => ({ color: fgValue.value }));

  const height = HEIGHT[variant];
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={suggestion ? undefined : { selected }}
      hitSlop={height < control.roomChip ? (control.roomChip - height) / 2 : undefined}
      style={[
        styles.base,
        { height, borderRadius: height / 2, borderWidth: suggestion ? 0 : 1.5 },
        variant !== 'category' && styles.wide,
        box,
      ]}
    >
      <Animated.Text style={[variant === 'category' ? type.label : type.buttonS, text]}>
        {label}
      </Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', paddingHorizontal: space.ml },
  wide: { paddingHorizontal: space.ml + 2 },
});
