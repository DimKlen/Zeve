// Mode « Découvrir » : candidats Pl@ntNet et fiche « découverte » (Gemini, JSON structuré).
// Module pur, sans API Deno : partagé par l'Edge Function discover-plant et testé par Jest.

export type Candidate = {
  latin: string;
  commonName: string | null;
  family: string | null;
  /** Confiance Pl@ntNet, 0..1. */
  score: number;
};

export const EDIBILITY = ['edible', 'partly', 'toxic', 'inedible', 'unknown'] as const;
export type Edibility = (typeof EDIBILITY)[number];

export type PlantFacts = {
  origin: string | null;
  edibility: { status: Edibility; note: string | null };
  humanUses: string[];
  wildlife: string[];
  funFacts: string[];
};

export const MAX_CANDIDATES = 3;
const MAX_TEXT = 320;
const MAX_ITEMS = 4;
const MAX_FUN_FACTS = 3;

type PlantNetSpecies = {
  scientificNameWithoutAuthor?: unknown;
  commonNames?: unknown;
  family?: { scientificNameWithoutAuthor?: unknown };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Réponse Pl@ntNet → 3 meilleurs candidats distincts, du plus probable au moins probable. */
export function parseCandidates(body: unknown): Candidate[] {
  const results = (body as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];
  const seen = new Set<string>();
  const out: Candidate[] = [];
  const sorted = [...results].sort(
    (a, b) => ((b as { score?: number }).score ?? 0) - ((a as { score?: number }).score ?? 0),
  );
  for (const r of sorted) {
    const species = (r as { species?: PlantNetSpecies }).species;
    const latin = typeof species?.scientificNameWithoutAuthor === 'string' ? species.scientificNameWithoutAuthor.trim() : '';
    if (!latin || seen.has(latin.toLowerCase())) continue;
    seen.add(latin.toLowerCase());
    const names = Array.isArray(species?.commonNames) ? species.commonNames : [];
    const common = names.find((n): n is string => typeof n === 'string' && n.trim().length > 0);
    const family = species?.family?.scientificNameWithoutAuthor;
    const score = (r as { score?: unknown }).score;
    out.push({
      latin,
      commonName: common ? capitalize(common.trim()) : null,
      family: typeof family === 'string' && family ? family : null,
      score: typeof score === 'number' ? Math.round(score * 100) / 100 : 0,
    });
    if (out.length === MAX_CANDIDATES) break;
  }
  return out;
}

/** Typographie française : espace insécable avant « : ; ? ! » » et après « « » (pas de ponctuation orpheline). */
const frenchSpacing = (t: string) =>
  t.replace(/«\s+/g, '« ').replace(/\s+([:;?!»])/g, ' $1');

const text = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = frenchSpacing(v.trim().replace(/\s+/g, ' '));
  if (!t) return null;
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1).trimEnd()}…` : t;
};
const list = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.flatMap((x) => (text(x) ? [text(x)!] : [])).slice(0, max) : [];

/**
 * Fiche renvoyée par Gemini → fiche sûre : textes nettoyés et bornés, listes courtes,
 * comestibilité inconnue au moindre doute (statut absent ou hors liste).
 */
export function normalizeFacts(raw: unknown): PlantFacts {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const e = (o.edibility && typeof o.edibility === 'object' ? o.edibility : {}) as Record<string, unknown>;
  const status = EDIBILITY.includes(e.status as Edibility) ? (e.status as Edibility) : 'unknown';
  return {
    origin: text(o.origin),
    edibility: { status, note: text(e.note) },
    humanUses: list(o.humanUses, MAX_ITEMS),
    wildlife: list(o.wildlife, MAX_ITEMS),
    funFacts: list(o.funFacts, MAX_FUN_FACTS),
  };
}

/** Schéma de sortie imposé à Gemini (generationConfig.responseSchema). */
export const FACTS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    origin: { type: 'STRING', nullable: true },
    edibility: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: [...EDIBILITY] },
        note: { type: 'STRING', nullable: true },
      },
      required: ['status'],
    },
    humanUses: { type: 'ARRAY', items: { type: 'STRING' } },
    wildlife: { type: 'ARRAY', items: { type: 'STRING' } },
    funFacts: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['origin', 'edibility', 'humanUses', 'wildlife', 'funFacts'],
} as const;

/** Consigne de la fiche « découverte » : prudente, en français, tutoiement. */
export function factsPrompt(c: Pick<Candidate, 'latin' | 'commonName' | 'family'>): string {
  const name = c.commonName ? `${c.commonName} (${c.latin})` : c.latin;
  return [
    `Rédige une courte fiche « découverte » sur la plante ${name}${c.family ? `, famille ${c.family}` : ''}.`,
    'Écris en français, en tutoyant le lecteur, avec chaleur et simplicité. Phrases courtes (1 ou 2 par élément).',
    'Sois prudent et factuel : n’invente jamais. Si tu ne sais pas, mets null ou une liste vide.',
    'origin : région d’origine et milieu naturel.',
    'edibility.status : edible (comestible), partly (seulement certaines parties ou après préparation), ' +
      'toxic (toxique pour l’humain), inedible (sans danger connu mais non consommée), unknown (doute). ' +
      'En cas de doute, unknown. edibility.note : quelles parties, préparation, ou danger ; ' +
      'ne conseille jamais d’en manger.',
    'humanUses : 2 à 4 usages humains (cuisine, médecine traditionnelle au conditionnel, artisanat, ornement).',
    'wildlife : 1 à 4 liens avec la faune (qui s’en nourrit, pollinisateurs, abri, toxicité pour les animaux).',
    'funFacts : 2 ou 3 anecdotes surprenantes et vérifiées.',
  ].join('\n');
}

/** Simulation (DISCOVER_MOCK=1) : un pissenlit, déterministe, pour le local, la CI et les E2E. */
export const MOCK_CANDIDATES: Candidate[] = [
  { latin: 'Taraxacum officinale', commonName: 'Pissenlit', family: 'Asteraceae', score: 0.87 },
  { latin: 'Hypochaeris radicata', commonName: 'Porcelle enracinée', family: 'Asteraceae', score: 0.06 },
  { latin: 'Crepis capillaris', commonName: 'Crépide capillaire', family: 'Asteraceae', score: 0.03 },
];

export function mockFacts(latin: string): PlantFacts {
  if (latin !== MOCK_CANDIDATES[0]!.latin) {
    return {
      origin: null,
      edibility: { status: 'unknown', note: null },
      humanUses: [],
      wildlife: [],
      funFacts: [],
    };
  }
  return {
    origin: 'Originaire d’Europe et d’Asie, il pousse aujourd’hui presque partout : prairies, talus, bords de chemins.',
    edibility: {
      status: 'edible',
      note: 'Jeunes feuilles en salade et fleurs en confiture, à condition de les cueillir loin des routes.',
    },
    humanUses: [
      'Ses racines torréfiées remplaçaient autrefois le café.',
      'On le disait diurétique, d’où son surnom de « pisse-au-lit ».',
    ],
    wildlife: [
      'Ses fleurs nourrissent les abeilles au tout début du printemps.',
      'Les chardonnerets raffolent de ses graines.',
    ],
    funFacts: [
      'Chaque « aigrette » peut parcourir plusieurs kilomètres portée par le vent.',
      'Sa fleur est en réalité un bouquet de 100 à 200 petites fleurs.',
    ],
  };
}
