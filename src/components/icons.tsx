// Jeu d'icônes Zeve : traits arrondis, viewBox 24, épaisseur 2 (sauf mention). Copiés du prototype.
// Pas d'emoji, pas de librairie d'icônes tierce : ces tracés suffisent.
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type P = { size?: number; color?: string; strokeWidth?: number };
const S = ({ size = 22, children }: { size?: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);
const line = (color: string, w: number) => ({
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconPlus = ({ size, color = '#1F3D2B', strokeWidth = 2.4 }: P) => (
  <S size={size}>
    <Path d="M12 5v14M5 12h14" {...line(color, strokeWidth)} />
  </S>
);
export const IconMinus = ({ size, color = '#1F3D2B', strokeWidth = 2.4 }: P) => (
  <S size={size}>
    <Path d="M5 12h14" {...line(color, strokeWidth)} />
  </S>
);
export const IconBack = ({ size = 20, color = '#1F3D2B', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M15 5l-7 7 7 7" {...line(color, strokeWidth)} />
  </S>
);
export const IconChevronRight = ({ size = 18, color = '#55604F', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M9 5l7 7-7 7" {...line(color, strokeWidth)} />
  </S>
);
export const IconMore = ({ size = 20, color = '#1F3D2B' }: P) => (
  <S size={size}>
    <Circle cx={5} cy={12} r={1.8} fill={color} />
    <Circle cx={12} cy={12} r={1.8} fill={color} />
    <Circle cx={19} cy={12} r={1.8} fill={color} />
  </S>
);
export const IconDrop = ({ size = 20, color = '#1F3D2B', strokeWidth = 2.2 }: P) => (
  <S size={size}>
    <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...line(color, strokeWidth)} />
  </S>
);
export const IconSun = ({ size = 22, color = '#C48A0E', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Circle cx={12} cy={12} r={4} {...line(color, strokeWidth)} />
    <Path
      d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
      {...line(color, strokeWidth)}
    />
  </S>
);
export const IconAir = ({ size = 22, color = '#4F8350', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3" {...line(color, strokeWidth)} />
  </S>
);
// Ajouts hors prototype (carte « Saison » de la fiche), même style de trait.
export const IconThermometer = ({ size = 22, color = '#1F3D2B', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0z" {...line(color, strokeWidth)} />
    <Path d="M12 9v6" {...line(color, strokeWidth)} />
  </S>
);
export const IconHome = ({ size = 22, color = '#1F3D2B', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5" {...line(color, strokeWidth)} />
  </S>
);
export const IconCamera = ({ size = 22, color = '#1F3D2B', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path d="M4 8h3l2-3h6l2 3h3v11H4z" {...line(color, strokeWidth)} />
    <Circle cx={12} cy={13} r={3.5} {...line(color, strokeWidth)} />
  </S>
);
export const IconSend = ({ size = 20, color = '#F3EEE3', strokeWidth = 2.2 }: P) => (
  <S size={size}>
    <Path d="M5 12h14M13 6l6 6-6 6" {...line(color, strokeWidth)} />
  </S>
);
export const IconSprout = ({ size = 22, color = '#F3EEE3', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Path
      d="M12 21V11M12 13c-4 0-7-3-7-7 4 0 7 3 7 7zM12 11c0-4 3-7 7-7 0 4-3 7-7 7z"
      {...line(color, strokeWidth)}
    />
  </S>
);
export const IconSettings = ({ size = 20, color = '#F3EEE3', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Circle cx={12} cy={12} r={3} {...line(color, strokeWidth)} />
    <Path
      d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
      {...line(color, strokeWidth)}
    />
  </S>
);
export const IconSearch = ({ size = 18, color = '#55604F', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Circle cx={11} cy={11} r={6} {...line(color, strokeWidth)} />
    <Path d="M20 20l-4.5-4.5" {...line(color, strokeWidth)} />
  </S>
);
export const IconCheck = ({ size = 16, color = '#2F5A3A', strokeWidth = 2.5 }: P) => (
  <S size={size}>
    <Path d="M5 12.5l4.5 4.5L19 7.5" {...line(color, strokeWidth)} />
  </S>
);
export const IconLock = ({ size = 14, color = '#3A453C', strokeWidth = 2.2 }: P) => (
  <S size={size}>
    <Rect x={5} y={11} width={14} height={10} rx={2} {...line(color, strokeWidth)} />
    <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...line(color, strokeWidth)} />
  </S>
);
export const IconPerson = ({ size = 18, color = '#2F5A3A', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Circle cx={12} cy={8} r={4} {...line(color, strokeWidth)} />
    <Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" {...line(color, strokeWidth)} />
  </S>
);
export const IconMail = ({ size = 18, color = '#2F5A3A', strokeWidth = 2 }: P) => (
  <S size={size}>
    <Rect x={3} y={5} width={18} height={14} rx={2} {...line(color, strokeWidth)} />
    <Path d="M3 7l9 6 9-6" {...line(color, strokeWidth)} />
  </S>
);
// ——— Logos des fournisseurs (docs/02 §6 : remplacent les monogrammes « G » / « A » du prototype) ———
/** Logo « G » officiel de Google (couleurs imposées par la charte Google Sign-In). */
export const LogoGoogle = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);
/** Logo Apple (glyphe plein, blanc sur le bouton noir). */
export const LogoApple = ({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 384 512">
    <Path
      fill={color}
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </Svg>
);

/** Arc de chargement (reconnaissance d'espèce) — à faire tourner avec l'animation spin. */
export const IconSpinner = ({ size = 30, color = '#1F3D2B', strokeWidth = 2.4 }: P) => (
  <S size={size}>
    <Path d="M12 3a9 9 0 1 1-9 9" {...line(color, strokeWidth)} />
  </S>
);
