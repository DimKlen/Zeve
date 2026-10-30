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
/** Arc de chargement (reconnaissance d'espèce) — à faire tourner avec l'animation spin. */
export const IconSpinner = ({ size = 30, color = '#1F3D2B', strokeWidth = 2.4 }: P) => (
  <S size={size}>
    <Path d="M12 3a9 9 0 1 1-9 9" {...line(color, strokeWidth)} />
  </S>
);
