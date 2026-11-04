import { isReading, replyNotification, setChatOpen } from './replyNotification';

describe('replyNotification', () => {
  it('« Gaston t’a répondu » et la réponse entière quand elle est courte', () => {
    expect(replyNotification('Gaston', 'Arrose-moi **demain** matin.')).toEqual({
      title: 'Gaston t’a répondu',
      body: 'Arrose-moi demain matin.',
    });
  });

  it('coupe une longue réponse à un mot, avec des points de suspension', () => {
    const long =
      'Les cochenilles farineuses se cachent souvent à l’aisselle des feuilles. Passe un coton imbibé d’alcool sur chaque tache, puis isole-moi une semaine.';
    const { body } = replyNotification('Gaston', long);
    expect(body.length).toBeLessThanOrEqual(111);
    expect(body.endsWith('…')).toBe(true);
    expect(long.startsWith(body.slice(0, -1))).toBe(true);
    expect(body).not.toMatch(/\s…$/);
  });

  it('remplace les retours à la ligne par des espaces', () => {
    expect(replyNotification('Frida', '- Arrose\n\n- Tourne le pot').body).toBe(
      '- Arrose - Tourne le pot',
    );
  });
});

describe('isReading', () => {
  it('seulement sur le fil de cette plante, app au premier plan', () => {
    setChatOpen('gaston', true);
    expect(isReading('gaston', 'active')).toBe(true);
    expect(isReading('gaston', 'background')).toBe(false);
    expect(isReading('frida', 'active')).toBe(false);
    // Une autre fiche qui se ferme ne touche pas au fil ouvert.
    setChatOpen('frida', false);
    expect(isReading('gaston', 'active')).toBe(true);
    setChatOpen('gaston', false);
    expect(isReading('gaston', 'active')).toBe(false);
  });
});
