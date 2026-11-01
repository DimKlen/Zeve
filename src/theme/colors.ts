// Palettes clair / sombre (mêmes clés). Lues via useColors() / makeStyles() (./scheme).

export const lightColors = {
  // Fonds
  bg: '#F3EEE3', // fond d'app (crème)
  surface: '#FBF8F1', // cartes, champs, boutons ronds clairs
  well: '#EDE5D4', // puits des vignettes de plantes, badges neutres
  surfaceAlt: '#F7F4ED', // en-tête de la feuille OAuth, encadré permissions
  white: '#FFFFFF',

  // Verts « forêt » (marque)
  forest: '#1F3D2B', // titres, boutons primaires, barre de nav, écrans sombres (lancement, plante ajoutée)
  forest2: '#2F5A3A', // état actif sombre, bouton fermer sur fond forest, coche
  forestText: '#3F5A45', // texte sur fond sauge

  // Texte
  ink: '#1C2A21', // texte courant, fond du toast
  inkMuted: '#55604F', // texte secondaire, légendes, overlines
  inkSoft: '#3A453C', // texte tertiaire sur surfaces claires

  // Accents
  sun: '#E8B931', // jaune principal : CTA « J'ai arrosé », bouton +, onglet actif, cercle de « Plante ajoutée », bord du pot
  sunDeep: '#C48A0E', // bord de sélection lumière, icône soleil, ombre du +
  potBody: '#D6A132', // corps du pot
  potShadow: '#B88424',
  butter: '#F6E3A6', // carte « À arroser », halo de soif, chips de suggestion, sélection lumière
  sage: '#DCE8CF', // halo « en forme », carte chat, avatar, étapes passées, ligne sélectionnée
  sageDeep: '#CFE0C3', // placeholders photo, reconnaissance en cours
  sagePale: '#E9EFDF', // bouton « Prendre une photo »
  sageLine: '#A9B79A', // pointillé du bouton photo
  sageDash: '#8DAA80', // pointillé photo dans le chat

  // Lignes & bordures
  line: '#E2D9C6', // séparateurs d'en-tête, bordures d'étapes
  lineSoft: '#ECE4D3', // séparateurs de lignes de réglages
  inputBorder: '#D8CFBB', // champs, chips non sélectionnées
  strongBorder: '#CFC6B2', // bouton Google, bouton « Changer », bouton + (ancien)
  track: '#E6DDCB', // piste de la jauge d'eau

  // Sémantique
  water: '#3E77A8', // jauge d'eau, gouttes
  thirstyDot: '#D99A12', // pastille « A soif »
  okDot: '#4F8350', // pastille « Eau dans… »
  danger: '#A23B1F', // « Se déconnecter »
  warnText: '#8A5A00', // conseil de lumière
  blush: '#E98B6B', // joues de la mascotte
  disabledBg: '#B9B4A6',
  disabledFg: '#2E3530',

  // Écrans sombres (lancement, plante ajoutée)
  darkText: '#F3EEE3',
  darkMuted: '#C9D6C0',

  // Lancement
  splashStem: '#8DB46A',
  splashLeaf: '#6E9F4E',

  // Boutons fournisseurs
  apple: '#141414',
  appleRing: '#5A5A5A',

  // Rôles ajoutés pour le mode sombre (mêmes valeurs qu'avant en clair).
  onSun: '#1F3D2B', // texte et icônes posés sur le jaune (bouton « J'ai arrosé », onglet actif, +)
  heroBg: '#1F3D2B', // fond des écrans sombres (lancement, plante ajoutée)
  sheet: '#FFFFFF', // feuilles du bas
  onLight: '#1C2A21', // texte sur un fond blanc fixe (bouton Google)
  toastIcon: '#E8B931', // coche du toast (fond ink)
  navBg: '#1F3D2B', // barre d'onglets
  onNav: '#F3EEE3', // libellés et icônes de l'onglet inactif

  overlay: 'rgba(15,30,20,0.45)',
  todoRow: 'rgba(251,248,241,0.7)',
  badgeBg: 'rgba(251,248,241,0.85)',
};

export type Palette = { [K in keyof typeof lightColors]: string };

/**
 * Mode sombre (Réglages) — non maquetté : mêmes rôles, fond vert nuit. Les verts « forêt » deviennent
 * clairs (titres, boutons pleins), les fonds teintés (sauge, beurre) s'assombrissent, le jaune reste.
 * Contrastes texte ≥ 4.5:1 sur bg/surface.
 */
export const darkColors: Palette = {
  bg: '#121A15',
  surface: '#1C2620',
  well: '#26322A',
  surfaceAlt: '#18211B',
  white: '#FFFFFF',

  forest: '#A9D18E',
  forest2: '#7FB46C',
  forestText: '#C9D6C0',

  ink: '#E9E4D8',
  inkMuted: '#A7B1A0',
  inkSoft: '#C6CCBE',

  sun: '#E8B931',
  sunDeep: '#E8B931',
  potBody: '#D6A132',
  potShadow: '#B88424',
  butter: '#3A3219',
  sage: '#22352A',
  sageDeep: '#2A4232',
  sagePale: '#1F2E24',
  sageLine: '#5E7A58',
  sageDash: '#5E7A58',

  line: '#2E3A31',
  lineSoft: '#26302A',
  inputBorder: '#3A473D',
  strongBorder: '#4A584D',
  track: '#2E3A31',

  water: '#6FA3D1',
  thirstyDot: '#E8B931',
  okDot: '#7DB07A',
  danger: '#EE8A6E',
  warnText: '#E8B931',
  blush: '#E98B6B',
  disabledBg: '#3A433C',
  disabledFg: '#A7B1A0',

  darkText: '#F3EEE3',
  darkMuted: '#C9D6C0',

  splashStem: '#8DB46A',
  splashLeaf: '#6E9F4E',

  apple: '#000000',
  appleRing: '#5A5A5A',

  onSun: '#1F3D2B',
  heroBg: '#1F3D2B',
  sheet: '#1C2620',
  onLight: '#1C2A21',
  toastIcon: '#2F5A3A',
  navBg: '#2A372E',
  onNav: '#E9E4D8',

  overlay: 'rgba(0,0,0,0.6)',
  todoRow: 'rgba(28,38,32,0.7)',
  badgeBg: 'rgba(28,38,32,0.85)',
};
