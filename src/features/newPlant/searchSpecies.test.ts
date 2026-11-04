import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { SPECIES } from '@/plants/species';

import { categoryOf, searchSpecies, waterEveryDaysOf } from './searchSpecies';

const names = (list: { name: string }[]) => list.map((s) => s.name);

describe('searchSpecies', () => {
  it('liste les 324 espèces par ordre alphabétique sans filtre', () => {
    const all = searchSpecies('');
    expect(all).toHaveLength(324);
    expect(all[0]!.name).toBe('Abricotier');
  });

  it('« fic » trouve les ficus et Figuier lyre, aussi par le type et le nom latin (capture 12b)', () => {
    expect(names(searchSpecies('fic'))).toEqual([
      'Avocatier',
      'Bourrache',
      'Caféier',
      'Caoutchouc',
      'Consoude',
      'Cresson',
      'Ficaire',
      'Ficus altissima',
      'Ficus Audrey',
      'Ficus benjamina',
      'Ficus ginseng',
      'Ficus rampant',
      'Figuier',
      'Figuier lyre',
      'Mélisse',
      'Pissenlit',
      'Sauge',
      'Schefflera',
      'Souci',
      'Valériane',
    ]);
  });

  it('ignore accents et majuscules, cherche aussi le nom latin', () => {
    expect(names(searchSpecies('BEGONIA'))).toEqual(['Bégonia', 'Bégonia maculata', 'Bégonia rex']);
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

describe('catégories', () => {
  it('« Sauvages » regroupe herbes sauvages et mauvaises herbes, dessinées avec d’autres types', () => {
    const wild = names(searchSpecies('', 'sauvages'));
    expect(wild).toEqual(expect.arrayContaining(['Ortie', 'Pissenlit', 'Chiendent', 'Pâquerette']));
    expect(wild).not.toContain('Basilic');
  });

  it('chaque espèce a dans l’app la catégorie enregistrée en base', () => {
    const dir = join(__dirname, '../../../supabase/migrations');
    const sql = readdirSync(dir)
      .map((file) => readFileSync(join(dir, file), 'utf8'))
      .join('\n');
    for (const s of SPECIES) {
      const row = sql.match(new RegExp(`\\('${s.id}', '(?:[^']|'')*', '[^']*', '\\w+', '(\\w+)'`));
      expect([s.id, row?.[1]]).toEqual([s.id, categoryOf(s)]);
    }
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
