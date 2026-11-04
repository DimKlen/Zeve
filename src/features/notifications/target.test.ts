import { targetOf } from './target';

describe('targetOf', () => {
  it('suivi de soins → le fil de la plante', () => {
    expect(targetOf({ kind: 'followup', plantId: 'gaston' })).toEqual({ to: 'chat', id: 'gaston' });
  });

  it('réponse du chat → le fil de la plante', () => {
    expect(targetOf({ kind: 'chatReply', plantId: 'gaston' })).toEqual({
      to: 'chat',
      id: 'gaston',
    });
  });

  it('rappel d’une plante → sa fiche ; rappel groupé → le jardin', () => {
    expect(targetOf({ kind: 'daily', plantId: 'gaston' })).toEqual({ to: 'plant', id: 'gaston' });
    expect(targetOf({ kind: 'daily' })).toEqual({ to: 'garden' });
    expect(targetOf(undefined)).toEqual({ to: 'garden' });
  });
});
