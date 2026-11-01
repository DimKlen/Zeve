// Liens et réglages fournis par l'environnement (docs/09 « À fournir par toi »).

// Pages légales publiées dans le dépôt public (docs/store/) ; remplaçables par un site via EXPO_PUBLIC_*.
const LEGAL_BASE = 'https://github.com/DimKlen/Zeve/blob/main/docs/store';

export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ?? `${LEGAL_BASE}/conditions-utilisation.md`;
export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ?? `${LEGAL_BASE}/politique-confidentialite.md`;

// Carte « Croissance » de la fiche plante : masquée à la demande. Les stades restent calculés
// (taille de la mascotte, badge du jardin, toasts de passage de stade) ; remettre à true pour la réafficher.
export const SHOW_GROWTH_CARD = false;
