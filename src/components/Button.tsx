import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { duration } from '@/motion';
import { usePop } from '@/motion/useEnter';
import { colors, control, space, type } from '@/theme';

import { PressableScale } from './PressableScale';
import { useColorTransition } from './useColorTransition';

export type ButtonVariant = 'primary' | 'sun' | 'sage' | 'secondary';
type Size = 'l' | 'water' | 's';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** l : CTA 56 · water : « J'ai arrosé » de la fiche 58 · s : 44 (« Me rappeler… », ligne À arroser). */
  size?: Size;
  /** Icône à gauche du libellé ; reçoit la couleur du texte. */
  icon?: (color: string) => ReactElement;
  disabled?: boolean;
  loading?: boolean;
  /** Rejoue « pop » quand cette clé change (bouton arroser après tap). */
  popKey?: string | number;
  accessibilityHint?: string;
};

const BG: Record<ButtonVariant, string> = {
  primary: colors.forest,
  sun: colors.sun,
  sage: colors.sage,
  secondary: 'transparent',
};
const FG: Record<ButtonVariant, string> = {
  primary: colors.bg,
  sun: colors.forest,
  sage: colors.forest,
  secondary: colors.forest,
};
const HEIGHT: Record<Size, number> = {
  l: control.primaryButton,
  water: control.waterButton,
  s: control.smallButton,
};

/**
 * Bouton pilule (docs/02 §7). Le fond passe d'une variante à l'autre en 300 ms
 * (« J'ai arrosé » jaune → sauge, « Ajouter au jardin » gris → vert).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'l',
  icon,
  disabled = false,
  loading = false,
  popKey,
  accessibilityHint,
}: Props) {
  const inactive = disabled || loading;
  const bg = disabled ? colors.disabledBg : BG[variant];
  const fg = disabled ? colors.disabledFg : FG[variant];

  const bgValue = useColorTransition(bg, duration.buttonBg);
  const animatedBg = useAnimatedStyle(() => ({ backgroundColor: bgValue.value }));
  const pop = usePop(popKey);

  const height = HEIGHT[size];
  const textStyle = size === 'water' ? type.buttonL : size === 's' ? type.buttonS : type.button;

  return (
    <Animated.View style={pop}>
      <PressableScale
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={[
          styles.base,
          { height, borderRadius: height / 2 },
          size === 's' && styles.compact,
          variant === 'secondary' && styles.secondary,
          animatedBg,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.content}>
            {icon?.(fg)}
            <Text style={[textStyle, { color: fg }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  compact: { alignSelf: 'flex-start', paddingHorizontal: space.l },
  secondary: { borderWidth: 1.5, borderColor: colors.forest },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
