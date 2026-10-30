import { StyleSheet, Text } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';

import { duration } from '@/motion';
import { colors, control, radius, space, type } from '@/theme';

import { PressableScale } from './PressableScale';
import { useColorTransition } from './useColorTransition';

type Props = {
  label: string;
  hint: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Choix de lumière (docs/02 §7) : h 64 r 16 ; sélectionné fond butter, bordure sunDeep. */
export function LightOption({ label, hint, selected = false, onPress }: Props) {
  const bg = useColorTransition(selected ? colors.butter : colors.surface, duration.chip);
  const border = useColorTransition(selected ? colors.sunDeep : colors.inputBorder, duration.chip);
  const box = useAnimatedStyle(() => ({ backgroundColor: bg.value, borderColor: border.value }));
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${hint}`}
      accessibilityState={{ selected }}
      style={[styles.base, box]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: control.lightOption,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: space.xxs,
  },
  label: { ...type.label, color: colors.ink },
  hint: { ...type.lightHint, color: colors.inkMuted, textAlign: 'center' },
});
