import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { FORM_INFO } from './careInfo';
import { drawPlant, mix, MOUTH_HAPPY, MOUTH_SAD, stageOf, STAGE_SCALE } from './drawPlant';
import { PLANT_FORMS, type PlantForm } from './plantForms.generated';
import { isTree, SPECIES, SPECIES_BY_ID } from './species';
import { FRUIT_TREES } from './treeForms';

const FORMS = Object.keys(PLANT_FORMS) as PlantForm[];
/** Une espèce représentative par type de dessin. */
const sampleOf = (form: PlantForm) => SPECIES.find((s) => s.form === form)!.id;

describe('catalogue', () => {
  it('a 19 types de dessin et 324 espèces', () => {
    expect(FORMS).toHaveLength(19);
    expect(SPECIES).toHaveLength(324);
  });

  it('chaque espèce a un type existant et chaque type a au moins une espèce et ses infos', () => {
    for (const s of SPECIES) expect(PLANT_FORMS[s.form]).toBeDefined();
    for (const form of FORMS) {
      expect(SPECIES.some((s) => s.form === form)).toBe(true);
      expect(FORM_INFO[form]).toBeDefined();
    }
  });

  it('les ids sont uniques et présents dans les migrations de la table species', () => {
    const ids = SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const dir = join(__dirname, '../../supabase/migrations');
    const sql = readdirSync(dir)
      .map((file) => readFileSync(join(dir, file), 'utf8'))
      .join('\n');
    for (const id of ids) expect(sql).toContain(`'${id}'`);
  });
});

describe('drawPlant', () => {
  it.each(FORMS)('%s : stade 1 < stade 2 ≤ stade 3 en nombre d’éléments', (form) => {
    const id = sampleOf(form);
    const n = ([1, 2, 3] as const).map((stage) => drawPlant(id, stage, false).shapes.length);
    expect(n[0]).toBeGreaterThan(0);
    expect(n[0]).toBeLessThan(n[1]!);
    expect(n[1]).toBeLessThanOrEqual(n[2]!);
  });

  it('met le feuillage à l’échelle du stade autour de la base (50,64)', () => {
    expect(drawPlant('monstera', 1, false).scale).toBe(
      `translate(50 64) scale(${STAGE_SCALE[1]}) translate(-50 -64)`,
    );
    expect(drawPlant('monstera', 3, false).scaleFactor).toBe(1);
  });

  it('résout les couleurs de l’espèce et assèche la plante qui a soif', () => {
    const sp = SPECIES_BY_ID.monstera!;
    const ok = drawPlant('monstera', 3, false);
    const dry = drawPlant('monstera', 3, true);
    expect(ok.shapes.some((s) => s.fill === sp.a)).toBe(true);
    expect(dry.shapes.some((s) => s.fill === mix(sp.a, '#B5A85E', 0.5))).toBe(true);
    expect(ok.mouth).toBe(MOUTH_HAPPY);
    expect(dry.mouth).toBe(MOUTH_SAD);
    expect(dry.tilt).toBe('rotate(-9 50 64)');
    expect(ok.tilt).toBe('');
  });

  it('retombe sur la monstera pour une espèce inconnue et met en cache', () => {
    expect(drawPlant('inconnue', 2, false).shapes).toEqual(drawPlant('monstera', 2, false).shapes);
    expect(drawPlant('pothos', 2, false)).toBe(drawPlant('pothos', 2, false));
  });
});

describe('stageOf / mix', () => {
  it('Pousse < 3 mois, Jeune < 1 an, Adulte ensuite', () => {
    expect(stageOf(0)).toBe(1);
    expect(stageOf(89)).toBe(1);
    expect(stageOf(90)).toBe(2);
    expect(stageOf(364)).toBe(2);
    expect(stageOf(365)).toBe(3);
  });

  it('mélange deux couleurs', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#3F7A4E', '#3F7A4E', 0.5)).toBe('#3f7a4e');
  });
});

describe('arbres', () => {
  const trees = SPECIES.filter(isTree);

  it('les arbres sont dessinés en pleine terre, les plantes d’intérieur en pot', () => {
    expect(trees.length).toBeGreaterThan(40);
    expect(drawPlant('chene', 3, false).tree).toBe(true);
    expect(drawPlant('monstera', 3, false).tree).toBe(false);
    expect(isTree(SPECIES_BY_ID.olivier!)).toBe(false);
  });

  it('les arbres fruitiers existent dans le catalogue', () => {
    for (const id of FRUIT_TREES) expect(isTree(SPECIES_BY_ID[id]!)).toBe(true);
  });

  it.each(['chene', 'pommier'])('%s : 3 stades, du jeune plant à l’arbre adulte', (id) => {
    const n = ([1, 2, 3] as const).map((stage) => drawPlant(id, stage, false).shapes.length);
    expect(n[0]).toBeLessThan(n[1]!);
    expect(n[1]).toBeLessThan(n[2]!);
  });

  it('adulte : fruits pour un fruitier, seulement des feuilles pour les autres', () => {
    const sp = SPECIES_BY_ID.pommier!;
    const withFruit = (id: string) => drawPlant(id, 3, false).shapes.some((s) => s.fill === sp.f);
    expect(withFruit('pommier')).toBe(true);
    expect(drawPlant('pommier', 2, false).shapes.some((s) => s.fill === sp.f)).toBe(false);
    expect(drawPlant('chene', 3, false).shapes.some((s) => s.fill === SPECIES_BY_ID.chene!.f)).toBe(
      false,
    );
  });
});
