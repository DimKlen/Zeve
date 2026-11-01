import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PlantAvatar } from '@/plants/PlantAvatar';
import { lightColors } from '@/theme';

// Planche de l'icône d'app (docs/09 Phase 8 : mascotte Monstera sur fond crème), capturée pour
// produire assets/*.png.
// ?mode=full : icône iOS / web, mascotte large sur fond crème.
// ?mode=foreground&bg=white|ink : premier plan Android (zone sûre centrale de 66 %) rendu sur deux
// fonds connus ; la transparence exacte est recalculée par différence entre les deux captures.
const CANVAS = 512;
const SIZE = { full: 360, foreground: 300 } as const;
// Fonds de capture fixes (clairs) : l'icône ne suit pas le mode sombre.
const BACKGROUNDS = {
  cream: lightColors.bg,
  white: lightColors.white,
  ink: lightColors.ink,
} as const;

export default function DevIconScreen() {
  const { mode = 'full', bg = 'cream' } = useLocalSearchParams<{
    mode?: 'full' | 'foreground';
    bg?: keyof typeof BACKGROUNDS;
  }>();
  const full = mode !== 'foreground';
  return (
    <View
      testID="icon"
      style={[styles.canvas, { backgroundColor: BACKGROUNDS[bg] ?? lightColors.bg }]}
    >
      <PlantAvatar
        speciesId="monstera"
        stage={3}
        size={full ? SIZE.full : SIZE.foreground}
        face="simple"
        sway={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: CANVAS, height: CANVAS, alignItems: 'center', justifyContent: 'center' },
});
