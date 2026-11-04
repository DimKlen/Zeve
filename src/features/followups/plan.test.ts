import { planFollowups } from './plan';

const row = {
  plantId: 'gaston',
  nickname: 'Gaston',
  topic: 'les cochenilles',
  dueAt: new Date(2026, 10, 8, 22, 46),
};

describe('planFollowups', () => {
  it('le jour de l’échéance, à l’heure des rappels', () => {
    expect(planFollowups([row], '18:30:00', new Date(2026, 10, 4, 12))).toEqual([
      {
        date: new Date(2026, 10, 8, 18, 30),
        title: 'Gaston',
        body: 'Comment va Gaston depuis le traitement contre les cochenilles ?',
        plantId: 'gaston',
      },
    ]);
  });

  it('échéance aujourd’hui ou dépassée : le prochain créneau à venir', () => {
    const [today] = planFollowups([row], '18:30:00', new Date(2026, 10, 8, 12));
    expect(today!.date).toEqual(new Date(2026, 10, 8, 18, 30));
    const [late] = planFollowups([row], '18:30:00', new Date(2026, 10, 10, 20));
    expect(late!.date).toEqual(new Date(2026, 10, 11, 18, 30));
  });
});
