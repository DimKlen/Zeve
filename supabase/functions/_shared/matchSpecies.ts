// Correspondance entre les résultats Pl@ntNet (noms latins à jour) et le catalogue Zeve (52 espèces).
// Module pur, sans API Deno : partagé par l'Edge Function identify-species et testé par Jest.

export type CatalogEntry = { id: string; latin: string };

export type PlantNetResult = {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    genus?: { scientificNameWithoutAuthor: string };
  };
};

export type Identification = {
  speciesId: string | null;
  confidence: number;
  alternatives: string[];
};

/** Confiance plafonnée quand seul le genre correspond : déclenche « Pas sûr à 100 % ». */
export const GENUS_ONLY_CONFIDENCE = 0.5;
const MAX_ALTERNATIVES = 2;

/** Noms reclassés ou synonymes courants → nom latin du catalogue. */
const SYNONYMS: Record<string, string> = {
  'sansevieria trifasciata': 'dracaena trifasciata',
  'sansevieria cylindrica': 'dracaena angolensis',
  'calathea orbifolia': 'goeppertia orbifolia',
  'calathea makoyana': 'goeppertia makoyana',
  'schefflera arboricola': 'heptapleurum arboricola',
  'philodendron bipinnatifidum': 'thaumatophyllum bipinnatifidum',
  'philodendron selloum': 'thaumatophyllum bipinnatifidum',
  'rosmarinus officinalis': 'salvia rosmarinus',
  'haworthia attenuata': 'haworthiopsis attenuata',
  'haworthia fasciata': 'haworthiopsis attenuata',
  'haworthiopsis fasciata': 'haworthiopsis attenuata',
  'aloe barbadensis': 'aloe vera',
  'philodendron scandens': 'philodendron hederaceum',
  'streptocarpus ionanthus': 'saintpaulia ionantha',
  'chrysalidocarpus lutescens': 'dypsis lutescens',
  'citrus limon': 'citrus meyeri',
  'scindapsus aureus': 'epipremnum aureum',
};

/** Minuscules, sans accents ni signe d'hybride (×), espaces normalisés. */
export function normalizeLatin(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/×/g, ' ')
    .replace(/\s+x\s+/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const genusOf = (latin: string) => normalizeLatin(latin).split(' ')[0] ?? '';

type Candidate = { id: string; score: number };

/** Meilleure espèce du catalogue, sa confiance et jusqu'à 2 alternatives (docs/06 F7). */
export function matchSpecies(results: PlantNetResult[], catalog: CatalogEntry[]): Identification {
  const byLatin = new Map(catalog.map((c) => [normalizeLatin(c.latin), c.id]));
  const byGenus = new Map<string, string[]>();
  for (const c of catalog) {
    const g = genusOf(c.latin);
    byGenus.set(g, [...(byGenus.get(g) ?? []), c.id]);
  }

  const candidates: Candidate[] = [];
  for (const r of [...results].sort((a, b) => b.score - a.score)) {
    const name = normalizeLatin(r.species.scientificNameWithoutAuthor);
    const exact = byLatin.get(name) ?? byLatin.get(SYNONYMS[name] ?? '');
    if (exact) {
      candidates.push({ id: exact, score: r.score });
      continue;
    }
    const genus = normalizeLatin(r.species.genus?.scientificNameWithoutAuthor ?? genusOf(name));
    for (const id of byGenus.get(genus) ?? []) {
      candidates.push({ id, score: Math.min(r.score, GENUS_ONLY_CONFIDENCE) });
    }
  }

  const seen = new Set<string>();
  const unique = candidates.filter((c) => !seen.has(c.id) && seen.add(c.id));
  const [best, ...rest] = unique;
  if (!best) return { speciesId: null, confidence: 0, alternatives: [] };
  return {
    speciesId: best.id,
    confidence: Math.round(best.score * 100) / 100,
    alternatives: rest.slice(0, MAX_ALTERNATIVES).map((c) => c.id),
  };
}
