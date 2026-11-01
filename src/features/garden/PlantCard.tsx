import { memo } from 'react';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { cardStatus } from '@/plants/plantStatus';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { makeStyles, radius, space, type, useColors } from '@/theme';

import { statusOf, type GardenPlant } from './gardenRules';

type Props = {
  plant: GardenPlant;
  now: Date;
  delay: keyof typeof riseDelay;
  onPress: (plant: GardenPlant) => void;
};

/** Carte du jardin (docs/02 §7 PlantCard, docs/04 §7). */
function PlantCardBase({ plant, now, delay, onPress }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const s = statusOf(plant, now);
  const status = cardStatus(s);
  return (
    <Rise delay={delay} style={styles.cell}>
      <PressableScale
        onPress={() => onPress(plant)}
        accessibilityRole="button"
        accessibilityLabel={`${plant.nickname}, ${plant.speciesName}, ${t(`stage.${s.stage}`)}, ${status}`}
        style={styles.card}
      >
        <View style={styles.well}>
          <PlantAvatar speciesId={plant.speciesId} stage={s.stage} thirsty={s.thirsty} size={86} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t(`stage.${s.stage}`)}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {plant.nickname}
          </Text>
          <Text style={styles.species} numberOfLines={1}>
            {plant.speciesName}
          </Text>
        </View>
        <View style={styles.status}>
          <View
            style={[styles.dot, { backgroundColor: s.thirsty ? colors.thirstyDot : colors.okDot }]}
          />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </PressableScale>
    </Rise>
  );
}

export const PlantCard = memo(PlantCardBase);

const useStyles = makeStyles((colors) => ({
  cell: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingTop: space.m,
    paddingHorizontal: space.ml,
    paddingBottom: space.ml,
    gap: space.xs,
  },
  well: {
    height: 104,
    borderRadius: radius.md,
    backgroundColor: colors.well,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: space.s,
    left: space.s,
    height: 22,
    paddingHorizontal: space.s,
    borderRadius: 11,
    backgroundColor: colors.badgeBg,
    justifyContent: 'center',
  },
  badgeText: { ...type.badge, color: colors.inkSoft },
  name: { ...type.cardTitle, color: colors.ink },
  species: { ...type.micro, fontStyle: 'italic', color: colors.inkMuted },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...type.caption, color: colors.inkMuted, flexShrink: 1 },
}));
