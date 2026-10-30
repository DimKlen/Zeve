// Règles métier de l'état d'une plante (soif, jauge, humeur, textes) — à couvrir par des tests unitaires.
import { stageOf, type Stage } from './drawPlant';

export type PlantRow = {
  id: string;
  nickname: string;
  speciesId: string;
  createdAt: Date;
  waterEveryDays: number;
  lastWateredAt: Date | null;
};

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

export type PlantStatus = {
  stage: Stage;
  daysSinceCreated: number;
  daysSinceWater: number; // depuis le dernier arrosage (ou la création si jamais arrosée)
  daysUntilNext: number; // ≤ 0 : à arroser aujourd'hui
  thirsty: boolean;
  wateredToday: boolean;
  waterLevel: number; // 0..1 pour la jauge
  waterText: 'Sèche' | 'Bientôt' | 'Parfait';
  nextLabel: string; // « aujourd'hui », « demain », « dans 3 j »
  sinceLabel: string; // « 9 j sans eau »
};

export function plantStatus(p: PlantRow, now = new Date()): PlantStatus {
  const ref = p.lastWateredAt ?? p.createdAt;
  const daysSinceWater = Math.max(0, daysBetween(ref, now));
  const daysUntilNext = p.waterEveryDays - daysSinceWater;
  const thirsty = daysUntilNext <= 0;
  const wateredToday = !!p.lastWateredAt && daysBetween(p.lastWateredAt, now) === 0;
  const waterLevel = Math.min(1, Math.max(0, 1 - daysSinceWater / p.waterEveryDays));
  const daysSinceCreated = Math.max(0, daysBetween(p.createdAt, now));
  return {
    stage: stageOf(daysSinceCreated),
    daysSinceCreated,
    daysSinceWater,
    daysUntilNext,
    thirsty,
    wateredToday,
    waterLevel: thirsty
      ? Math.min(waterLevel, 0.18)
      : Math.max(waterLevel, wateredToday ? 0.92 : 0),
    waterText: thirsty ? 'Sèche' : waterLevel < 0.5 ? 'Bientôt' : 'Parfait',
    nextLabel:
      daysUntilNext <= 0
        ? 'aujourd’hui'
        : daysUntilNext === 1
          ? 'demain'
          : `dans ${daysUntilNext} j`,
    sinceLabel: `${daysSinceWater} j sans eau`,
  };
}

/** « avec toi depuis … » */
export function sinceText(d: number): string {
  if (d <= 0) return 'aujourd’hui';
  if (d < 14) return d + (d > 1 ? ' jours' : ' jour');
  if (d < 60) return Math.round(d / 7) + ' semaines';
  if (d < 365) return Math.round(d / 30) + ' mois';
  const y = Math.floor(d / 365),
    m = Math.round((d % 365) / 30);
  return y + (y > 1 ? ' ans' : ' an') + (m ? ' et ' + m + ' mois' : '');
}

/** Bulle de la mascotte sur la fiche. */
export function moodBubble(s: PlantStatus, justWatered: boolean): string {
  if (s.thirsty) return `J’ai un peu soif… (${s.sinceLabel})`;
  if (justWatered || s.wateredToday) return `Merci ! Prochain arrosage ${s.nextLabel}.`;
  return `Tout va bien, prochain arrosage ${s.nextLabel}.`;
}

/** Statut sous la carte du jardin. */
export function cardStatus(s: PlantStatus): string {
  if (s.thirsty) return 'A soif';
  if (s.wateredToday) return `Arrosée · eau ${s.nextLabel}`;
  return `Eau ${s.nextLabel}`;
}

/** Sous-titre du jardin. */
export function thirstLine(thirstyCount: number): string {
  if (thirstyCount === 0) return 'tout le monde est hydraté';
  return thirstyCount + (thirstyCount > 1 ? ' ont soif aujourd’hui' : ' a soif aujourd’hui');
}

/** Recherche d'espèces insensible aux accents et à la casse. */
export const normalize = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
