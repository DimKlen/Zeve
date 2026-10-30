import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconPlus } from '@/components/icons';
import { Rise } from '@/components/Rise';
import { t } from '@/i18n';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { colors, radius, space, type } from '@/theme';

/** Jardin vide (non maquetté, docs/04 §7) : trio de pousses, texte et CTA vers Nouvelle plante. */
export function EmptyGarden({ onAdd }: { onAdd: () => void }) {
  return (
    <Rise delay="d1">
      <View style={styles.card}>
        <View style={styles.trio} importantForAccessibility="no-hide-descendants">
          <PlantAvatar speciesId="pilea" stage={1} size={70} bob bobDelayMs={1100} />
          <PlantAvatar speciesId="monstera" stage={1} size={70} bob />
          <PlantAvatar speciesId="echinopsis" stage={1} size={70} bob bobDelayMs={2200} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t('garden.emptyTitle')}
        </Text>
        <Text style={styles.text}>{t('garden.emptyText')}</Text>
        <View style={styles.cta}>
          <Button
            label={t('garden.emptyCta')}
            icon={(c) => <IconPlus size={20} color={c} />}
            onPress={onAdd}
          />
        </View>
      </View>
    </Rise>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.section,
    padding: 24,
    alignItems: 'center',
    gap: space.s,
  },
  trio: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.xs },
  title: { ...type.buttonL, color: colors.forest, textAlign: 'center' },
  text: { ...type.small, color: colors.inkMuted, textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: space.m },
});
