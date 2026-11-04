import {
  dryingFromWeather,
  dueInfo,
  learnRhythm,
  rhythmSuggestion,
  type DailyWeather,
  type WateringEvent,
} from './wateringModel';

const NOW = new Date(2026, 10, 2, 10);
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Arrosages aux jours donnés (il y a n jours), avec le rythme attendu. */
const events = (ago: number[], expected: number | null): WateringEvent[] =>
  ago.map((n) => ({ at: daysAgo(n), expectedDays: expected }));

/** 30 jours passés + 7 à venir, même ET0 partout sauf les jours modifiés. */
function weather(change: Record<number, Partial<DailyWeather>> = {}): DailyWeather[] {
  const out: DailyWeather[] = [];
  for (let n = -30; n <= 7; n += 1) {
    const day = dayKey(new Date(NOW.getTime() + n * DAY));
    out.push({ day, et0: 3, tempMean: 15, humidity: 70, ...change[n] });
  }
  return out;
}

describe('learnRhythm', () => {
  it('apprend un rythme plus court quand on arrose toujours en avance', () => {
    const model = learnRhythm(events([20, 16, 12, 8, 4], 5), 5);
    expect(model).toMatchObject({ estimate: 4, usable: 4, stable: true });
  });

  it('apprend un rythme plus long quand on arrose toujours en retard', () => {
    expect(learnRhythm(events([30, 20, 10, 0], 8), 8).estimate).toBe(10);
  });

  it('privilégie les arrosages récents', () => {
    // 7, 7, 5, 5, 5 jours : le rythme récent (5) l'emporte.
    expect(learnRhythm(events([29, 22, 15, 10, 5, 0], 7), 7).estimate).toBe(5);
  });

  it('ignore une absence (intervalle > 2× attendu) et les arrosages du même jour', () => {
    const history: WateringEvent[] = [
      ...events([40, 36, 32], 4),
      { at: new Date(daysAgo(32).getTime() + 3_600_000), expectedDays: 4 },
      ...events([12, 8], 4),
    ];
    const model = learnRhythm(history, 4);
    // 36→32 et 12→8 valent 4 j ; 32→12 (20 j, vacances) est écarté ; 40→36 aussi 4 j.
    expect(model).toMatchObject({ estimate: 4, usable: 3 });
  });

  it('ne conclut rien avec trop peu d’arrosages', () => {
    expect(learnRhythm(events([8, 4], 5), 5)).toMatchObject({ estimate: null, usable: 1 });
    expect(learnRhythm([], 5).estimate).toBeNull();
  });

  it('juge instable un rythme qui varie trop', () => {
    expect(learnRhythm(events([30, 28, 20, 18, 9], 5), 5).stable).toBe(false);
  });

  it('ramène les intervalles aux conditions moyennes (une canicule ne raccourcit pas le rythme)', () => {
    // Arrosé tous les 4 j pendant une période deux fois plus « séchante » que la normale.
    const hot: Record<number, Partial<DailyWeather>> = {};
    for (let n = -20; n <= 0; n += 1) hot[n] = { et0: 6 };
    const normal = weather();
    const drying = dryingFromWeather(normal.map((w, i) => ({ ...w, ...hot[i - 30] })));
    const model = learnRhythm(events([20, 16, 12, 8, 4], 5), 5, drying);
    // Plantes d'intérieur : l'effet de la météo est atténué, il ne raccourcit jamais le rythme appris.
    expect(model.estimate).toBeGreaterThanOrEqual(
      learnRhythm(events([20, 16, 12, 8, 4], 5), 5).estimate!,
    );
  });
});

describe('rhythmSuggestion', () => {
  const learned = { estimate: 4, usable: 4, stable: true };

  it('propose un rythme stable qui diffère d’au moins un jour', () => {
    expect(rhythmSuggestion(learned, 5, null)).toBe(4);
    expect(rhythmSuggestion(learned, 4, null)).toBeNull();
    expect(rhythmSuggestion({ ...learned, stable: false }, 5, null)).toBeNull();
    expect(rhythmSuggestion({ estimate: null, usable: 2, stable: false }, 5, null)).toBeNull();
  });

  it('attend 3 nouveaux arrosages après un refus', () => {
    expect(rhythmSuggestion(learned, 5, { days: 4, count: 4 })).toBeNull();
    expect(rhythmSuggestion({ ...learned, usable: 6 }, 5, { days: 4, count: 4 })).toBeNull();
    expect(rhythmSuggestion({ ...learned, usable: 7 }, 5, { days: 4, count: 4 })).toBe(4);
  });
});

describe('dueInfo', () => {
  const plant = { waterEveryDays: 8, lastWateredAt: daysAgo(3), createdAt: daysAgo(100) };

  it('sans météo : le rythme fixe', () => {
    expect(dueInfo(plant, null, NOW)).toEqual({
      daysUntilNext: 5,
      dueDays: 8,
      shift: 0,
      cause: null,
    });
  });

  it('avance l’arrosage par temps chaud et sec', () => {
    const hot: Record<number, Partial<DailyWeather>> = {};
    for (let n = -3; n <= 7; n += 1) hot[n] = { et0: 9, tempMean: 30 };
    const info = dueInfo(plant, dryingFromWeather(weather(hot)), NOW);
    expect(info).toMatchObject({ shift: -1, dueDays: 7, daysUntilNext: 4, cause: 'hot' });
  });

  it('retarde par temps frais et humide', () => {
    const cool: Record<number, Partial<DailyWeather>> = {};
    for (let n = -3; n <= 7; n += 1) cool[n] = { et0: 1.5, tempMean: 8, humidity: 92 };
    const info = dueInfo(plant, dryingFromWeather(weather(cool)), NOW);
    expect(info.shift).toBeGreaterThan(0);
    expect(info.cause).toBe('cool');
  });

  it('atténue fortement la météo pour une plante d’intérieur', () => {
    const hot: Record<number, Partial<DailyWeather>> = {};
    for (let n = -3; n <= 7; n += 1) hot[n] = { et0: 6, tempMean: 26 };
    expect(dueInfo(plant, dryingFromWeather(weather(hot)), NOW).shift).toBe(0);
  });

  it('ne déduit rien de trop peu de jours de météo', () => {
    expect(dryingFromWeather(weather().slice(0, 3))).toBeNull();
  });
});
