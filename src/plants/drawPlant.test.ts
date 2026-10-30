import { readFileSync } from 'fs';
import { join } from 'path';

import { FORM_INFO } from './careInfo';
import { drawPlant, mix, MOUTH_HAPPY, MOUTH_SAD, stageOf, STAGE_SCALE } from './drawPlant';
import { PLANT_FORMS, type PlantForm } from './plantForms.generated';
import { SPECIES, SPECIES_BY_ID } from './species';

const FORMS = Object.keys(PLANT_FORMS) as PlantForm[];
/** Une espèce représentative par type de dessin. */
const sampleOf = (form: PlantForm) => SPECIES.find((s) => s.form === form)!.id;

describe('catalogue', () => {
  it('a 19 types de dessin et 52 espèces', () => {
    expect(FORMS).toHaveLength(19);
    expect(SPECIES).toHaveLength(52);
  });

  it('chaque espèce a un type existant et chaque type a au moins une espèce et ses infos', () => {
    for (const s of SPECIES) expect(PLANT_FORMS[s.form]).toBeDefined();
    for (const form of FORMS) {
      expect(SPECIES.some((s) => s.form === form)).toBe(true);
      expect(FORM_INFO[form]).toBeDefined();
    }
  });

  it('les ids sont uniques et identiques au seed SQL de la table species', () => {
    const ids = SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sql = readFileSync(join(__dirname, '../../supabase/migrations/0001_init.sql'), 'utf8');
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
