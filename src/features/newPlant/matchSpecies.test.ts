import {
  GENUS_ONLY_CONFIDENCE,
  matchSpecies,
  normalizeLatin,
  type PlantNetResult,
} from '../../../supabase/functions/_shared/matchSpecies';
import { SPECIES } from '@/plants/species';

const catalog = SPECIES.map((s) => ({ id: s.id, latin: s.latin }));

const result = (name: string, score: number, genus = name.split(' ')[0]!): PlantNetResult => ({
  score,
  species: { scientificNameWithoutAuthor: name, genus: { scientificNameWithoutAuthor: genus } },
});

describe('normalizeLatin', () => {
  it('ignore casse, accents et signe d’hybride', () => {
    expect(normalizeLatin('Citrus × meyeri')).toBe('citrus meyeri');
    expect(normalizeLatin('  Monstera   Deliciosa ')).toBe('monstera deliciosa');
  });
});

describe('matchSpecies', () => {
  it('reconnaît une espèce exacte avec son score', () => {
    expect(matchSpecies([result('Monstera deliciosa', 0.91)], catalog)).toEqual({
      speciesId: 'monstera',
      confidence: 0.91,
      alternatives: [],
    });
  });

  it('suit les reclassements (Sansevieria → Dracaena, Calathea → Goeppertia)', () => {
    expect(matchSpecies([result('Sansevieria trifasciata', 0.8)], catalog).speciesId).toBe(
      'sansevieria',
    );
    expect(matchSpecies([result('Calathea orbifolia', 0.7)], catalog).speciesId).toBe('calathea');
  });

  it('retombe sur le genre avec une confiance plafonnée', () => {
    const id = matchSpecies([result('Echinopsis oxygona', 0.88)], catalog);
    expect(id.speciesId).toBe('echinopsis');
    expect(id.confidence).toBe(GENUS_ONLY_CONFIDENCE);
  });

  it('propose les autres espèces du genre en alternatives', () => {
    const id = matchSpecies([result('Ficus microcarpa', 0.6)], catalog);
    expect(id.speciesId).toBe('benjamina');
    expect(id.alternatives).toEqual(['caoutchouc', 'lyrata']);
  });

  it('classe par score et ignore les doublons', () => {
    const id = matchSpecies(
      [
        result('Pilea peperomioides', 0.2),
        result('Peperomia obtusifolia', 0.65),
        result('Peperomia obtusifolia', 0.1),
      ],
      catalog,
    );
    expect(id).toEqual({ speciesId: 'peperomia', confidence: 0.65, alternatives: ['pilea'] });
  });

  it('renvoie null si rien ne correspond au catalogue', () => {
    expect(matchSpecies([result('Quercus robur', 0.95)], catalog)).toEqual({
      speciesId: null,
      confidence: 0,
      alternatives: [],
    });
    expect(matchSpecies([], catalog).speciesId).toBeNull();
  });
});
