import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useColors } from '@/theme';

type Props = {
  /** Largeur en px ; la hauteur suit le ratio 100×110 (comme PlantAvatar). */
  size: number;
};

/**
 * Avatar de l'assistant du chat : une petite plante en pot qui parle (bouche ouverte, sourcils
 * levés, joues, ondes de voix). Même style que les plantes de l'app (aplats, traits arrondis),
 * palette vert / beige / jaune du thème, donc lisible en clair comme en sombre.
 * Décoratif : masqué aux lecteurs d'écran, le texte de la bulle suffit.
 */
export function AssistantAvatar({ size }: Props) {
  const colors = useColors();
  const face = colors.onSun;
  return (
    <Svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 100 110"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {/* Feuillage : tige, deux feuilles, bourgeon jaune. */}
      <Path
        d="M50 62V28"
        stroke={colors.forest2}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M50 54C35 55 24 47 22 33c15-1 26 7 28 21z" fill={colors.okDot} />
      <Path d="M50 46C65 47 76 39 78 25c-15-1-26 7-28 21z" fill={colors.splashLeaf} />
      <Circle cx={50} cy={24} r={6} fill={colors.sun} />

      {/* Pot : liseré jaune et corps ocre. */}
      <Path d="M27 68h46l-5 34a5 5 0 0 1-5 4H37a5 5 0 0 1-5-4z" fill={colors.potBody} />
      <Rect x={22} y={60} width={56} height={11} rx={5.5} fill={colors.sun} />

      {/* Visage : sourcils levés, yeux, joues, bouche ouverte qui parle. */}
      <Path
        d="M36 76q4-3.5 8-1.5M56 74.5q4-2 8 1.5"
        stroke={face}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={41} cy={82} rx={3} ry={3.6} fill={face} />
      <Ellipse cx={59} cy={82} rx={3} ry={3.6} fill={face} />
      <Circle cx={34} cy={90} r={3.2} fill={colors.blush} opacity={0.75} />
      <Circle cx={66} cy={90} r={3.2} fill={colors.blush} opacity={0.75} />
      <Ellipse cx={50} cy={92} rx={5.5} ry={5} fill={face} />
      <Ellipse cx={50} cy={94.5} rx={3.4} ry={2.2} fill={colors.blush} />

      {/* Ondes de voix. */}
      <Path
        d="M82 74q5 5 0 10M87 70q9 9 0 18"
        stroke={colors.forest2}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
