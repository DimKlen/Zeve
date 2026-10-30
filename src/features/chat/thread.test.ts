import { buildThread, dateLabel, type ChatMessage } from './thread';

const NOW = new Date(2026, 9, 30, 10, 0);
const at = (daysAgo: number, hour = 9) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo, hour);

const msg = (id: string, role: ChatMessage['role'], createdAt: Date): ChatMessage => ({
  id,
  role,
  content: id,
  photoPath: null,
  actions: [],
  createdAt,
});

describe('dateLabel', () => {
  it('dit Aujourd’hui, Hier, puis la date courte', () => {
    expect(dateLabel(at(0), NOW)).toBe("Aujourd'hui");
    expect(dateLabel(at(1, 23), NOW)).toBe('Hier');
    expect(dateLabel(new Date(2026, 9, 12), NOW)).toBe('12 oct.');
  });
});

describe('buildThread', () => {
  it('salue quand il n’y a pas encore de messages', () => {
    expect(buildThread([], 'Gaston', NOW).map((i) => i.kind)).toEqual(['date', 'greeting']);
    const greeting = buildThread([], 'Gaston', NOW)[1];
    expect(greeting).toMatchObject({
      text: 'Salut ! Je suis Gaston. Pose-moi une question ou envoie-moi une photo.',
    });
  });

  it('insère un séparateur à chaque changement de jour', () => {
    const thread = buildThread(
      [msg('a', 'user', at(1)), msg('b', 'assistant', at(1)), msg('c', 'user', at(0))],
      'Gaston',
      NOW,
    );
    expect(thread.map((i) => (i.kind === 'date' ? i.label : i.key))).toEqual([
      'Hier',
      'a',
      'b',
      "Aujourd'hui",
      'c',
    ]);
  });
});
