// Rappels quotidiens (docs/06 F9) : un par jour à l'heure choisie, seulement si une plante a soif ce jour-là.
import { t } from '@/i18n';
import { plantStatus, type PlantRow } from '@/plants/plantStatus';

export type PlannedReminder = {
  date: Date;
  title: string;
  body: string;
  /** Plante ciblée par le tap (une seule plante assoiffée), sinon Jardin. */
  plantId: string | null;
};

/** Jours planifiés à l'avance ; recalculés à chaque ouverture et mutation. */
export const PLAN_DAYS = 7;

/** « 09:00:00 » → { hours: 9, minutes: 0 } */
export function parseTime(value: string): { hours: number; minutes: number } {
  const [h = '9', m = '0'] = value.split(':');
  return { hours: Number(h), minutes: Number(m) };
}

/** « 9 h 00 » */
export function formatTime(value: string): string {
  const { hours, minutes } = parseTime(value);
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
}

export function planDailyReminders(
  plants: PlantRow[],
  reminderTime: string,
  now = new Date(),
  days = PLAN_DAYS,
): PlannedReminder[] {
  const { hours, minutes } = parseTime(reminderTime);
  const out: PlannedReminder[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, hours, minutes);
    if (date <= now) continue; // l'heure du jour est passée
    // État à l'heure du rappel, en supposant qu'on n'arrose pas d'ici là.
    const thirsty = plants
      .map((plant) => ({ plant, s: plantStatus(plant, date) }))
      .filter((x) => x.s.thirsty)
      .sort((a, b) => b.s.daysSinceWater - a.s.daysSinceWater);
    const [first, ...others] = thirsty;
    if (!first) continue;
    if (!others.length) {
      const daysWithout = first.s.daysSinceWater;
      out.push({
        date,
        title: first.plant.nickname,
        body:
          daysWithout > 0
            ? t('notifications.oneBody', { days: daysWithout })
            : t('notifications.oneBodyToday'),
        plantId: first.plant.id,
      });
    } else {
      out.push({
        date,
        title: t('notifications.manyTitle'),
        body:
          others.length === 1
            ? t('notifications.manyBodyOne', { name: first.plant.nickname })
            : t('notifications.manyBody', { name: first.plant.nickname, n: others.length }),
        plantId: null,
      });
    }
  }
  return out;
}
