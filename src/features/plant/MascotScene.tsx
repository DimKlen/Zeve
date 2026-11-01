import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useColorTransition } from '@/components/useColorTransition';
import { t } from '@/i18n';
import { duration } from '@/motion';
import { usePop } from '@/motion/useEnter';
import type { Stage } from '@/plants/drawPlant';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { makeStyles, radius, shadow, space, type, useColors } from '@/theme';

type Props = {
  name: string;
  speciesId: string;
  stage: Stage;
  thirsty: boolean;
  bubble: string;
  /** Change à chaque arrosage : rejoue les gouttes. */
  dropsKey: number;
};

const SCENE_H = 290;
const HALO = 250;

/** Scène de la fiche (docs/04 §8) : halo, bulle d'humeur, mascotte 230 px. */
export function MascotScene({ name, speciesId, stage, thirsty, bubble, dropsKey }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const halo = useColorTransition(thirsty ? colors.butter : colors.sage, duration.colorChange);
  const haloStyle = useAnimatedStyle(() => ({ backgroundColor: halo.value }));
  const pop = usePop(bubble);
  return (
    <View style={styles.scene}>
      <Animated.View style={[styles.halo, haloStyle]} />
      <Animated.View style={[styles.bubble, shadow.bubble, pop]} accessibilityLiveRegion="polite">
        <Text style={styles.bubbleText}>{bubble}</Text>
      </Animated.View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t(thirsty ? 'plant.moodThirstyA11y' : 'plant.moodOkA11y', { name })}
      >
        <PlantAvatar
          key={dropsKey}
          speciesId={speciesId}
          stage={stage}
          thirsty={thirsty}
          size={230}
          face="full"
          bob
          showDrops={dropsKey > 0}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  scene: { height: SCENE_H, alignItems: 'center', justifyContent: 'flex-end' },
  halo: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
  },
  bubble: {
    position: 'absolute',
    top: space.ml,
    left: space.xxl,
    // 170 de texte + padding : le prototype est en box-sizing content-box (capture 08 : 194).
    maxWidth: 170 + space.m * 2,
    zIndex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderBottomLeftRadius: space.xxs,
    paddingVertical: space.sm,
    paddingHorizontal: space.m,
  },
  bubbleText: { ...type.small, lineHeight: 19, color: colors.ink },
}));
