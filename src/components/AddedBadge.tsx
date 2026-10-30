import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePop } from '@/motion/useEnter';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { colors } from '@/theme';

type Props = { speciesId: string; name: string };

const DISC = 170;

/** Disque de « Plante ajoutée » (docs/02 §7) : Ø 170, bordure 6 sun, plante Pousse 130 px, entrée pop. */
export function AddedBadge({ speciesId, name }: Props) {
  const pop = usePop(speciesId, true);
  return (
    <Animated.View
      style={[styles.disc, pop]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <View style={styles.plant}>
        <PlantAvatar speciesId={speciesId} stage={1} size={130} face="full" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    borderWidth: 6,
    borderColor: colors.sun,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  plant: { marginBottom: 2 },
});
