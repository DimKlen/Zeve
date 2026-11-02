import { Text, View } from 'react-native';

import { IconChevronRight } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { statusOf } from '@/features/garden/gardenRules';
import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { makeStyles, radius, space, type, useColors } from '@/theme';

import { placeLabel, type GardenSummary } from './gardenRules';

const PREVIEW = 3;
const AVATAR = 52;

export const plantsLabel = (n: number) =>
  n === 1 ? t('gardens.plantsOne') : t('gardens.plantsMany', { n });
export const thirstLabel = (n: number) =>
  n === 0
    ? t('gardens.thirstNone')
    : n === 1
      ? t('gardens.thirstOne')
      : t('gardens.thirstMany', { n });

type Props = {
  summary: GardenSummary;
  now: Date;
  delay: keyof typeof riseDelay;
  onPress: () => void;
};

/**
 * Carte d'un jardin sur l'accueil (non maquettée, style des cartes de plantes) : nom, lieu,
 * plantes et soif du jour, aperçu des premières plantes.
 */
export function GardenCard({ summary, now, delay, onPress }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const { garden, plants, thirsty } = summary;
  const place = placeLabel(garden);
  const status = `${plantsLabel(plants.length)} · ${thirstLabel(thirsty)}`;
  return (
    <Rise delay={delay}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('gardens.cardA11y', {
          name: garden.name,
          place,
          plants: plantsLabel(plants.length),
          thirst: thirstLabel(thirsty),
        })}
        style={styles.card}
      >
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {garden.name}
          </Text>
          {!!place && (
            <Text style={styles.place} numberOfLines={1}>
              {place}
            </Text>
          )}
          <View style={styles.status}>
            <View
              style={[styles.dot, { backgroundColor: thirsty ? colors.thirstyDot : colors.okDot }]}
            />
            <Text style={styles.statusText} numberOfLines={1}>
              {status}
            </Text>
          </View>
        </View>
        <View style={styles.preview} importantForAccessibility="no-hide-descendants">
          {plants.slice(0, PREVIEW).map((plant, i) => {
            const s = statusOf(plant, now);
            return (
              <View key={plant.id} style={[styles.avatar, i > 0 && styles.overlap]}>
                <PlantAvatar
                  speciesId={plant.speciesId}
                  stage={s.stage}
                  thirsty={s.thirsty}
                  size={AVATAR - 6}
                  sway={false}
                />
              </View>
            );
          })}
        </View>
        <IconChevronRight color={colors.inkMuted} />
      </PressableScale>
    </Rise>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: space.ml,
    paddingLeft: space.l,
    paddingRight: space.ml,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  texts: { flex: 1, gap: 2 },
  name: { ...type.plantName, color: colors.forest },
  place: { ...type.caption, color: colors.inkMuted },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xxs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...type.caption, color: colors.ink, flexShrink: 1 },
  preview: { flexDirection: 'row' },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.well,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  overlap: { marginLeft: -16 },
}));
