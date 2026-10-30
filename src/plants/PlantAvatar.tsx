// La plante-mascotte : feuillage + pot à visage (docs/10).
// Feuillage qui se balance (sway) dans une vue animée séparée du pot (alternative de docs/10 :
// rendu identique, rotation fluide sur toutes les plateformes), inclinaison de soif animée en 600 ms,
// yeux qui clignent (blink), joues, bouche selon l'humeur, gouttes à l'arrosage, flottement (bob).
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { drawPlant, type Stage } from './drawPlant';

const AEllipse = Animated.createAnimatedComponent(Ellipse);

type Props = {
  speciesId: string;
  stage: Stage;
  thirsty?: boolean;
  /** Largeur en px ; la hauteur suit le ratio 100×110. */
  size: number;
  face?: 'none' | 'simple' | 'full'; // simple = yeux ronds + bouche ; full = + clignement + joues
  sway?: boolean; // balancement du feuillage (désactivé dans les listes longues)
  bob?: boolean; // flottement vertical 6 px
  /** Décalage du flottement (trio de connexion : -1.1 s / -2.2 s, passés en positif). */
  bobDelayMs?: number;
  showDrops?: boolean; // déclenche l'animation des gouttes (arrosage)
};

const EASE_IN_OUT = Easing.inOut(Easing.ease);
const SWAY_DEG = 2.5;
const THIRSTY_TILT_DEG = -9;
const MOOD_MS = 600;
const EYE_RY = 3.2;

// Origines des rotations dans le repère 100×110 : sway (50,62), inclinaison (50,64).
const SWAY_ORIGIN = '50% 56.36%';
const TILT_ORIGIN = '50% 58.18%';

