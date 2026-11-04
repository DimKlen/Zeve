import {
  FACTS_SCHEMA,
  factsPrompt,
  MOCK_CANDIDATES,
  mockFacts,
  normalizeFacts,
  parseCandidates,
} from '../../../supabase/functions/_shared/discover';
import { catalogMatch } from '../../../supabase/functions/_shared/matchSpecies';
import { SPECIES } from '@/plants/species';

const result = (latin: string, score: number, common?: string[], family?: string) => ({
  score,
  species: {
    scientificNameWithoutAuthor: latin,
    commonNames: common,
    family: family ? { scientificNameWithoutAuthor: family } : undefined,
  },
});

describe('parseCandidates', () => {
  it('garde les 3 meilleurs, distincts, avec nom commun en majuscule et famille', () => {
    const candidates = parseCandidates({
      results: [
        result('Hypochaeris radicata', 0.061, ['porcelle enracinée'], 'Asteraceae'),
        result('Taraxacum officinale', 0.8731, ['pissenlit', 'dent-de-lion'], 'Asteraceae'),
        result('Taraxacum officinale', 0.02),
        result('Crepis capillaris', 0.03, [], 'Asteraceae'),
        result('Bellis perennis', 0.01, ['pâquerette']),
      ],
    });
    expect(candidates).toEqual([
      { latin: 'Taraxacum officinale', commonName: 'Pissenlit', family: 'Asteraceae', score: 0.87 },
      {
        latin: 'Hypochaeris radicata',
        commonName: 'Porcelle enracinée',
        family: 'Asteraceae',
        score: 0.06,
      },
      { latin: 'Crepis capillaris', commonName: null, family: 'Asteraceae', score: 0.03 },
    ]);
  });

  it('ne casse pas sur une réponse vide ou inattendue', () => {
    expect(parseCandidates({})).toEqual([]);
    expect(parseCandidates(null)).toEqual([]);
    expect(parseCandidates({ results: [{ score: 0.5 }] })).toEqual([]);
  });
});

describe('normalizeFacts', () => {
  it('nettoie les textes, borne les listes et garde un statut connu', () => {
    const facts = normalizeFacts({
      origin: '  Europe   et Asie ',
      edibility: { status: 'partly', note: 'Fleurs seulement.' },
      humanUses: ['a', '', 'b', 'c', 'd', 'e', 3],
      wildlife: ['Abeilles'],
      funFacts: ['1', '2', '3', '4'],
    });
    expect(facts).toEqual({
      origin: 'Europe et Asie',
      edibility: { status: 'partly', note: 'Fleurs seulement.' },
      humanUses: ['a', 'b', 'c', 'd'],
      wildlife: ['Abeilles'],
      funFacts: ['1', '2', '3'],
    });
  });

  it('au moindre doute, comestibilité inconnue et champs vides', () => {
    expect(normalizeFacts({ edibility: { status: 'délicieux' } }).edibility.status).toBe('unknown');
    expect(normalizeFacts(null)).toEqual({
      origin: null,
      edibility: { status: 'unknown', note: null },
      humanUses: [],
      wildlife: [],
      funFacts: [],
    });
  });

  it('pose les espaces insécables de la typographie française', () => {
    expect(normalizeFacts({ origin: 'Surnom : « pisse-au-lit » ! Vrai ?' }).origin).toBe(
      'Surnom : « pisse-au-lit » ! Vrai ?',
    );
  });

  it('coupe un texte trop long', () => {
    expect(normalizeFacts({ origin: 'x'.repeat(500) }).origin!.length).toBeLessThanOrEqual(320);
  });
});

describe('factsPrompt et schéma', () => {
  it('demande une fiche prudente, en français, qui ne conseille jamais d’en manger', () => {
    const prompt = factsPrompt(MOCK_CANDIDATES[0]!);
    expect(prompt).toContain('Pissenlit (Taraxacum officinale), famille Asteraceae');
    expect(prompt).toContain('ne conseille jamais d’en manger');
    expect(prompt).toContain('En cas de doute, unknown');
    expect(FACTS_SCHEMA.properties.edibility.properties.status.enum).toEqual([
      'edible',
      'partly',
      'toxic',
      'inedible',
      'unknown',
    ]);
  });

  it('la simulation donne une fiche complète et valide', () => {
    const facts = mockFacts('Taraxacum officinale');
    expect(normalizeFacts(facts)).toEqual(facts);
    expect(mockFacts('Bellis perennis').edibility.status).toBe('unknown');
  });
});

describe('catalogMatch', () => {
  const catalog = SPECIES.map((s) => ({ id: s.id, latin: s.latin }));

  it('relie une plante du catalogue, synonymes compris, et rien d’autre', () => {
    expect(catalogMatch('Monstera deliciosa', catalog)).toBe('monstera');
    expect(catalogMatch('Sansevieria trifasciata', catalog)).toBe('sansevieria');
    expect(catalogMatch('Taraxacum officinale', catalog)).toBe('pissenlit');
    expect(catalogMatch('Pinus sylvestris', catalog)).toBeNull();
    // Même genre ne suffit pas : on ne propose pas un guide d'entretien approximatif.
    expect(catalogMatch('Ficus maclellandii', catalog)).toBeNull();
  });
});
