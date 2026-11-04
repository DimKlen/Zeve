import { followupLine, planFollowups } from './plan';

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

describe('followupLine', () => {
  const now = new Date(2026, 10, 4, 12);
  it('sujet sans article et date du prochain point', () => {
    expect(followupLine({ topic: 'les cochenilles', dueAt: new Date(2026, 10, 8, 9) }, now)).toBe(
      'Suivi en cours : cochenilles · prochain point le 8 nov.',
    );
  });

  it('échéance aujourd’hui ou passée : on fait le point', () => {
    expect(followupLine({ topic: 'l’oïdium', dueAt: new Date(2026, 10, 4, 20) }, now)).toBe(
      'Suivi en cours : oïdium · on fait le point aujourd’hui',
    );
  });
});