function PlantAvatarBase({
  speciesId,
  stage,
  thirsty = false,
  size,
  face = 'simple',
  sway = true,
  bob = false,
  bobDelayMs = 0,
  showDrops = false,
}: Props) {
  const reduced = useReducedMotion();
  const g = drawPlant(speciesId, stage, thirsty);
  const h = size * 1.1;

  // sway : rotation -2.5° ↔ +2.5°, 4.5 s aller-retour
  const rot = useSharedValue(0);
  useEffect(() => {
    if (!sway || reduced) {
      cancelAnimation(rot);
      rot.value = 0;
      return;
    }
    rot.value = -SWAY_DEG;
    rot.value = withRepeat(withTiming(SWAY_DEG, { duration: 2250, easing: EASE_IN_OUT }), -1, true);
    return () => cancelAnimation(rot);
  }, [sway, reduced, rot]);
  const swayStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  // changement d'humeur : inclinaison −9° ↔ 0°, 600 ms
  const tilt = useSharedValue(thirsty ? THIRSTY_TILT_DEG : 0);
  useEffect(() => {
    const to = thirsty ? THIRSTY_TILT_DEG : 0;
    tilt.value = reduced ? to : withTiming(to, { duration: MOOD_MS, easing: EASE_IN_OUT });
  }, [thirsty, reduced, tilt]);
  const tiltStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  // bob : translateY 0 → -6 → 0 sur 3.2 s
  const y = useSharedValue(0);
  useEffect(() => {
    if (!bob || reduced) {
      cancelAnimation(y);
      y.value = 0;
      return;
    }
    y.value = withDelay(
      bobDelayMs,
      withRepeat(withTiming(-6, { duration: 1600, easing: EASE_IN_OUT }), -1, true),
    );
    return () => cancelAnimation(y);
  }, [bob, bobDelayMs, reduced, y]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  // blink : cycle de 5 s, l'œil s'écrase à 10 % vers 93–96 %
  const ry = useSharedValue(EYE_RY);
  useEffect(() => {
    if (face !== 'full' || reduced) {
      cancelAnimation(ry);
      ry.value = EYE_RY;
      return;
    }
    ry.value = withRepeat(
      withSequence(
        withDelay(4650, withTiming(EYE_RY * 0.1, { duration: 150 })),
        withTiming(EYE_RY, { duration: 200 }),
      ),
      -1,
    );
    return () => cancelAnimation(ry);
  }, [face, reduced, ry]);
  const eyeProps = useAnimatedProps(() => ({ ry: ry.value }));

  return (
    <Animated.View style={[{ width: size, height: h }, bobStyle]}>
      {/* Feuillage : inclinaison (soif) puis balancement, chacun autour de son origine. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.tilt, tiltStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.sway, swayStyle]}>
          <Svg width={size} height={h} viewBox="0 0 100 110">
            <G transform={g.scale}>
              {g.shapes.map((s, i) => (
                <Path
                  key={i}
                  d={s.d}
                  transform={s.t}
                  fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>
      {/* Pot et visage, fixes, au-dessus du feuillage. */}
      <Svg width={size} height={h} viewBox="0 0 100 110" style={StyleSheet.absoluteFill}>
        <Rect x={23} y={62} width={54} height={10} rx={4} fill="#E8B931" />
        <Path d="M27 72 H73 L66 106 H34 Z" fill="#D6A132" />
        {face === 'full' && (
          <Ellipse cx={50} cy={72} rx={24} ry={1.4} fill="#B88424" opacity={0.5} />
        )}
        {face === 'simple' && (
          <>
            <Circle cx={43} cy={84} r={2.6} fill="#1F3D2B" />
            <Circle cx={57} cy={84} r={2.6} fill="#1F3D2B" />
          </>
        )}
        {face === 'full' && (
          <>
            <AEllipse cx={43} cy={84} rx={2.7} animatedProps={eyeProps} fill="#1F3D2B" />
            <AEllipse cx={57} cy={84} rx={2.7} animatedProps={eyeProps} fill="#1F3D2B" />
            <Circle cx={37} cy={90} r={2.4} fill="#E98B6B" opacity={thirsty ? 0 : 0.55} />
            <Circle cx={63} cy={90} r={2.4} fill="#E98B6B" opacity={thirsty ? 0 : 0.55} />
          </>
        )}
        {face !== 'none' && (
          <Path d={g.mouth} stroke="#1F3D2B" strokeWidth={2} fill="none" strokeLinecap="round" />
        )}
      </Svg>
      {showDrops && !reduced && <WaterDrops size={size} />}
    </Animated.View>
  );
}

/** Mémoïsé : la grille du jardin redessine souvent ses cartes (docs/03 §8). */
export const PlantAvatar = memo(PlantAvatarBase);

/** 3 gouttes qui tombent (1.1 s ease-in, délais 0 / 250 / 400 ms) au-dessus de la plante. */
function WaterDrops({ size }: { size: number }) {
  const k = size / 100;
  const drops = [
    { x: 50, y: 8, r: 4, delay: 0 },
    { x: 40, y: 12, r: 3, delay: 250 },
    { x: 61, y: 10, r: 3, delay: 400 },
  ];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {drops.map((d, i) => (
        <Drop key={i} left={d.x * k} top={d.y * k} r={d.r * k} delay={d.delay} />
      ))}
    </View>
  );
}

function Drop({ left, top, r, delay }: { left: number; top: number; r: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.in(Easing.ease) }));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.3 ? t.value / 0.3 : 1 - (t.value - 0.3) / 0.7,
    transform: [{ translateY: -16 * (r / 4) + t.value * 46 * (r / 4) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: left - r, top }, style]}>
      <Svg width={r * 2} height={r * 2.9} viewBox="-4 0 8 11.5">
        <Path d="M0 0C0 0-4 5-4 7.5a4 4 0 0 0 8 0C4 5 0 0 0 0Z" fill="#3E77A8" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tilt: { transformOrigin: TILT_ORIGIN },
  sway: { transformOrigin: SWAY_ORIGIN },
});
