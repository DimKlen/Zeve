// Notifications de suivi de soins (docs/06 F22) : une par suivi ouvert, à l'heure des rappels.
import { parseTime } from '@/features/notifications/reminderPlan';
import { t } from '@/i18n';

export type FollowupRow = { plantId: string; nickname: string; topic: string; dueAt: Date };
export type PlannedFollowup = { date: Date; title: string; body: string; plantId: string };

/**
 * Le jour de l'échéance à l'heure des rappels ; si cette heure est passée (échéance aujourd'hui
 * ou dépassée), le prochain créneau à venir. La prise de nouvelles a lieu à l'ouverture du fil.
 */
export function planFollowups(
  rows: FollowupRow[],
  reminderTime: string,
  now = new Date(),
): PlannedFollowup[] {
  const { hours, minutes } = parseTime(reminderTime);
  return rows.map((row) => {
    let date = new Date(
      row.dueAt.getFullYear(),
      row.dueAt.getMonth(),
      row.dueAt.getDate(),
      hours,
      minutes,
    );
    if (date <= now) {
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      if (date <= now) date.setDate(date.getDate() + 1);
    }
    return {
      date,
      title: row.nickname,
      body: t('followup.notifBody', { name: row.nickname, topic: row.topic }),
      plantId: row.plantId,
    };
  });
}
