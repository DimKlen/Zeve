// Tokens de design Zeve — valeurs exactes du prototype Claude Design.
// Toute couleur / taille utilisée dans l'app DOIT venir d'ici (aucun hex en dur dans les écrans).
// Couleurs : lues via useColors() / makeStyles() (./scheme), qui suivent le mode clair/sombre.

export { darkColors, lightColors, type Palette } from './colors';

export const fonts = {
  display: 'BricolageGrotesque_700Bold', // titres (opsz auto)
  displayMedium: 'BricolageGrotesque_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

// Échelle typographique (px). letterSpacing en px = em × fontSize.
export const type = {
  splash: { fontFamily: fonts.display, fontSize: 56, letterSpacing: -1.68 },
  hero: { fontFamily: fonts.display, fontSize: 48, letterSpacing: -1.44 }, // « Zeve » sur Connexion
  catalog: { fontFamily: fonts.display, fontSize: 40, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 32, letterSpacing: -0.64 }, // Mon jardin, Réglages
  onboarding: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.6 },
  added: { fontFamily: fonts.display, fontSize: 28 }, // « Lianne est chez elle ! »
  subTitle: { fontFamily: fonts.display, fontSize: 24 }, // Nouvelle plante, Choisir une espèce, Connexion via…
  plantName: { fontFamily: fonts.display, fontSize: 22 },
  bodyL: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyS: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.72,
    textTransform: 'uppercase' as const,
  },
  button: { fontFamily: fonts.bodyBold, fontSize: 16 },
  buttonL: { fontFamily: fonts.bodyBold, fontSize: 17 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13 }, // libellés de champs
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
  // Compléments relevés dans le prototype (composants de la Phase 1).
  buttonS: { fontFamily: fonts.bodySemi, fontSize: 14 }, // « J'ai arrosé » (ligne), chips pièce/suggestion, toast, valeur de tuile
  textButton: { fontFamily: fonts.bodySemi, fontSize: 15 }, // « Continuer avec un e-mail »
  stepLabel: { fontFamily: fonts.bodyBold, fontSize: 13 }, // étapes de croissance
  lightHint: { fontFamily: fonts.bodyMedium, fontSize: 12 }, // indice des choix de lumière
  tab: { fontFamily: fonts.bodyBold, fontSize: 14 }, // libellés de la barre de nav
  badge: { fontFamily: fonts.bodyBold, fontSize: 11 }, // badges de stade
  hint: { fontFamily: fonts.body, fontSize: 11 }, // indices des étapes de croissance
} as const;

export const space = {
  xxs: 4,
  xs: 6,
  s: 8,
  sm: 10,
  m: 12,
  ml: 14,
  l: 18,
  xl: 20,
  xxl: 22,
  x3: 26,
  x4: 28,
  x5: 34,
} as const;

export const layout = {
  screenPadTabs: 22, // Jardin, Réglages, Connexion, Bienvenue
  screenPadDetail: 18, // Fiche, Chat, Création, Liste
  headerTopTabs: 60, // padding-top des écrans à onglets (inclut la zone de statut ; remplacer par insets.top + 6)
  headerTopDetail: 54, // insets.top + 0
  bottomNavClearance: 120, // padding-bottom du contenu scrollable au-dessus de la barre de nav
  touchMin: 44,
} as const;

export const radius = {
  chip: 19, // h 38
  sm: 14, // étapes croissance, choix Partager/Masquer, vignette liste
  md: 16, // champs texte, choix lumière, vignettes
  lg: 18, // tuiles d'info, carte chat, permissions
  xl: 20, // carte espèce, bulles de chat (20/20/6/20)
  card: 22, // cartes plantes, boutons photo, alerte système
  section: 24, // carte « À arroser », sections Réglages, toast
  sheet: 26, // haut de la feuille OAuth
  nav: 32,
  pill: 999,
} as const;

export const shadow = {
  plusButton: {
    shadowColor: '#C48A0E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nav: {
    shadowColor: '#1F3D2B',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  toast: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  notifCard: {
    shadowColor: '#1F3D2B',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  bubble: {
    shadowColor: '#1F3D2B',
    shadowOpacity: 0.06,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  toggleKnob: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
} as const;

// Tailles de contrôles
export const control = {
  primaryButton: 56, // CTA pleine largeur (r 28)
  waterButton: 58, // « J'ai arrosé » de la fiche (r 29)
  providerButton: 56,
  inputTall: 52, // e-mail
  input: 50, // nom de la plante
  chatInput: 48,
  roundIcon: 44, // retour, options, fermer
  roundIconL: 48, // + du jardin, photo/envoyer du chat
  smallButton: 44, // « J'ai arrosé » de la carte, « Changer »
  chip: 38, // catégories
  suggestion: 40, // suggestions de chat
  roomChip: 44,
  lightOption: 64,
  navHeight: 64,
  navWidth: 240,
  navItem: 52,
  toggle: { w: 56, h: 34, knob: 28 },
} as const;

/** Accessibilité (docs/11) : titres limités à 130 % de la taille de police du système. */
export const a11y = { maxTitleScale: 1.3 } as const;

export {
  makeStyles,
  useColorScheme,
  useColors,
  useSchemeHydrated,
  useSchemeStore,
  type ColorScheme,
} from './scheme';
