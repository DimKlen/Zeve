import { CHAT_REPLY_KIND } from '@/features/chat/replyNotification';

import { FOLLOWUP_KIND } from './kinds';

/** Destination d'une notification touchée (docs/05 « Liens profonds », F21, F22). */
export function targetOf(data: Record<string, unknown> | undefined): {
  to: 'plant' | 'chat' | 'garden';
  id?: string;
} {
  const plantId = typeof data?.plantId === 'string' && data.plantId ? data.plantId : undefined;
  // Réponse du chat ou suivi de soins → le fil ; une plante → sa fiche ; plusieurs → le jardin.
  if (plantId && (data?.kind === CHAT_REPLY_KIND || data?.kind === FOLLOWUP_KIND)) {
    return { to: 'chat', id: plantId };
  }
  if (plantId) return { to: 'plant', id: plantId };
  return { to: 'garden' };
}
