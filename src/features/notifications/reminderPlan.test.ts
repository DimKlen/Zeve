import type { PlantRow } from '@/plants/plantStatus';

import { formatTime, parseTime, planDailyReminders } from './reminderPlan';

const NOW = new Date(2026, 9, 30, 8, 0); // 30 oct., 8 h — avant le rappel de 9 h
const daysAgo = (n: number) => new Date(2026, 9, 30 - n, 10, 0);

const plant = (id: string, every: number, lastDaysAgo: number): PlantRow => ({
  id,
  nickname: id,
  speciesId: 'monstera',
  createdAt: daysAgo(400),
  waterEveryDays: every,
  lastWateredAt: daysAgo(lastDaysAgo),
});

describe('parseTime / formatTime', () => {
  it('lit et affiche l’heure du rappel', () => {
    expect(parseTime('09:00:00')).toEqual({ hours: 9, minutes: 0 });
    expect(parseTime('18:30')).toEqual({ hours: 18, minutes: 30 });
    expect(formatTime('09:00:00')).toBe('9 h 00');
    expect(formatTime('18:05:00')).toBe('18 h 05');
  });
});

describe('planDailyReminders', () => {
  it('nomme la plante quand elle est seule à avoir soif (texte à la 1re personne)', () => {
    const plan = planDailyReminders(
      [plant('Gaston', 8, 9), plant('Pépite', 6, 1)],
      '09:00',
      NOW,
      1,
    );
    expect(plan).toEqual([
      {
        date: new Date(2026, 9, 30, 9, 0),
        title: 'Gaston',
        body: 'J’ai un peu soif… ça fait 9 jours.',
        plantId: 'Gaston',
      },
    ]);
  });

  it('regroupe plusieurs plantes assoiffées sous « Zeve », la plus assoiffée en premier', () => {
    const plan = planDailyReminders(
      [plant('Basilic', 2, 3), plant('Gaston', 8, 9)],
      '09:00',
      NOW,
      1,
    );
    expect(plan[0]).toMatchObject({
      title: 'Zeve',
      body: 'Gaston et 1 autre plante ont soif.',
      plantId: null,
    });
    const three = planDailyReminders(
      [plant('Basilic', 2, 3), plant('Gaston', 8, 9), plant('Frida', 5, 6)],
      '09:00',
      NOW,
      1,
    );
    expect(three[0]!.body).toBe('Gaston et 2 autres plantes ont soif.');
  });

  it('ne programme rien les jours où personne n’a soif', () => {
    // Pépite (rythme 6, arrosée hier) aura soif dans 5 jours.
    const plan = planDailyReminders([plant('Pépite', 6, 1)], '09:00', NOW, 7);
    expect(plan.map((p) => p.date.getDate())).toEqual([4, 5]); // 4 et 5 novembre
    expect(plan[0]!.body).toBe('J’ai un peu soif… ça fait 6 jours.');
  });

  it('saute aujourd’hui si l’heure est passée', () => {
    const late = new Date(2026, 9, 30, 10, 0);
    const plan = planDailyReminders([plant('Gaston', 8, 9)], '09:00', late, 2);
    expect(plan.map((p) => p.date.getDate())).toEqual([31]);
  });
});
