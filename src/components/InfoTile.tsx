import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/theme';

type Props = {
  /** Overline (EAU, LUMIÈRE, AIR). */
  title: string;
  /** Jauge ou icône 22. */
  children: ReactNode;
  value: string;
};

/** Tuile d'info de la fiche (docs/02 §7) : surface, r 18, padding 12, gap 8. */
export function InfoTile({ title, children, value }: Props) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${title} : ${value}`}>
      <Text style={styles.title}>{title}</Text>
      {children}
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.m,
    gap: space.s,
  },
  title: { ...type.overline, color: colors.inkMuted },
  value: { ...type.buttonS, color: colors.ink },
});
