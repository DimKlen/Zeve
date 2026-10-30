// Construction du fil de discussion (docs/04 §9) : séparateurs de date, salutation, éléments en cours.
import { t } from '@/i18n';
import { daysBetween } from '@/plants/plantStatus';

export type ChatAction = { type: 'remind'; days: number; label: string };

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  photoPath: string | null;
  actions: ChatAction[];
  createdAt: Date;
};

export type ThreadItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage }
  | { kind: 'greeting'; key: string; text: string };

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** « Aujourd'hui », « Hier » ou « 12 oct. ». */
export function dateLabel(date: Date, now = new Date()): string {
  const days = daysBetween(date, now);
  if (days <= 0) return t('chat.today');
  if (days === 1) return t('chat.yesterday');
  return shortDate.format(date);
}

/** Fil chronologique ; sans historique, la plante salue (docs/04 §9 « Premier message »). */
export function buildThread(
  messages: ChatMessage[],
  plantName: string,
  now = new Date(),
): ThreadItem[] {
  if (!messages.length) {
    return [
      { kind: 'date', key: 'date-today', label: t('chat.today') },
      { kind: 'greeting', key: 'greeting', text: t('chat.greeting', { name: plantName }) },
    ];
  }
  const items: ThreadItem[] = [];
  let lastLabel: string | null = null;
  for (const message of messages) {
    const label = dateLabel(message.createdAt, now);
    if (label !== lastLabel) {
      items.push({ kind: 'date', key: `date-${message.id}`, label });
      lastLabel = label;
    }
    items.push({ kind: 'message', key: message.id, message });
  }
  return items;
}
