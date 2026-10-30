// Transitions d'écran (docs/03 §2) : seul l'écran entrant s'anime. La pile native n'anime rien
// (animation: 'none') ; `go()` choisit l'animation d'entrée selon la paire (origine → destination)
// et `Screen` la joue quand il prend le focus.
import { router, type Href } from 'expo-router';

import type { ScreenAnim } from './index';

export type ScreenKey =
  | 'launch'
  | 'login'
  | 'connecting'
  | 'reminders'
  | 'garden'
  | 'settings'
  | 'plant'
  | 'chat'
  | 'newPlant'
  | 'species'
  | 'added'
  | 'rooms'
  | 'privacy'
  | 'devPlants'
  | 'devKitchen';

type Params = { id?: string };

const ROUTES: Record<ScreenKey, (p: Params) => Href> = {
  launch: () => '/',
  login: () => '/login',
  connecting: () => '/connecting',
  reminders: () => '/reminders',
  garden: () => '/garden',
  settings: () => '/settings',
  plant: ({ id = '' }) => `/plant/${id}`,
  chat: ({ id = '' }) => `/plant/${id}/chat`,
  newPlant: () => '/new-plant',
  species: () => '/new-plant/species',
  added: () => '/new-plant/added',
  rooms: () => '/settings/rooms',
  privacy: () => '/settings/privacy',
  devPlants: () => '/dev/plants',
  devKitchen: () => '/dev/kitchen',
};

/** Table complète de docs/03 §2 : `origine>destination` → animation de l'écran entrant. */
export const TRANSITIONS: Partial<Record<`${ScreenKey}>${ScreenKey}`, ScreenAnim>> = {
  'launch>login': 'fade',
  'launch>garden': 'fade',
  'launch>reminders': 'fade',
  'login>connecting': 'fade',
  'connecting>reminders': 'fwd',
  'connecting>garden': 'fade',
  'reminders>garden': 'up',
  'garden>plant': 'zoom',
  'plant>garden': 'back',
  'plant>chat': 'fwd',
  'chat>plant': 'back',
  'garden>settings': 'fade',
  'settings>garden': 'fade',
  'garden>newPlant': 'up',
  'newPlant>garden': 'back',
  'newPlant>species': 'fwd',
  'species>newPlant': 'back',
  'newPlant>added': 'up',
  'added>plant': 'zoom',
  'added>newPlant': 'up',
  'settings>login': 'back',
  'settings>rooms': 'fwd',
  'settings>privacy': 'fwd',
};

/** Animation par défaut quand la paire n'est pas dans la table : aller vers un écran « enfant ». */
const DEFAULT_ANIM: ScreenAnim = 'fwd';

export function transitionFor(from: ScreenKey | null, to: ScreenKey): ScreenAnim {
  if (!from) return 'fade';
  return TRANSITIONS[`${from}>${to}`] ?? DEFAULT_ANIM;
}

// Écran affiché (tenu à jour par Screen) et animation en attente pour le prochain écran focalisé.
let current: ScreenKey | null = null;
let pending: ScreenAnim | null = null;

export function setCurrentScreen(key: ScreenKey) {
  current = key;
}

/** Animation demandée par la dernière navigation ; consommée par l'écran qui prend le focus. */
export function takePendingAnim(): ScreenAnim | null {
  const anim = pending;
  pending = null;
  return anim;
}

type GoOptions = Params & { replace?: boolean; anim?: ScreenAnim };

/** Navigue vers `to` avec l'animation de la table (ou `anim` pour forcer). */
export function go(to: ScreenKey, { replace = false, anim, ...params }: GoOptions = {}) {
  pending = anim ?? transitionFor(current, to);
  const href = ROUTES[to](params);
  if (replace) router.replace(href);
  else router.push(href);
}

/** Retour : l'écran retrouvé rejoue `back` (comme le geste iOS et le bouton Android). */
export function goBack() {
  pending = 'back';
  router.back();
}

/** Pour les tests. */
export function resetTransitions() {
  current = null;
  pending = null;
}
