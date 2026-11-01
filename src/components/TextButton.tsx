import { StyleSheet, Text } from 'react-native';

import { control, type, useColors } from '@/theme';

import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  onPress?: () => void;
  /** Souligné pour « Continuer avec un e-mail ». */
  underline?: boolean;
  color?: string;
};

/** Bouton texte transparent, h 48, Figtree 600 15 (docs/02 §7). */
export function TextButton({ label, onPress, underline = false, color: colorProp }: Props) {
  const colors = useColors();
  const color = colorProp ?? colors.forest;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.base}
    >
      <Text style={[type.textButton, { color }, underline && styles.underline]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: control.roundIconL, alignItems: 'center', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
