import {
  cardStatus,
  daysBetween,
  moodBubble,
  normalize,
  plantStatus,
  sinceText,
  thirstLine,
  type PlantRow,
} from './plantStatus';

const NOW = new Date(2026, 9, 30, 10, 0); // 30 octobre 2026, 10 h
const daysAgo = (n: number, hour = 9) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n, hour);

const plant = (over: Partial<PlantRow> = {}): PlantRow => ({
  id: 'p',
  nickname: 'Gaston',
  speciesId: 'monstera',
  createdAt: daysAgo(430),
  waterEveryDays: 8,
  lastWateredAt: daysAgo(9),
  ...over,
});

describe('daysBetween', () => {
  it('compte des jours calendaires, pas des tranches de 24 h', () => {
    expect(daysBetween(new Date(2026, 9, 29, 23, 30), new Date(2026, 9, 30, 0, 10))).toBe(1);
    expect(daysBetween(daysAgo(0, 7), NOW)).toBe(0);
  });
});

describe('plantStatus — soif et jauge', () => {
  it('Gaston (9 j sans eau, rythme 8) a soif : jauge 18 %, « Sèche »', () => {
    const s = plantStatus(plant(), NOW);
    expect(s.thirsty).toBe(true);
    expect(s.daysSinceWater).toBe(9);
    expect(s.daysUntilNext).toBe(-1);
    expect(s.waterLevel).toBe(0.18);
    expect(s.waterText).toBe('Sèche');
    expect(s.nextLabel).toBe('aujourd’hui');
    expect(s.sinceLabel).toBe('9 j sans eau');
  });

  it('a soif pile le jour de l’échéance', () => {
    expect(plantStatus(plant({ lastWateredAt: daysAgo(8) }), NOW).thirsty).toBe(true);
    expect(plantStatus(plant({ lastWateredAt: daysAgo(7) }), NOW).thirsty).toBe(false);
  });

  it('arrosée aujourd’hui : jauge 92 %, « Parfait », prochain arrosage dans 8 j', () => {
    const s = plantStatus(plant({ lastWateredAt: daysAgo(0, 8) }), NOW);
    expect(s.thirsty).toBe(false);
    expect(s.wateredToday).toBe(true);
    expect(s.waterLevel).toBe(0.92);
    expect(s.waterText).toBe('Parfait');
    expect(s.nextLabel).toBe('dans 8 j');
  });

  it('« Bientôt » sous la moitié, « demain » la veille', () => {
    const s = plantStatus(plant({ waterEveryDays: 5, lastWateredAt: daysAgo(4) }), NOW);
    expect(s.waterText).toBe('Bientôt');
    expect(s.nextLabel).toBe('demain');
    expect(s.waterLevel).toBeCloseTo(0.2);
  });

  it('jamais arrosée : la création sert de référence', () => {
    const s = plantStatus(plant({ createdAt: daysAgo(3), lastWateredAt: null }), NOW);
    expect(s.daysSinceWater).toBe(3);
    expect(s.wateredToday).toBe(false);
  });
});

describe('plantStatus — stades', () => {
  it.each([
    [0, 1],
    [60, 1],
    [89, 1],
    [90, 2],
    [290, 2],
    [365, 3],
    [820, 3],
  ])('%i jours dans l’app → stade %i', (days, stage) => {
    expect(plantStatus(plant({ createdAt: daysAgo(days) }), NOW).stage).toBe(stage);
  });
});

describe('textes', () => {
  it('cardStatus', () => {
    expect(cardStatus(plantStatus(plant(), NOW))).toBe('A soif');
    expect(cardStatus(plantStatus(plant({ lastWateredAt: daysAgo(0) }), NOW))).toBe(
      'Arrosée · eau dans 8 j',
    );
    expect(cardStatus(plantStatus(plant({ lastWateredAt: daysAgo(5) }), NOW))).toBe('Eau dans 3 j');
  });

  it('moodBubble', () => {
    expect(moodBubble(plantStatus(plant(), NOW), false)).toBe('J’ai un peu soif… (9 j sans eau)');
    const watered = plantStatus(plant({ lastWateredAt: daysAgo(0) }), NOW);
    expect(moodBubble(watered, true)).toBe('Merci ! Prochain arrosage dans 8 j.');
    const ok = plantStatus(plant({ lastWateredAt: daysAgo(5) }), NOW);
    expect(moodBubble(ok, false)).toBe('Tout va bien, prochain arrosage dans 3 j.');
  });

  it('thirstLine', () => {
    expect(thirstLine(0)).toBe('tout le monde est hydraté');
    expect(thirstLine(1)).toBe('1 a soif aujourd’hui');
    expect(thirstLine(2)).toBe('2 ont soif aujourd’hui');
  });

  it('sinceText', () => {
    expect(sinceText(0)).toBe('aujourd’hui');
    expect(sinceText(1)).toBe('1 jour');
    expect(sinceText(13)).toBe('13 jours');
    expect(sinceText(21)).toBe('3 semaines');
    expect(sinceText(160)).toBe('5 mois');
    expect(sinceText(365)).toBe('1 an');
    expect(sinceText(430)).toBe('1 an et 2 mois');
    expect(sinceText(820)).toBe('2 ans et 3 mois');
  });

  it('normalize ignore accents et casse', () => {
    expect(normalize('Pépite')).toBe('pepite');
    expect(normalize('ÉCHEVERIA')).toBe('echeveria');
  });
});
