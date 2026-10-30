import {
  gardenSubtitle,
  sortGarden,
  todoList,
  wasThirstyBeforeToday,
  type GardenPlant,
} from './gardenRules';

const NOW = new Date(2026, 9, 30, 10, 0);
const daysAgo = (n: number, hour = 9) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n, hour);

const make = (
  nickname: string,
  created: number,
  every: number,
  lastDaysAgo: number | null,
  previousDaysAgo: number | null = null,
): GardenPlant => ({
  id: nickname.toLowerCase(),
  nickname,
  speciesId: 'monstera',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  roomId: null,
  roomName: 'Salon',
  light: 'indirect',
  lightLabel: 'Vive, indirecte',
  air: 'Humide',
  tip: '',
  createdAt: daysAgo(created),
  waterEveryDays: every,
  lastWateredAt: lastDaysAgo === null ? null : daysAgo(lastDaysAgo),
  previousWateredAt: previousDaysAgo === null ? null : daysAgo(previousDaysAgo),
});

// Le jardin de Camille (docs/06 F13).
const gaston = make('Gaston', 430, 8, 9);
const basilic = make('Basilic', 35, 2, 3);
const pepite = make('Pépite', 160, 6, 3);
const frida = make('Frida', 290, 5, 4);
const olivia = make('Olivia', 820, 7, 2);
const piquant = make('Piquant', 60, 14, 2);
const garden = [gaston, basilic, pepite, frida, olivia, piquant];

describe('todoList', () => {
  it('liste les assoiffées, la plus assoiffée en premier (capture 07)', () => {
    const todo = todoList(garden, NOW);
    expect(todo.map((x) => [x.plant.nickname, x.done, x.sinceLabel])).toEqual([
      ['Gaston', false, '9 j sans eau'],
      ['Basilic', false, '3 j sans eau'],
    ]);
  });

  it('garde une plante arrosée aujourd’hui qui avait soif, marquée faite (capture 07b)', () => {
    const watered = { ...gaston, lastWateredAt: daysAgo(0), previousWateredAt: daysAgo(9) };
    const todo = todoList([watered, basilic, pepite], NOW);
    expect(todo.map((x) => [x.plant.nickname, x.done, x.sinceLabel])).toEqual([
      ['Gaston', true, '9 j sans eau'],
      ['Basilic', false, '3 j sans eau'],
    ]);
  });

  it('ignore une plante arrosée aujourd’hui qui n’avait pas soif', () => {
    const early = { ...pepite, lastWateredAt: daysAgo(0), previousWateredAt: daysAgo(3) };
    expect(wasThirstyBeforeToday(early, NOW)).toBe(false);
    expect(todoList([early], NOW)).toEqual([]);
  });

  it('est vide quand tout le monde est hydraté', () => {
    expect(todoList([pepite, frida], NOW)).toEqual([]);
  });
});

describe('sortGarden', () => {
  it('met les assoiffées d’abord puis trie par date d’ajout', () => {
    expect(sortGarden(garden, NOW).map((p) => p.nickname)).toEqual([
      'Gaston',
      'Basilic',
      'Olivia',
      'Frida',
      'Pépite',
      'Piquant',
    ]);
  });
});

describe('sortGarden — arrosage du jour', () => {
  it('garde à sa place une plante arrosée aujourd’hui qui avait soif (capture 07b)', () => {
    const wateredGaston = { ...gaston, lastWateredAt: daysAgo(0), previousWateredAt: daysAgo(9) };
    const wateredBasilic = { ...basilic, lastWateredAt: daysAgo(0), previousWateredAt: daysAgo(3) };
    const all = [wateredGaston, wateredBasilic, pepite, frida, olivia, piquant];
    expect(
      sortGarden(all, NOW)
        .map((p) => p.nickname)
        .slice(0, 2),
    ).toEqual(['Gaston', 'Basilic']);
  });
});

describe('gardenSubtitle', () => {
  it('compte les plantes et celles qui ont soif', () => {
    expect(gardenSubtitle(garden, NOW)).toBe('6 plantes · 2 ont soif aujourd’hui');
    expect(gardenSubtitle([gaston], NOW)).toBe('1 plante · 1 a soif aujourd’hui');
    expect(gardenSubtitle([pepite, frida], NOW)).toBe('2 plantes · tout le monde est hydraté');
  });
});
