import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { colors, control, shadow } from '@/theme';

import { PressableScale } from './PressableScale';

type Variant = 'surface' | 'sun' | 'sage' | 'forest';

type Props = {
  /** Obligatoire : seul texte lu par VoiceOver / TalkBack. */
  accessibilityLabel: string;
  onPress?: () => void;
  /** surface : rond 44 (retour, options) · sun : + du jardin · sage / forest : photo / envoyer du chat (48). */
  variant?: Variant;
  /** Icône ; reçoit la couleur adaptée à la variante. */
  icon: (color: string) => ReactElement;
  disabled?: boolean;
  /** Diamètre forcé (52 pour l’envoi du lien magique). */
  size?: number;
};

const BG: Record<Variant, string> = {
  surface: colors.surface,
  sun: colors.sun,
  sage: colors.sage,
  forest: colors.forest,
};

/** Bouton rond à icône (docs/02 §7). */
export function IconButton({
  accessibilityLabel,
  onPress,
  variant = 'surface',
  icon,
  disabled = false,
  size: forcedSize,
}: Props) {
  const size = forcedSize ?? (variant === 'surface' ? control.roundIcon : control.roundIconL);
  const fg = variant === 'forest' ? colors.bg : colors.forest;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: BG[variant] },
        variant === 'sun' && shadow.plusButton,
      ]}
    >
      {icon(fg)}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
