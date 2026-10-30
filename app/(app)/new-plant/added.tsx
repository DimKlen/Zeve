import * as Haptics from 'expo-haptics';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AddedBadge } from '@/components/AddedBadge';
import { Button } from '@/components/Button';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { TextButton } from '@/components/TextButton';
import { showToast } from '@/components/Toast';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';
import { colors, space, type } from '@/theme';

/** Plante ajoutée (docs/04 §13). Le retour système ramène au jardin (pile de la modale vidée). */
export default function PlantAddedScreen() {
  const created = useNewPlantDraft((s) => s.created);

  useEffect(() => {
    if (created) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [created]);

  if (!created) return <Redirect href="/garden" />;

  return (
    <Screen name="added" tone="dark" enter="up">
      <View style={styles.center}>
        <AddedBadge speciesId={created.speciesId} name={created.name} />
        <Rise delay="d1" style={styles.texts}>
          <Text style={styles.title} accessibilityRole="header">
            {t('added.title', { name: created.name })}
          </Text>
          <Text style={styles.text}>{t('added.text')}</Text>
        </Rise>
        <Rise delay="d2" style={styles.actions}>
          <Button
            label={t('added.seePlant')}
            variant="sun"
            onPress={() => {
              showToast(t('added.toast', { name: created.name }));
              go('plant', { id: created.id, replace: true });
            }}
          />
          <TextButton
            label={t('added.addAnother')}
            color={colors.darkText}
            onPress={() => {
              useNewPlantDraft.getState().reset();
              go('newPlant', { replace: true });
            }}
          />
        </Rise>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: space.x4,
  },
  texts: { alignItems: 'center', gap: space.s },
  title: { ...type.added, color: colors.darkText, textAlign: 'center' },
  text: { ...type.bodyS, color: colors.darkMuted, textAlign: 'center', maxWidth: 290 },
  actions: { alignSelf: 'stretch', gap: space.s },
});
