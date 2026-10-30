// Composant React Native de référence : la plante-mascotte (feuillage + pot à visage).
// Reproduit le prototype : feuillage qui se balance (sway), pot fixe, yeux qui clignent (blink),
// joues (blush), bouche selon l'humeur, gouttes à l'arrosage, flottement (bob) optionnel.
// Dépendances : react-native-svg, react-native-reanimated (v3+).
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect, Circle, Ellipse } from 'react-native-svg';
import Animated, {
  Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat,
  withSequence, withTiming, useReducedMotion,
} from 'react-native-reanimated';
import { drawPlant, type Stage } from './drawPlant';

const AEllipse = Animated.createAnimatedComponent(Ellipse);
const AG = Animated.createAnimatedComponent(G);

type Props = {
  speciesId: string;
  stage: Stage;
  thirsty?: boolean;
  /** Largeur en px ; la hauteur suit le ratio 100×110. */
  size: number;
  face?: 'none' | 'simple' | 'full'; // simple = yeux ronds + bouche ; full = + clignement + joues
  sway?: boolean; // balancement du feuillage (désactivé dans les listes longues)
  bob?: boolean; // flottement vertical 6px
  bobDelayMs?: number;
  showDrops?: boolean; // déclenche l'animation des gouttes (arrosage)
};

const EASE_IN_OUT = Easing.inOut(Easing.ease);

export function PlantAvatar({ speciesId, stage, thirsty = false, size, face = 'simple', sway = true, bob = false, bobDelayMs = 0, showDrops = false }: Props) {
  const reduced = useReducedMotion();
  const g = drawPlant(speciesId, stage, thirsty);
  const h = size * 1.1;

  // sway : rotation -2.5° ↔ +2.5°, 4.5 s aller-retour, origine (50,62) du repère plante
  const rot = useSharedValue(-2.5);
  useEffect(() => {
    if (!sway || reduced) return;
    rot.value = withRepeat(withTiming(2.5, { duration: 2250, easing: EASE_IN_OUT }), -1, true);
  }, [sway, reduced]);
  const swayProps = useAnimatedProps(() => ({ rotation: rot.value, originX: 50, originY: 62 }) as any);

  // bob : translateY 0 → -6 → 0 sur 3.2 s
  const y = useSharedValue(0);
  useEffect(() => {
    if (!bob || reduced) return;
    y.value = withDelay(bobDelayMs, withRepeat(withTiming(-6, { duration: 1600, easing: EASE_IN_OUT }), -1, true));
  }, [bob, reduced]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  // blink : toutes les 5 s, l'œil s'écrase à 10 % pendant ~150 ms
  const ry = useSharedValue(3.2);
  useEffect(() => {
    if (face !== 'full' || reduced) return;
    ry.value = withRepeat(withSequence(withDelay(4650, withTiming(0.32, { duration: 150 })), withTiming(3.2, { duration: 200 })), -1);
  }, [face, reduced]);
  const eyeProps = useAnimatedProps(() => ({ ry: ry.value }));

  return (
    <Animated.View style={[{ width: size, height: h }, bobStyle]}>
      <Svg width={size} height={h} viewBox="0 0 100 110">
        <G transform={g.tilt}>
          <G transform={g.scale}>
            <AG animatedProps={swayProps}>
              {g.shapes.map((s, i) => (
                <Path key={i} d={s.d} transform={s.t} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </AG>
          </G>
        </G>
        {/* Pot : bord + corps (identiques pour toutes les espèces) */}
        <Rect x={23} y={62} width={54} height={10} rx={4} fill="#E8B931" />
        <Path d="M27 72 H73 L66 106 H34 Z" fill="#D6A132" />
        {face === 'full' && <Ellipse cx={50} cy={72} rx={24} ry={1.4} fill="#B88424" opacity={0.5} />}
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
        {face !== 'none' && <Path d={g.mouth} stroke="#1F3D2B" strokeWidth={2} fill="none" strokeLinecap="round" />}
      </Svg>
      {showDrops && <WaterDrops size={size} />}
    </Animated.View>
  );
}

/** 3 gouttes qui tombent (1.1 s ease-in, délais 0 / 250 / 400 ms) au-dessus de la plante. */
function WaterDrops({ size }: { size: number }) {
  const k = size / 100;
  const drops = [
    { x: 50, y: 8, r: 4, delay: 0 },
    { x: 40, y: 12, r: 3, delay: 250 },
    { x: 61, y: 10, r: 3, delay: 400 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {drops.map((d, i) => <Drop key={i} left={d.x * k} top={d.y * k} r={d.r * k} delay={d.delay} />)}
    </View>
  );
}

function Drop({ left, top, r, delay }: { left: number; top: number; r: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.in(Easing.ease) })); }, []);
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
