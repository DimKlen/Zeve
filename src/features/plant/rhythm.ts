// Suggestion de rythme d'une plante d'après ses arrosages (carte « Son vrai rythme »).
import type { GardenPlant } from '@/features/garden/gardenRules';
import { learnRhythm, rhythmSuggestion } from '@/plants/wateringModel';

/** Rythme suggéré, ou null s'il n'y a rien à proposer (pas assez d'arrosages, refus récent…). */
export function suggestionFor(plant: GardenPlant) {
  const learned = learnRhythm(plant.history, plant.waterEveryDays, plant.drying);
  const days = rhythmSuggestion(learned, plant.waterEveryDays, plant.declined);
  return days === null ? null : { days, usable: learned.usable };
}
