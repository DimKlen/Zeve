import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, control, space, type } from '@/theme';

import { IconBack } from './icons';
import { IconButton } from './IconButton';

type Props = {
  title: string;
  onBack: () => void;
  backLabel: string;
  /** Variante centrée de la fiche : sous-titre « latin · pièce » et bouton à droite. */
  subtitle?: string;
  right?: ReactNode;
};

/** En-tête : bouton retour 44 + titre (docs/02 §7). Centré si `subtitle` ou `right` est fourni. */
export function ScreenHeader({ title, onBack, backLabel, subtitle, right }: Props) {
  const back = (
    <IconButton
      accessibilityLabel={backLabel}
      onPress={onBack}
      icon={(c) => <IconBack color={c} />}
    />
  );

  if (subtitle === undefined && !right) {
    return (
      <View style={styles.row}>
        {back}
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.centered]}>
      {back}
      <View style={styles.middle}>
        <Text style={styles.plantName} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  centered: { justifyContent: 'space-between' },
  title: { ...type.subTitle, color: colors.forest, flexShrink: 1 },
  middle: { flex: 1, alignItems: 'center' },
  plantName: { ...type.plantName, color: colors.forest },
  subtitle: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted },
  spacer: { width: control.roundIcon },
});
