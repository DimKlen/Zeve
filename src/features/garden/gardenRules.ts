// Règles du jardin (docs/06 F3) : carte « À arroser aujourd'hui », tri de la grille, sous-titre.
import { t } from '@/i18n';
import { plantStatus, thirstLine, type PlantStatus } from '@/plants/plantStatus';

export type GardenPlant = {
  id: string;
  nickname: string;
  speciesId: string;
  speciesName: string;
  latin: string;
  roomId: string | null;
  roomName: string | null;
  light: 'ombre' | 'indirect' | 'soleil';
  lightLabel: string;
  air: string;
  tip: string;
  createdAt: Date;
  waterEveryDays: number;
  lastWateredAt: Date | null;
  /** Avant-dernier arrosage : savoir si une plante arrosée aujourd'hui avait soif. */
  previousWateredAt: Date | null;
};

export const statusOf = (p: GardenPlant, now = new Date()): PlantStatus => plantStatus(p, now);

/** Plante arrosée aujourd'hui qui avait soif avant cet arrosage. */
export function wasThirstyBeforeToday(p: GardenPlant, now = new Date()): boolean {
  const s = statusOf(p, now);
  if (!s.wateredToday) return false;
  return plantStatus({ ...p, lastWateredAt: p.previousWateredAt }, now).thirsty;
}

export type TodoItem = {
  plant: GardenPlant;
  /** Déjà arrosée aujourd'hui (badge « ✓ Arrosé »). */
  done: boolean;
  /** « 9 j sans eau » (avant l'arrosage du jour pour une ligne faite). */
  sinceLabel: string;
  daysSinceWater: number;
};

/** Lignes de la carte « À arroser aujourd'hui », la plus assoiffée en premier. */
export function todoList(plants: GardenPlant[], now = new Date()): TodoItem[] {
  const items: TodoItem[] = [];
  for (const plant of plants) {
    const s = statusOf(plant, now);
    if (s.thirsty) {
      items.push({
        plant,
        done: false,
        sinceLabel: s.sinceLabel,
        daysSinceWater: s.daysSinceWater,
      });
    } else if (wasThirstyBeforeToday(plant, now)) {
      const before = plantStatus({ ...plant, lastWateredAt: plant.previousWateredAt }, now);
      items.push({
        plant,
        done: true,
        sinceLabel: before.sinceLabel,
        daysSinceWater: before.daysSinceWater,
      });
    }
  }
  return items.sort((a, b) => b.daysSinceWater - a.daysSinceWater);
}

/**
 * Grille : assoiffées d'abord (plus de jours sans eau en premier), puis date d'ajout croissante.
 * Une plante arrosée aujourd'hui qui avait soif garde sa place : elle se redresse sur place (07b).
 */
export function sortGarden(plants: GardenPlant[], now = new Date()): GardenPlant[] {
  const keyed = plants.map((plant) => {
    const s = statusOf(plant, now);
    if (s.thirsty) return { plant, thirsty: true, days: s.daysSinceWater };
    if (wasThirstyBeforeToday(plant, now)) {
      const before = plantStatus({ ...plant, lastWateredAt: plant.previousWateredAt }, now);
      return { plant, thirsty: true, days: before.daysSinceWater };
    }
    return { plant, thirsty: false, days: 0 };
  });
  keyed.sort((a, b) => {
    if (a.thirsty !== b.thirsty) return a.thirsty ? -1 : 1;
    if (a.thirsty && a.days !== b.days) return b.days - a.days;
    return a.plant.createdAt.getTime() - b.plant.createdAt.getTime();
  });
  return keyed.map((x) => x.plant);
}

/** « 6 plantes · 2 ont soif aujourd’hui » */
export function gardenSubtitle(plants: GardenPlant[], now = new Date()): string {
  const thirsty = plants.filter((p) => statusOf(p, now).thirsty).length;
  const thirst = thirstLine(thirsty);
  return plants.length === 1
    ? t('garden.countOne', { thirst })
    : t('garden.count', { count: plants.length, thirst });
}
