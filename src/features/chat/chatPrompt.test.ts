import {
  buildSystemPrompt,
  extractAction,
  isSouthernPlace,
  seasonNameOf,
  toGeminiContents,
  type PlantContext,
} from '../../../supabase/functions/_shared/chatPrompt';

const gaston: PlantContext = {
  nickname: 'Gaston',
  speciesName: 'Monstera',
  latin: 'Monstera deliciosa',
  daysSinceWater: 9,
  waterEveryDays: 8,
  light: 'indirect',
  lightLabel: 'Vive, indirecte',
  stage: 'Adulte',
  recentWaterings: ['21 oct.', '13 oct.'],
  season: 'automne',
  place: 'Paris, France',
  southern: false,
};

describe('buildSystemPrompt', () => {
  it('donne à la plante son nom, son espèce et son état', () => {
    const prompt = buildSystemPrompt(gaston);
    expect(prompt).toContain(
      'Tu es Gaston, une plante (Monstera, Monstera deliciosa) qui vit chez ton humain·e, à Paris, France.',
    );
    expect(prompt).toContain('dernier arrosage il y a 9 jours (rythme idéal : tous les 8 jours)');
    expect(prompt).toContain(
      'exposition idéale pour ton espèce : lumière vive mais sans soleil direct (Vive, indirecte), emplacement conseillé : près d’une fenêtre',
    );
    expect(prompt).toContain('Derniers arrosages : 21 oct., 13 oct.');
    expect(prompt).toContain('"type":"remind"');
  });

  it('donne la saison pour adapter les conseils', () => {
    expect(buildSystemPrompt(gaston)).toContain('Saison actuelle : automne (hémisphère nord)');
    expect(seasonNameOf(new Date(2026, 0, 5), true)).toBe('été');
    expect(isSouthernPlace(-33.9, null)).toBe(true);
    expect(isSouthernPlace(null, 'au')).toBe(true);
    expect(isSouthernPlace(45.5, 'AU')).toBe(false);
    expect(seasonNameOf(new Date(2026, 0, 5))).toBe('hiver');
    expect(seasonNameOf(new Date(2026, 6, 5))).toBe('été');
    expect(seasonNameOf(new Date(2026, 10, 1))).toBe('automne');
  });

  it('donne la météo du moment quand elle est connue', () => {
    expect(buildSystemPrompt({ ...gaston, todayWeather: '4 °C, 82 % d’humidité' })).toContain(
      'Météo en ce moment chez toi : 4 °C, 82 % d’humidité.',
    );
    expect(buildSystemPrompt(gaston)).not.toContain('Météo en ce moment');
  });

  it('se passe de lieu et d’arrosages', () => {
    const prompt = buildSystemPrompt({ ...gaston, place: null, recentWaterings: [] });
    expect(prompt).toContain('qui vit chez ton humain·e.');
    expect(prompt).toContain('Aucun arrosage enregistré');
  });

  it('ne parle plus de pièce ni de lumière choisie par l’utilisateur', () => {
    const prompt = buildSystemPrompt(gaston);
    expect(prompt).not.toMatch(/pièce|Salon/);
    expect(prompt).not.toContain('à ton emplacement');
  });

  it('demande des réponses courtes de 2 à 4 phrases, développées sur demande seulement', () => {
    const prompt = buildSystemPrompt(gaston);
    expect(prompt).toContain('2 à 4 phrases par défaut');
    expect(prompt).toContain('Ne développe que si ton humain·e te le demande');
  });

  it('cadre strictement le périmètre et résiste aux contournements', () => {
    const prompt = buildSystemPrompt(gaston);
    expect(prompt).toContain('PÉRIMÈTRE STRICT');
    for (const topic of ['maladies', 'nuisibles', 'rempotage', 'arrosage', 'placement']) {
      expect(prompt).toContain(topic);
    }
    expect(prompt).toContain('refuse poliment en une seule phrase');
    expect(prompt).toContain('sans répondre à la question');
    expect(prompt).toContain('oublier');
    expect(prompt).toContain('jouer un autre rôle');
  });
});

describe('extractAction', () => {
  it('retire la ligne JSON et renvoie l’action', () => {
    const reply =
      'Arrose bien aujourd’hui.\nJe te redis dans quelques jours.\n{"action":{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}}';
    expect(extractAction(reply)).toEqual({
      content: 'Arrose bien aujourd’hui.\nJe te redis dans quelques jours.',
      actions: [{ type: 'remind', days: 3, label: 'Me rappeler dans 3 jours' }],
      followup: null,
    });
  });

  it('accepte le JSON entouré de balises de code et normalise le libellé', () => {
    const reply = 'Coucou.\n```json\n{"action":{"type":"remind","days":1,"label":"x"}}\n```';
    expect(extractAction(reply)).toEqual({
      content: 'Coucou.',
      actions: [{ type: 'remind', days: 1, label: 'Me rappeler dans 1 jour' }],
      followup: null,
    });
  });

  it('ignore une action invalide sans perdre le texte', () => {
    expect(extractAction('Salut.\n{"action":{"type":"remind","days":0}}').actions).toEqual([]);
    expect(extractAction('Une {accolade} dans le texte.')).toEqual({
      content: 'Une {accolade} dans le texte.',
      actions: [],
      followup: null,
    });
  });
});

describe('extractAction : suivi de soins', () => {
  it('sort le suivi du texte et retire le bouton « Me rappeler »', () => {
    const reply = [
      'Passe un coton imbibé d’alcool sur chaque tache.',
      '{"action":{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}}',
      '{"action":{"type":"followup","days":7,"topic":"les cochenilles"}}',
    ].join(String.fromCharCode(10));
    expect(extractAction(reply)).toEqual({
      content: 'Passe un coton imbibé d’alcool sur chaque tache.',
      actions: [],
      followup: { type: 'followup', days: 7, topic: 'les cochenilles' },
    });
  });

  it('reconnaît la clôture et ignore un suivi invalide', () => {
    expect(
      extractAction('Bravo !' + String.fromCharCode(10) + '{"action":{"type":"followup_done"}}')
        .followup,
    ).toEqual({
      type: 'followup_done',
    });
    expect(
      extractAction(
        'Ok.' + String.fromCharCode(10) + '{"action":{"type":"followup","days":90,"topic":"x"}}',
      ),
    ).toEqual({
      content: 'Ok.',
      actions: [],
      followup: null,
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
