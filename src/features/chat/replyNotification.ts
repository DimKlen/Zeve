// Réponse du chat arrivée ailleurs (docs/06 F21) : notification locale « Gaston t'a répondu ».
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { t } from '@/i18n';

export const CHAT_REPLY_KIND = 'chatReply';
const PREVIEW_MAX = 110;

// Fil affiché à l'écran (tenu à jour par l'écran de chat).
let openChat: string | null = null;

/** L'écran de chat de `plantId` prend le focus (`true`) ou le perd (`false`). */
export function setChatOpen(plantId: string, open: boolean) {
  if (open) openChat = plantId;
  else if (openChat === plantId) openChat = null;
}

/** La personne lit ce fil en ce moment : app au premier plan et écran de chat affiché. */
export function isReading(
  plantId: string,
  appState: string | null | undefined = AppState.currentState,
) {
  return appState === 'active' && openChat === plantId;
}

/** Titre et début de la réponse, sans la mise en forme Markdown, coupé à un mot. */
export function replyNotification(name: string, reply: string) {
  const text = reply
    .replace(/[*_#`>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  let body = text;
  if (text.length > PREVIEW_MAX) {
    const cut = text.slice(0, PREVIEW_MAX);
    const space = cut.lastIndexOf(' ');
    body = `${(space > PREVIEW_MAX / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, '')}…`;
  }
  return { title: t('chat.replyNotifTitle', { name }), body };
}

/**
 * Prévient que la plante a répondu si la personne n'est pas sur ce fil (autre écran, app en
 * arrière-plan). Rien si les notifications sont refusées. App fermée : la réponse n'arrive pas.
 */
export async function notifyChatReply(plant: { id: string; nickname: string }, reply: string) {
  if (Platform.OS === 'web' || isReading(plant.id)) return;
  const permission = await Notifications.getPermissionsAsync().catch(() => null);
  if (!permission?.granted) return;
  const { title, body } = replyNotification(plant.nickname, reply);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { kind: CHAT_REPLY_KIND, plantId: plant.id } },
    trigger: null,
  }).catch(() => undefined);
}
