import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { SPECIES } from '@/plants/species';

import { searchSpecies, waterEveryDaysOf } from './searchSpecies';

const names = (list: { name: string }[]) => list.map((s) => s.name);

describe('searchSpecies', () => {
  it('liste les 58 espèces par ordre alphabétique sans filtre', () => {
    const all = searchSpecies('');
    expect(all).toHaveLength(58);
    expect(all[0]!.name).toBe('Agave');
  });

  it('« fic » trouve Ficus benjamina et Figuier lyre, aussi par le type (capture 12b)', () => {
    expect(names(searchSpecies('fic'))).toEqual([
      'Avocatier',
      'Caoutchouc',
      'Ficus benjamina',
      'Figuier lyre',
      'Schefflera',
    ]);
  });

  it('ignore accents et majuscules, cherche aussi le nom latin', () => {
    expect(names(searchSpecies('BEGONIA'))).toEqual(['Bégonia']);
    expect(names(searchSpecies('ocimum'))).toEqual(['Basilic']);
  });

  it('filtre par catégorie et combine avec la recherche', () => {
    const succulents = searchSpecies('', 'succulentes');
    expect(succulents.every((s) => ['cactus', 'echeveria', 'aloe', 'zz'].includes(s.form))).toBe(
      true,
    );
    expect(names(searchSpecies('eche', 'succulentes'))).toEqual(['Echeveria']);
    expect(searchSpecies('basilic', 'succulentes')).toEqual([]);
  });
});

describe('waterEveryDaysOf', () => {
  it('correspond au rythme de la table species des migrations pour chaque espèce', () => {
    const dir = join(__dirname, '../../../supabase/migrations');
    const sql = readdirSync(dir)
      .map((file) => readFileSync(join(dir, file), 'utf8'))
      .join('\n');
    for (const s of SPECIES) {
      const row = sql.match(new RegExp(`\\('${s.id}',[^\\n]*?, (\\d+), '`));
      expect(row).not.toBeNull();
      expect(waterEveryDaysOf(s)).toBe(Number(row![1]));
    }
  });
});
