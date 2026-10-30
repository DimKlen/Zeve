import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from '@/theme';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

/** Carte `surface`, r 22, padding 12/14/14 (docs/02 §7). */
export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingTop: space.m,
    paddingHorizontal: space.ml,
    paddingBottom: space.ml,
  },
});
