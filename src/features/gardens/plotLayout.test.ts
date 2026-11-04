import { PLOT_MAX, plotLayout, rowsOf } from './plotLayout';

describe('rowsOf', () => {
  it('répartit jusqu’à 10 plantes en 1 à 3 rangs', () => {
    expect(rowsOf(0)).toEqual([]);
    expect(rowsOf(1)).toEqual([1]);
    expect(rowsOf(3)).toEqual([3]);
    expect(rowsOf(5)).toEqual([3, 2]);
    expect(rowsOf(6)).toEqual([3, 3]);
    expect(rowsOf(7)).toEqual([2, 3, 2]);
    expect(rowsOf(8)).toEqual([3, 2, 3]);
    expect(rowsOf(10)).toEqual([3, 4, 3]);
  });
});

describe('plotLayout', () => {
  it('au plus 10 plantes, le reste en « +N »', () => {
    const l = plotLayout(14);
    expect(l.slots).toHaveLength(PLOT_MAX);
    expect(l.extra).toBe(4);
    expect(plotLayout(6).extra).toBe(0);
    expect(plotLayout(0)).toEqual({ width: 0, slots: [], extra: 0 });
  });

  it('chaque plante reste sur la pelouse', () => {
    for (let n = 1; n <= 12; n++) {
      const { width, slots } = plotLayout(n);
      const ids = slots.map((s) => s.index).sort((a, b) => a - b);
      expect(ids).toEqual([...Array(Math.min(n, PLOT_MAX)).keys()]);
      for (const s of slots) {
        expect(s.x - width / 2).toBeGreaterThanOrEqual(0);
        expect(s.x + width / 2).toBeLessThanOrEqual(1);
        expect(s.y - width * 1.1).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('dessine du fond vers l’avant et rapetisse les plantes quand le jardin se remplit', () => {
    const { slots } = plotLayout(10);
    expect(slots.map((s) => s.y)).toEqual([...slots.map((s) => s.y)].sort((a, b) => a - b));
    expect(plotLayout(1).width).toBeGreaterThan(plotLayout(4).width);
    expect(plotLayout(4).width).toBeGreaterThan(plotLayout(10).width);
  });

  it('est stable : même nombre, même placement', () => {
    expect(plotLayout(7)).toEqual(plotLayout(7));
  });
});
