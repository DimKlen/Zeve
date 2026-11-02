import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextButton } from '@/components/TextButton';
import { showToast } from '@/components/Toast';
import type { GardenPlant } from '@/features/garden/gardenRules';
import { t } from '@/i18n';
import { makeStyles, radius, space, type } from '@/theme';

import { useUpdatePlant } from './api';
import { suggestionFor } from './rhythm';

/**
 * Carte « Son vrai rythme » de la fiche (non maquettée, style de « Bon à savoir ») : propose le
 * rythme appris, jamais imposé. « Plus tard » ne la reproposera qu'après quelques arrosages.
 */
export function RhythmCard({ plant }: { plant: GardenPlant }) {
  const styles = useStyles();
  const update = useUpdatePlant();
  const suggestion = suggestionFor(plant);
  if (!suggestion) return null;
  const { days, usable } = suggestion;
  const params = { name: plant.nickname, n: days, current: plant.waterEveryDays };

  const adopt = () =>
    update.mutate(
      {
        plantId: plant.id,
        update: {
          water_every_days: days,
          learned_every_days: days,
          suggestion_declined_days: null,
          suggestion_declined_count: null,
        },
      },
      {
        onSuccess: () => showToast(t('rhythm.adoptedToast', { name: plant.nickname, n: days })),
        onError: () => showToast(t('toast.offline')),
      },
    );
  const later = () =>
    update.mutate(
      {
        plantId: plant.id,
        update: { suggestion_declined_days: days, suggestion_declined_count: usable },
      },
      { onError: () => showToast(t('toast.offline')) },
    );

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.overline}>{t('rhythm.title')}</Text>
      <Text style={styles.text}>
        {days < plant.waterEveryDays
          ? t('rhythm.suggestMore', params)
          : t('rhythm.suggestLess', params)}
      </Text>
      <Text style={styles.basis}>{t('rhythm.basis', { count: usable + 1 })}</Text>
      <View style={styles.actions}>
        <Button
          label={t('rhythm.adopt')}
          variant="sage"
          size="s"
          loading={update.isPending}
          onPress={adopt}
        />
        <TextButton label={t('rhythm.later')} onPress={later} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.ml,
    paddingHorizontal: space.ml + 2,
    gap: space.s,
  },
  overline: { ...type.overline, color: colors.inkMuted },
  text: { ...type.small, color: colors.ink },
  basis: { ...type.caption, color: colors.inkMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.l, marginTop: space.xxs },
}));
