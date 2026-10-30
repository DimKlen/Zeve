import { StyleSheet, View } from 'react-native';

import { PlantAvatar } from '@/plants/PlantAvatar';
import { colors } from '@/theme';

// Trio de la Connexion (docs/04 §2) : disque butter 220×190 derrière trois mascottes alignées en bas,
// sway + bob décalés de 1.1 s / 2.2 s.
const BLOCK = { w: 300, h: 190 };
const DISC = { w: 220, h: 190 };

export function MascotTrio() {
  return (
    <View style={styles.block} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.disc} />
      <PlantAvatar speciesId="pilea" stage={2} size={80} face="simple" bob bobDelayMs={1100} />
      <PlantAvatar speciesId="monstera" stage={3} size={120} face="simple" bob />
      <PlantAvatar speciesId="echinopsis" stage={3} size={80} face="simple" bob bobDelayMs={2200} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    width: BLOCK.w,
    height: BLOCK.h,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    left: (BLOCK.w - DISC.w) / 2,
    top: 0,
    width: DISC.w,
    height: DISC.h,
    borderRadius: DISC.w / 2,
    backgroundColor: colors.butter,
  },
});
