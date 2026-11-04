import {
  applyFollowup,
  checkMessage,
  dueCheck,
  followupPrompt,
  parseFollowup,
  topicLabel,
  type OpenFollowup,
} from './rules';

const DAY = 86_400_000;
const now = new Date(2026, 10, 8, 18);
const open: OpenFollowup = {
  id: 'f1',
  topic: 'les cochenilles',
  dueAt: new Date(2026, 10, 8, 9),
  checks: 0,
  createdAt: new Date(2026, 10, 1, 18),
};

describe('parseFollowup', () => {
  it('valide les jours (1 à 30) et le sujet', () => {
    expect(parseFollowup({ type: 'followup', days: 7, topic: ' les cochenilles ' })).toEqual({
      type: 'followup',
      days: 7,
      topic: 'les cochenilles',
    });
    expect(parseFollowup({ type: 'followup_done' })).toEqual({ type: 'followup_done' });
    expect(parseFollowup({ type: 'followup', days: 0, topic: 'les thrips' })).toBeNull();
    expect(parseFollowup({ type: 'followup', days: 45, topic: 'les thrips' })).toBeNull();
    expect(parseFollowup({ type: 'followup', days: 5, topic: 'x' })).toBeNull();
    expect(parseFollowup({ type: 'remind', days: 3 })).toBeNull();
    expect(parseFollowup(null)).toBeNull();
  });
});

describe('topicLabel', () => {
  it('retire l’article pour la fiche', () => {
    expect(topicLabel('les cochenilles')).toBe('cochenilles');
    expect(topicLabel('l’oïdium')).toBe('oïdium');
    expect(topicLabel("l'oïdium")).toBe('oïdium');
    expect(topicLabel('la pourriture des racines')).toBe('pourriture des racines');
    expect(topicLabel('pucerons')).toBe('pucerons');
  });
});

describe('applyFollowup', () => {
  it('crée un suivi, ou replanifie celui qui est ouvert (un seul par plante)', () => {
    const action = { type: 'followup', days: 7, topic: 'les cochenilles' } as const;
    expect(applyFollowup(null, action, now)).toEqual({
      op: 'insert',
      topic: 'les cochenilles',
      dueAt: new Date(now.getTime() + 7 * DAY),
    });
    expect(applyFollowup(open, { ...action, days: 4 }, now)).toEqual({
      op: 'update',
      id: 'f1',
      topic: 'les cochenilles',
      dueAt: new Date(now.getTime() + 4 * DAY),
    });
  });

  it('clôt le suivi ouvert ; rien sans action ou sans suivi à clore', () => {
    expect(applyFollowup(open, { type: 'followup_done' }, now)).toEqual({
      op: 'resolve',
      id: 'f1',
    });
    expect(applyFollowup(null, { type: 'followup_done' }, now)).toBeNull();
    expect(applyFollowup(open, null, now)).toBeNull();
  });
});

describe('dueCheck', () => {
  it('pas avant l’échéance', () => {
    expect(dueCheck({ ...open, dueAt: new Date(now.getTime() + DAY) }, now)).toBeNull();
    expect(dueCheck(null, now)).toBeNull();
  });

  it('échu : prend des nouvelles et redemande dans 3 jours sans réponse', () => {
    expect(dueCheck(open, now)).toEqual({
      op: 'check',
      id: 'f1',
      checks: 1,
      dueAt: new Date(now.getTime() + 3 * DAY),
      message: checkMessage('les cochenilles', 7),
    });
  });

  it('après 3 prises de nouvelles, le suivi expire', () => {
    expect(dueCheck({ ...open, checks: 3 }, now)).toEqual({ op: 'expire', id: 'f1' });
  });
});

describe('messages', () => {
  it('la plante rappelle le sujet et depuis quand', () => {
    expect(checkMessage('les cochenilles', 7)).toMatch(
      /^Petit point sur les cochenilles : on a commencé le traitement il y a 7 jours\./,
    );
    expect(checkMessage('l’oïdium', 1)).toContain('le traitement hier.');
  });

  it('le prompt décrit le suivi en cours et comment le clore', () => {
    expect(followupPrompt(null).join(' ')).toContain('"type":"followup"');
    expect(followupPrompt(null).join(' ')).not.toContain('Suivi en cours');
    const lines = followupPrompt({ ...open, checks: 1 }).join(' ');
    expect(lines).toContain('Suivi en cours : les cochenilles (prise de nouvelles 1 sur 3)');
    expect(lines).toContain('"type":"followup_done"');
  });
});
