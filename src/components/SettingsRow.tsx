import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space, type } from '@/theme';

import { IconChevronRight } from './icons';

/** Carte de section des Réglages : surface r 24, lignes séparées (docs/04 §10). */
export function SettingsCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type RowProps = {
  label: string;
  hint?: string;
  /** Valeur à droite (« 9 h 00 », « 5 »). */
  value?: string;
  /** Élément à droite (interrupteur…) ; remplace valeur et chevron. */
  right?: ReactNode;
  chevron?: boolean;
  danger?: boolean;
  /** Pas de séparateur sous la dernière ligne d'une carte. */
  last?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Ligne de réglage : min 56 (64 avec indice), padding 10/16, libellé 600 15. */
export function SettingsRow({
  label,
  hint,
  value,
  right,
  chevron = false,
  danger = false,
  last = false,
  onPress,
  accessibilityLabel,
}: RowProps) {
  const content = (
    <>
      <View style={styles.texts}>
        <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {right ??
        (value !== undefined || chevron ? (
          <View style={styles.end}>
            {value !== undefined && <Text style={styles.value}>{value}</Text>}
            {chevron && <IconChevronRight />}
          </View>
        ) : null)}
    </>
  );
  const rowStyle = [styles.row, hint ? styles.tall : null, !last && styles.separator];
  if (!onPress) {
    return (
      <View style={rowStyle} accessible={!right} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.section, overflow: 'hidden' },
  row: {
    minHeight: 56,
    paddingVertical: space.sm,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  tall: { minHeight: 64 },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  pressed: { backgroundColor: colors.bg },
  texts: { flex: 1 },
  label: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.ink },
  danger: { fontFamily: type.button.fontFamily, color: colors.danger },
  hint: { ...type.caption, color: colors.inkMuted },
  end: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  value: { ...type.bodyS, color: colors.inkMuted },
});
