// Tokens d'animation Zeve — valeurs exactes du prototype Claude Design (keyframes CSS → Reanimated).
// Règle : toute animation passe par ces constantes. Si useReducedMotion() est vrai, durée 0 et pas de boucle.
import { Easing, Keyframe } from 'react-native-reanimated';

export const ease = {
  /** Courbe principale des transitions d'écran : cubic-bezier(.22,.8,.24,1) */
  screen: Easing.bezierFn(0.22, 0.8, 0.24, 1),
  /** Feuilles, alertes, toasts : cubic-bezier(.22,.9,.24,1) */
  sheet: Easing.bezierFn(0.22, 0.9, 0.24, 1),
  /** Pousse du lancement (léger dépassement) : cubic-bezier(.3,1.5,.5,1) */
  overshoot: Easing.bezierFn(0.3, 1.5, 0.5, 1),
  inOut: Easing.inOut(Easing.ease),
  in: Easing.in(Easing.ease),
  out: Easing.out(Easing.ease),
  linear: Easing.linear,
} as const;

export const duration = {
  screen: 440, // fwd / back
  screenUp: 500, // up, zoom, fade
  sheet: 500,
  dim: 300,
  alert: 320,
  rise: 550,
  stagger: 80, // d1..d4 = 80/160/240/320 ms
  press: 150,
  toast: 400,
  toastVisible: 2600,
  colorChange: 600, // halo, feuilles, inclinaison de la mascotte
  gauge: 800,
  buttonBg: 300,
  toggle: 250,
  sway: 4500, // aller-retour complet
  bob: 3200,
  blinkCycle: 5000,
  drop: 1100,
  pop: 500,
  spin: 1100,
  typingDot: 1200,
} as const;

// ——— Transitions d'écran (entrée de l'écran qui arrive ; l'écran sortant disparaît sans animation) ———
// fwd  : translateX 60 → 0 + opacité 0 → 1, 440 ms, ease.screen  (aller vers un écran « enfant »)
// back : translateX -60 → 0 + opacité, 440 ms                     (retour)
// up   : translateY 90 → 0 + opacité, 500 ms                      (ouverture modale : Nouvelle plante, Plante ajoutée, fin d'onboarding)
// fade : opacité 0 → 1, 500 ms, ease                              (onglets, lancement → connexion, connexion → en cours)
// zoom : scale 0.92 → 1 + opacité, 500 ms                         (ouverture d'une fiche plante)
export const screenEnter = {
  fwd: new Keyframe({ 0: { opacity: 0, transform: [{ translateX: 60 }] }, 100: { opacity: 1, transform: [{ translateX: 0 }], easing: ease.screen } }).duration(duration.screen),
  back: new Keyframe({ 0: { opacity: 0, transform: [{ translateX: -60 }] }, 100: { opacity: 1, transform: [{ translateX: 0 }], easing: ease.screen } }).duration(duration.screen),
  up: new Keyframe({ 0: { opacity: 0, transform: [{ translateY: 90 }] }, 100: { opacity: 1, transform: [{ translateY: 0 }], easing: ease.screen } }).duration(duration.screenUp),
  fade: new Keyframe({ 0: { opacity: 0 }, 100: { opacity: 1, easing: ease.inOut } }).duration(duration.screenUp),
  zoom: new Keyframe({ 0: { opacity: 0, transform: [{ scale: 0.92 }] }, 100: { opacity: 1, transform: [{ scale: 1 }], easing: ease.screen } }).duration(duration.screenUp),
};
export type ScreenAnim = keyof typeof screenEnter;

// ——— Entrées d'éléments ———
// rise : translateY 26 → 0 + opacité, 550 ms ease.screen ; délais d1=80, d2=160, d3=240, d4=320, d5=600, d6=1000 ms
export const rise = (delayMs = 0) =>
  new Keyframe({ 0: { opacity: 0, transform: [{ translateY: 26 }] }, 100: { opacity: 1, transform: [{ translateY: 0 }], easing: ease.screen } })
    .duration(duration.rise).delay(delayMs);
export const riseDelay = { d0: 0, d1: 80, d2: 160, d3: 240, d4: 320, d5: 600, d6: 1000 } as const;

// sheet : translateY 100% → 0, 500 ms ease.sheet (feuille OAuth)
// dim   : opacité 0 → 1, 300 ms (voile rgba(15,30,20,.45))
// alert : scale 1.1 → 1 + opacité, 320 ms ease.sheet (alerte système OAuth)
// toast : translateY -30 → 0 + opacité, 400 ms ease.sheet ; disparaît après 2.6 s (fondu 200 ms)
// notif : translateY -24 + scale .95 → 1, 600 ms, délai 500 ms (carte de notification de l'onboarding)
export const alertEnter = new Keyframe({ 0: { opacity: 0, transform: [{ scale: 1.1 }] }, 100: { opacity: 1, transform: [{ scale: 1 }], easing: ease.sheet } }).duration(duration.alert);
export const toastEnter = new Keyframe({ 0: { opacity: 0, transform: [{ translateY: -30 }] }, 100: { opacity: 1, transform: [{ translateY: 0 }], easing: ease.sheet } }).duration(duration.toast);
export const notifEnter = new Keyframe({ 0: { opacity: 0, transform: [{ translateY: -24 }, { scale: 0.95 }] }, 100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: ease.sheet } }).duration(600).delay(500);
// pop : scale .9 → 1.05 (60 %) → 1, 500 ms ease-out (badge « Arrosé », bouton après arrosage, carte espèce, disque « Plante ajoutée »)
export const popEnter = new Keyframe({ 0: { transform: [{ scale: 0.9 }] }, 60: { transform: [{ scale: 1.05 }] }, 100: { transform: [{ scale: 1 }], easing: ease.out } }).duration(duration.pop);

// ——— Boucles ———
// sway  : feuillage −2.5° ↔ +2.5°, 4.5 s ease-in-out infini, origine (50,62) du repère plante 100×110
// bob   : translateY 0 ↔ −6 px, 3.2 s ease-in-out ; trio de connexion décalé −1.1 s / −2.2 s
// blink : à 93 % → 96 % du cycle de 5 s, scaleY 1 → 0.1 → 1
// spin  : rotation 360° 1.1 s linéaire (anneau « Connexion via… », reconnaissance d'espèce)
// typing: 3 points, opacité .25 → 1 → .25 + translateY −3 px, 1.2 s, décalés de 0.2 s
// press : scale 0.96 au toucher, 150 ms (tous les éléments tappables marqués .press dans le prototype)

// ——— Lancement (splash) ———
// tige : tracé 0 → 100 % en 1 s ease-out, délai 0.2 s
// feuille gauche : scale 0 → 1 depuis le coin bas-droit, 0.55 s ease.overshoot, délai 0.8 s
// feuille droite : idem depuis le coin bas-gauche, délai 1 s
// bourgeon jaune : scale 0 → 1, délai 1 s ; mot « Zeve » : rise délai 0.6 s ; slogan : rise délai 1 s
// passage automatique à Connexion après 2.6 s (fade)
export const splashTimings = { stemDelay: 200, stem: 1000, leafL: 800, leafR: 1000, bud: 1000, word: 600, tagline: 1000, autoAdvance: 2600 } as const;

// ——— Délais métier simulés dans le prototype (à remplacer par les vrais événements) ———
export const flowTimings = { connectingMin: 1800, speciesRecognition: 1300, chatReplyTyping: 1400, magicLinkToast: 1600 } as const;
