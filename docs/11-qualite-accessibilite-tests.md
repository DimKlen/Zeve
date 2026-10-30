# 11 — Qualité, accessibilité, tests

## Check-list de parité visuelle (par écran, à cocher en Phase 7)
- [ ] Capture de l'app sur simulateur iPhone 390×844 superposée à `design/screens/NN-*.png` (opacité 50 %) : écarts ≤ 2 pt sur positions et tailles.
- [ ] Fond, surfaces et textes = tokens exacts (pas de couleur approchée).
- [ ] Titres en Bricolage Grotesque 700 avec l'espacement négatif prévu ; texte en Figtree ; noms latins en italique.
- [ ] Rayons conformes (cartes 22–24, boutons pilule, champs 16).
- [ ] Marges latérales 22 (onglets) / 18 (détails) ; haut/bas via safe areas.
- [ ] Textes identiques à `fr.json` (accents, apostrophes typographiques ’, espaces avant « : » et « ? » en français).
- [ ] Animation d'entrée de l'écran conforme à la table (`docs/03 §2`) et éléments en cascade (rise) aux bons délais.
- [ ] Mascottes : bonne espèce, bon stade, humeur juste, sway/bob/blink actifs (sauf listes).
- [ ] Aucune icône hors du jeu fourni, aucun emoji, aucun dégradé, aucune barre de statut factice.

## Accessibilité
- Cibles ≥ 44×44 (y compris chips 38 de haut → zone tactile étendue `hitSlop` à 44).
- Libellés : retour (« Retour au jardin », « Retour à la fiche », « Retour »), + (« Ajouter une plante »), options (« Plus d'options »), photo (« Prendre une photo »), envoyer (« Envoyer »), e-mail (« Recevoir un lien de connexion »).
- Mascotte : `accessibilityRole="image"`, libellé « {Nom} a soif » / « {Nom} est en forme » ; mascottes décoratives masquées (`accessible={false}`).
- États : chips/pièces/lumière/espèces `accessibilityState={{ selected }}` ; interrupteur `role="switch"` + `checked` ; bouton désactivé `disabled`.
- Annonces : toasts, « Connexion via… », « Reconnaissance de l'espèce… », indicateur de saisie → `accessibilityLiveRegion="polite"` / `AccessibilityInfo.announceForAccessibility`.
- Contrastes AA vérifiés (voir `docs/02`) ; ne jamais mettre de texte #55604F sur `butter` en dessous de 13 pt.
- Police dynamique : supporter jusqu'à 130 % (`maxFontSizeMultiplier={1.3}` sur titres), les cartes s'agrandissent sans couper.
- Réduction des mouvements respectée partout.

## Tests
| Niveau | Contenu |
|---|---|
| Unitaires (Jest) | `plantStatus` (soif, jauge, libellés, prochain arrosage, fuseau), `stageOf`, `sinceText`, `mix`, `drawPlant` (filtrage par stade, couleurs assoiffées), recherche d'espèces (accents, catégories, tri), `LIGHT_TIPS`, table des transitions, extraction de l'action du chat |
| Composants (RNTL) | Button (états), Toggle, Chip, TodoRow (bascule ✓), SpeciesRow (sélection), Toast (file) |
| Intégration | Hooks Query avec Supabase local (seed), mutations optimistes + rollback |
| E2E (Maestro) | Parcours 1 à 8 de `docs/05` ; reconnaissance photo simulée (Edge Function bouchonnée) en build e2e |
| Manuel appareil | Appareil photo + reconnaissance réelle, notifications à l'heure, OAuth Apple/Google réels, lien magique |

## Performance & robustesse
- 60 fps pendant les transitions et dans la grille animée ; listes virtualisées.
- Démarrage froid < 2.5 s avant l'animation de lancement.
- Images compressées ≤ 1280 px ; URLs signées en cache.
- Aucune clé secrète dans le bundle (vérifier avec une recherche dans le build).
- Gestion des erreurs réseau partout (toasts), arrosage hors-ligne mis en file.
