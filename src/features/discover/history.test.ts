import { addDiscovery, HISTORY_MAX, type Discovery } from './history';

const d = (id: string): Discovery => ({
  id,
  at: '2026-11-02T10:00:00.000Z',
  photoUri: `file:///${id}.jpg`,
  candidates: [],
  selected: 0,
  facts: {},
});

describe('addDiscovery', () => {
  it('ajoute en tête et garde les 10 plus récentes', () => {
    let list: Discovery[] = [];
    for (let i = 0; i < 12; i += 1) list = addDiscovery(list, d(String(i)));
    expect(list).toHaveLength(HISTORY_MAX);
    expect(list[0]!.id).toBe('11');
    expect(list[HISTORY_MAX - 1]!.id).toBe('2');
  });

  it('ne duplique pas une découverte déjà présente', () => {
    const list = addDiscovery(addDiscovery([d('a'), d('b')], d('b')), d('a'));
    expect(list.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
