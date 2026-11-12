import { Pressable, Text, View } from 'react-native';
import Svg from 'react-native-svg';

import { Button } from '@/components/Button';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { PotArt } from '@/plants/PotArt';
import { POT_COUNT, randomPot } from '@/plants/pots';
import { t } from '@/i18n';
import { control, makeStyles, radius, space, type, useColors } from '@/theme';

type Props = { speciesId: string; value: number; onChange: (pot: number) => void };

const PREVIEW = 120;
const TILE = control.navItem;
const ICON = TILE - space.m;

/** Choix du pot : aperçu sur la plante, bouton « Au hasard » et les 20 pots de la collection. */
export function PotPicker({ speciesId, value, onChange }: Props) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {t('plant.potTitle')}
      </Text>
      <View
        style={styles.preview}
        accessible
        accessibilityLabel={t('plant.potPreviewA11y', { n: value + 1 })}
      >
        <PlantAvatar speciesId={speciesId} stage={2} size={PREVIEW} face="simple" pot={value} />
      </View>
      <Button
        label={t('plant.potRandom')}
        variant="sage"
        size="s"
        onPress={() => onChange(randomPot(value))}
      />
      <View style={styles.grid}>
        {Array.from({ length: POT_COUNT }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: i === value }}
            accessibilityLabel={t('plant.potPickA11y', { n: i + 1, total: POT_COUNT })}
            style={[styles.tile, { borderColor: i === value ? colors.forest : colors.lineSoft }]}
          >
            <Svg width={ICON} height={ICON} viewBox="14 56 72 54">
              <PotArt pot={i} />
            </Svg>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: space.m },
  title: { ...type.sectionTitle, color: colors.forest },
  preview: { alignItems: 'center', paddingVertical: space.s },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s, justifyContent: 'center' },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
