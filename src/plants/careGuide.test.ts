import { t } from '@/i18n';

import { careGuideOf, SPECIES_GUIDE } from './careGuide';
import { SPECIES, SPECIES_BY_ID } from './species';

describe('careGuideOf', () => {
  it('a un texte de terre, pot, engrais et rempotage pour chaque espèce', () => {
    for (const s of SPECIES) {
      const guide = careGuideOf(s.id);
      for (const key of [guide.soil, guide.pot, guide.feed, guide.repot]) {
        expect(t(`care.${key}`)).not.toBe(`care.${key}`);
      }
    }
  });

  it('ne corrige que des espèces du catalogue', () => {
    for (const id of Object.keys(SPECIES_GUIDE)) expect(SPECIES_BY_ID[id]).toBeDefined();
  });

  it('suit la famille, sauf les espèces à part', () => {
    expect(careGuideOf('echeveria')).toMatchObject({ soil: 'soilCactus', pot: 'potTerracotta' });
    expect(careGuideOf('phalaenopsis')).toMatchObject({ soil: 'soilOrchid', pot: 'potOrchid' });
    // Même type de dessin que le géranium, mais sol acide.
    expect(careGuideOf('azalee').soil).toBe('soilAcid');
    expect(careGuideOf('geranium').soil).toBe('soilFlower');
    // Dessinée en rosette, mais vit sans terre.
    expect(careGuideOf('tillandsia')).toMatchObject({ soil: 'soilNone', pot: 'potNone' });
  });
});
