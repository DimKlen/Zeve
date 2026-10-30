// Recherche du catalogue (docs/06 F6) : nom, latin et type, sans accents ; catégorie ; tri alphabétique fr.
import { FORM_INFO, type Category } from '@/plants/careInfo';
import { normalize } from '@/plants/plantStatus';
import { SPECIES, type Species } from '@/plants/species';

export const typeLabel = (s: Species) => FORM_INFO[s.form].label;
export const categoryOf = (s: Species): Category => FORM_INFO[s.form].cat;

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

export function searchSpecies(query: string, category: Category | 'all' = 'all'): Species[] {
  const q = normalize(query.trim());
  return SPECIES.filter((s) => category === 'all' || categoryOf(s) === category)
    .filter(
      (s) =>
        !q ||
        normalize(s.name).includes(q) ||
        normalize(s.latin).includes(q) ||
        normalize(typeLabel(s)).includes(q),
    )
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** Rythme d'arrosage de départ, copié de l'espèce à la création (docs/06 F3). */
export const waterEveryDaysOf = (s: Species) => FORM_INFO[s.form].every;
