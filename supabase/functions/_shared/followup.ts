// Suivi de soins (docs/06 F22) : règles pures partagées par l'Edge Function plant-chat et l'app.

const DAY_MS = 86_400_000;
export const MAX_FOLLOWUP_DAYS = 30;
/** Prises de nouvelles au plus ; la suivante expire le suivi. */
export const MAX_CHECKS = 3;
/** Sans réponse après une prise de nouvelles, on redemande au bout de 3 jours. */
const RECHECK_DAYS = 3;

export type FollowupAction = { type: 'followup'; days: number; topic: string } | { type: 'followup_done' };

export type OpenFollowup = { id: string; topic: string; dueAt: Date; checks: number; createdAt: Date };

/** Ligne JSON d'action de suivi → action validée, sinon null. */
export function parseFollowup(action: unknown): FollowupAction | null {
  if (!action || typeof action !== 'object') return null;
  const a = action as { type?: unknown; days?: unknown; topic?: unknown };
  if (a.type === 'followup_done') return { type: 'followup_done' };
  if (a.type !== 'followup') return null;
  const days = Math.round(Number(a.days));
  const topic = typeof a.topic === 'string' ? a.topic.replace(/["{}<>\n]/g, '').trim() : '';
  if (!(days >= 1 && days <= MAX_FOLLOWUP_DAYS) || topic.length < 2 || topic.length > 60) return null;
  return { type: 'followup', days, topic };
}

/** « les cochenilles » → « cochenilles », « l’oïdium » → « oïdium » (ligne de la fiche). */
export function topicLabel(topic: string): string {
  return topic.replace(/^(les|la|le|des|du|de la|de l['’]|l['’])\s*/i, '').trim();
}

export type FollowupWrite =
  | { op: 'insert'; topic: string; dueAt: Date }
  | { op: 'update'; id: string; topic: string; dueAt: Date }
  | { op: 'resolve'; id: string };

/** Ce que l'action du modèle change au suivi de la plante (un seul suivi ouvert). */
export function applyFollowup(
  open: OpenFollowup | null,
  action: FollowupAction | null,
  now: Date,
): FollowupWrite | null {
  if (!action) return null;
  if (action.type === 'followup_done') return open ? { op: 'resolve', id: open.id } : null;
  const dueAt = new Date(now.getTime() + action.days * DAY_MS);
  return open
    ? { op: 'update', id: open.id, topic: action.topic, dueAt }
    : { op: 'insert', topic: action.topic, dueAt };
}

export type FollowupCheck =
  | { op: 'check'; id: string; checks: number; dueAt: Date; message: string }
  | { op: 'expire'; id: string };

/**
 * À l'ouverture du fil : si le suivi est échu, la plante prend des nouvelles (message ajouté au
 * fil, nouvelle échéance par défaut dans 3 jours) ; après 3 prises de nouvelles, il expire.
 */
export function dueCheck(open: OpenFollowup | null, now: Date): FollowupCheck | null {
  if (!open || open.dueAt.getTime() > now.getTime()) return null;
  if (open.checks >= MAX_CHECKS) return { op: 'expire', id: open.id };
  const days = Math.max(1, Math.round((now.getTime() - open.createdAt.getTime()) / DAY_MS));
  return {
    op: 'check',
    id: open.id,
    checks: open.checks + 1,
    dueAt: new Date(now.getTime() + RECHECK_DAYS * DAY_MS),
    message: checkMessage(open.topic, days),
  };
}

/** Message de la plante quand elle prend des nouvelles. */
export function checkMessage(topic: string, days: number): string {
  const since = days === 1 ? 'hier' : `il y a ${days} jours`;
  return (
    `Petit point sur ${topic} : on a commencé le traitement ${since}. ` +
    'Comment tu me trouves ? Dis-moi si tu vois encore des traces, ou si tout est rentré dans l’ordre.'
  );
}

/** Consignes de suivi ajoutées au prompt système. */
export function followupPrompt(open: OpenFollowup | null): string[] {
  const lines = [
    'Si ton humain·e te demande conseil pour soigner un problème (nuisibles, maladie, champignon, pourriture, feuilles qui jaunissent ou tombent) ' +
      'ou pour corriger un souci d’entretien dont l’évolution se verra avec le temps, termine par une ligne JSON seule pour reprendre de ses nouvelles plus tard, à la place du rappel :',
    '{"action":{"type":"followup","days":5,"topic":"les cochenilles"}} (days = jours avant de vérifier, 5 par défaut, entre 3 et 14 selon le temps que ton conseil met à se voir ; ' +
      'topic = le sujet de sa demande, avec son article, en 60 caractères max, par exemple « mes feuilles qui jaunissent »).',
    'Jamais de suivi pour une simple question d’information (quand arroser, quel pot, quelle lumière) sans problème à soigner.',
  ];
  if (!open) return lines;
  return [
    ...lines,
    `Suivi en cours : ${open.topic} (prise de nouvelles ${open.checks} sur ${MAX_CHECKS}). ` +
      'Si ton humain·e dit que c’est réglé, félicite-l·e et termine par {"action":{"type":"followup_done"}}. ' +
      'Si le problème persiste, conseille la suite et replanifie avec {"action":{"type":"followup","days":N,"topic":"…"}}.',
  ];
}
