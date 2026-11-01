import {
  buildSystemPrompt,
  extractAction,
  seasonNameOf,
  toGeminiContents,
  type PlantContext,
} from '../../../supabase/functions/_shared/chatPrompt';

const gaston: PlantContext = {
  nickname: 'Gaston',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  roomName: 'Salon',
  daysSinceWater: 9,
  waterEveryDays: 8,
  light: 'indirect',
  lightLabel: 'Vive, indirecte',
  stage: 'Adulte',
  recentWaterings: ['21 oct.', '13 oct.'],
  season: 'automne',
};

describe('buildSystemPrompt', () => {
  it('donne à la plante son nom, son espèce, sa pièce et son état', () => {
    const prompt = buildSystemPrompt(gaston);
    expect(prompt).toContain(
      'Tu es Gaston, une plante (Monstera, Monstera deliciosa) qui vit dans le/la Salon',
    );
    expect(prompt).toContain('dernier arrosage il y a 9 jours (rythme idéal : tous les 8 jours)');
    expect(prompt).toContain('lumière à ton emplacement : lumineux, sans soleil direct');
    expect(prompt).toContain('Derniers arrosages : 21 oct., 13 oct.');
    expect(prompt).toContain('"type":"remind"');
  });

  it('donne la saison pour adapter les conseils', () => {
    expect(buildSystemPrompt(gaston)).toContain(
      'Saison actuelle : automne (France, hémisphère nord)',
    );
    expect(seasonNameOf(new Date(2026, 0, 5))).toBe('hiver');
    expect(seasonNameOf(new Date(2026, 6, 5))).toBe('été');
    expect(seasonNameOf(new Date(2026, 10, 1))).toBe('automne');
  });

  it('se passe de pièce et d’arrosages', () => {
    const prompt = buildSystemPrompt({ ...gaston, roomName: null, recentWaterings: [] });
    expect(prompt).toContain('qui vit chez ton humain·e.');
    expect(prompt).toContain('Aucun arrosage enregistré');
  });
});

describe('extractAction', () => {
  it('retire la ligne JSON et renvoie l’action', () => {
    const reply =
      'Arrose bien aujourd’hui.\nJe te redis dans quelques jours.\n{"action":{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}}';
    expect(extractAction(reply)).toEqual({
      content: 'Arrose bien aujourd’hui.\nJe te redis dans quelques jours.',
      actions: [{ type: 'remind', days: 3, label: 'Me rappeler dans 3 jours' }],
    });
  });

  it('accepte le JSON entouré de balises de code et normalise le libellé', () => {
    const reply = 'Coucou.\n```json\n{"action":{"type":"remind","days":1,"label":"x"}}\n```';
    expect(extractAction(reply)).toEqual({
      content: 'Coucou.',
      actions: [{ type: 'remind', days: 1, label: 'Me rappeler dans 1 jour' }],
    });
  });

  it('ignore une action invalide sans perdre le texte', () => {
    expect(extractAction('Salut.\n{"action":{"type":"remind","days":0}}').actions).toEqual([]);
    expect(extractAction('Une {accolade} dans le texte.')).toEqual({
      content: 'Une {accolade} dans le texte.',
      actions: [],
    });
  });
});

describe('toGeminiContents', () => {
  it('convertit les rôles, fusionne les tours consécutifs et marque les photos', () => {
    expect(
      toGeminiContents([
        { role: 'assistant', content: 'Salut !', photo_path: null },
        { role: 'user', content: null, photo_path: 'u/p/a.jpg' },
        { role: 'user', content: 'Des taches brunes ?', photo_path: null },
        { role: 'assistant', content: 'Pas d’inquiétude.', photo_path: null },
      ]),
    ).toEqual([
      { role: 'user', parts: [{ text: '[photo envoyée]' }, { text: 'Des taches brunes ?' }] },
      { role: 'model', parts: [{ text: 'Pas d’inquiétude.' }] },
    ]);
  });
});
