// Chat avec la plante (docs/06 F8, docs/07 plant-chat) : prompt, historique, action « me rappeler ».
// Module pur, sans API Deno : partagé par l'Edge Function plant-chat et testé par Jest.

export type PlantContext = {
  nickname: string;
  speciesName: string;
  latin: string;
  roomName: string | null;
  daysSinceWater: number;
  waterEveryDays: number;
  light: string;
  lightLabel: string;
  stage: 'Pousse' | 'Jeune' | 'Adulte';
  recentWaterings: string[];
};

export type ChatAction = { type: 'remind'; days: number; label: string };

export type StoredMessage = {
  role: 'user' | 'assistant';
  content: string | null;
  photo_path: string | null;
};

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

const LIGHT_NAMES: Record<string, string> = {
  ombre: 'ombre, loin des fenêtres',
  indirect: 'lumineux, sans soleil direct',
  soleil: 'plein soleil',
};

/** Prompt système de docs/07, adapté à Gemini. */
export function buildSystemPrompt(p: PlantContext): string {
  const home = p.roomName
    ? `dans le/la ${p.roomName} de ton humain·e`
    : 'chez ton humain·e';
  const waterings = p.recentWaterings.length
    ? `Derniers arrosages : ${p.recentWaterings.join(', ')}.`
    : 'Aucun arrosage enregistré pour l’instant.';
  return [
    `Tu es ${p.nickname}, une plante (${p.speciesName}, ${p.latin}) qui vit ${home}.`,
    'Tu parles à la première personne, en français, en tutoyant, avec chaleur et simplicité.',
    `Ton état : dernier arrosage il y a ${p.daysSinceWater} jours (rythme idéal : tous les ${p.waterEveryDays} jours), ` +
      `lumière à ton emplacement : ${LIGHT_NAMES[p.light] ?? p.light}, lumière idéale : ${p.lightLabel}, stade dans l'app : ${p.stage}.`,
    waterings,
    'Réponds en 2 à 5 phrases, avec des conseils concrets et prudents, en texte simple sans Markdown. ' +
      'Si une photo est fournie, décris ce que tu observes avant de conseiller.',
    'Ne prétends jamais être un professionnel ; en cas de doute sérieux (parasites étendus, pourriture), conseille de demander à un jardinier.',
    'Mentionne la toxicité pour les animaux si c’est pertinent.',
    'Si un suivi dans quelques jours est utile, termine par une ligne JSON seule :',
    '{"action":{"type":"remind","days":N,"label":"Me rappeler dans N jours"}}',
  ].join('\n');
}

const MAX_REMIND_DAYS = 60;

/** Retire la ligne JSON d'action éventuelle du texte et la renvoie à part. */
export function extractAction(reply: string): { content: string; actions: ChatAction[] } {
  const lines = reply.trim().split('\n');
  const actions: ChatAction[] = [];
  const kept: string[] = [];
  for (const line of lines) {
    const raw = line.trim();
    // Balises de code autour du JSON : supprimées.
    if (/^```(json)?$/.test(raw)) continue;
    const trimmed = raw.replace(/^```(json)?|```$/g, '').trim();
    if (trimmed.startsWith('{') && trimmed.includes('"action"')) {
      try {
        const parsed = JSON.parse(trimmed) as { action?: Partial<ChatAction> };
        const a = parsed.action;
        const days = Math.round(Number(a?.days));
        if (a?.type === 'remind' && days >= 1 && days <= MAX_REMIND_DAYS) {
          actions.push({ type: 'remind', days, label: `Me rappeler dans ${days} jour${days > 1 ? 's' : ''}` });
          continue;
        }
      } catch {
        // Pas du JSON : on garde la ligne telle quelle.
      }
    }
    kept.push(line);
  }
  return { content: kept.join('\n').trim(), actions };
}

/** Historique → contenus Gemini (assistant = « model ») ; les anciennes photos deviennent un repère texte. */
export function toGeminiContents(history: StoredMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const m of history) {
    const text = [m.photo_path ? '[photo envoyée]' : null, m.content].filter(Boolean).join(' ');
    if (!text) continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    // Gemini attend des tours alternés : on fusionne deux messages consécutifs du même auteur.
    if (last && last.role === role) last.parts.push({ text });
    else contents.push({ role, parts: [{ text }] });
  }
  // Le fil doit commencer par l'utilisateur.
  while (contents[0]?.role === 'model') contents.shift();
  return contents;
}
