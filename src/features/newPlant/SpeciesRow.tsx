import { memo } from 'react';
import { Text, View } from 'react-native';

import { IconCheck } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { t } from '@/i18n';
import { PlantAvatar } from '@/plants/PlantAvatar';
import type { Species } from '@/plants/species';
import { makeStyles, radius, space, type, useColors } from '@/theme';

import { typeLabel } from './searchSpecies';

type Props = { species: Species; selected: boolean; onPress: (species: Species) => void };

const CHECK = 28;

/** Ligne de la liste des espèces (docs/02 §7) : dessin Jeune sans visage ni sway. */
function SpeciesRowBase({ species, selected, onPress }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const label = typeLabel(species);
  return (
    <PressableScale
      onPress={() => onPress(species)}
      accessibilityRole="button"
      accessibilityLabel={`${species.name}, ${species.latin}, ${label}${selected ? `, ${t('species.selectedA11y')}` : ''}`}
      accessibilityState={{ selected }}
      style={[styles.row, selected && styles.selected]}
    >
      <View style={styles.thumb}>
        <PlantAvatar speciesId={species.id} stage={2} size={50} face="none" sway={false} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {species.name}
        </Text>
        <Text style={styles.latin} numberOfLines={1}>
          {species.latin}
        </Text>
        <Text style={styles.type} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {selected && (
        <View style={styles.check}>
          <IconCheck size={16} color={colors.bg} strokeWidth={2.6} />
        </View>
      )}
    </PressableScale>
  );
}

export const SpeciesRow = memo(SpeciesRowBase);

const useStyles = makeStyles((colors) => ({
  row: {
    minHeight: 72,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.ml,
  },
  selected: { backgroundColor: colors.sage },
  thumb: {
    width: 54,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.well,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  texts: { flex: 1 },
  name: { ...type.sectionTitle, color: colors.ink },
  latin: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted, paddingRight: 2 },
  type: { ...type.micro, color: colors.forestText },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: CHECK / 2,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
