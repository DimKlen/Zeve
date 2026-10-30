# CLAUDE.md — Zeve

Tu développes **Zeve**, une app mobile Expo/React Native de gestion de plantes d'intérieur, à partir d'un design Claude Design figé. Ce fichier s'applique à toute la session.

## Sources de vérité (dans cet ordre)
1. `design/screens/*.png` — le rendu attendu, pixel près (captures @2x d'un écran 390×844).
2. `docs/04-ecrans.md` — layout, textes, états, interactions de chaque écran.
3. `docs/02-design-system.md` + `reference/theme.ts` — tokens. `docs/03-motion-transitions.md` + `reference/motion.ts` — animations.
4. `design/prototype-claude-design.dc.html` — code source du prototype : si une valeur manque ailleurs, elle est là (styles inline, keyframes CSS dans `<helmet>`, logique dans `renderVals()`).
5. `docs/06-fonctionnalites.md` — règles métier. `docs/07-donnees-backend.md` — données.

Ne réinvente rien de visuel. Si un écran ou un état n'est pas maquetté (erreur réseau, liste vide…), applique les règles « Non maquetté » de `docs/04-ecrans.md` dans le même style et signale-le.

## Règles non négociables
- **Aucune couleur, taille, rayon, police ou durée en dur** dans les écrans : tout vient de `src/theme` et `src/motion` (copiés depuis `reference/`).
- Polices : **Bricolage Grotesque 700** pour les titres, **Figtree** 400/500/600/700 pour le reste. Jamais Inter/Roboto/système en visible.
- Icônes : uniquement `src/components/icons` (traits arrondis). **Jamais d'emoji.**
- Les plantes sont **toujours** dessinées via `PlantAvatar` + `drawPlant` (19 types × 3 tailles). Ne remplace jamais par une image ou une icône générique.
- Pas de barre de statut factice, pas de dégradés, pas de cartes à bordure gauche colorée.
- Toutes les cibles tactiles ≥ 44 px. Textes ≥ 4.5:1 de contraste. `accessibilityLabel` sur tous les boutons-icônes.
- Respecte `useReducedMotion()` : si actif, pas d'animations en boucle et transitions instantanées.
- Textes de l'UI : uniquement via `src/i18n/fr.json` (copié de `reference/i18n/fr.json`), tutoiement, ton chaleureux.
- Les clés API (Claude) ne sont **jamais** dans l'app : seulement dans les Edge Functions Supabase.
- TypeScript strict, pas de `any` hors des props animées Reanimated/SVG.
- L'ajout d'une plante passe **uniquement** par le bouton + du jardin → Nouvelle plante (photo ou liste). N'ajoute aucune autre méthode (NFC, scan, QR…) : hors périmètre.

## Façon de travailler
- Suis `docs/09-plan-de-developpement.md` phase par phase. Ne commence pas une phase sans avoir fini les critères d'acceptation de la précédente.
- Avant chaque écran : lis sa section dans `docs/04-ecrans.md`, ouvre sa capture, liste les composants à réutiliser.
- Après chaque écran : lance l'app (iOS simulateur + Android), compare visuellement à la capture (même cadrage 390×844), corrige les écarts d'espacement, de couleur, de typo et de mouvement.
- Écris les tests unitaires des règles métier (`plantStatus`, recherche d'espèces, conseils de lumière, stades) avant de les brancher à l'UI.
- Commits petits et nommés `feat(écran): …`, `fix(…): …`.

## Commandes
- `npm start` (= `expo start --dev-client`) — lancer l'app (development build) ; `npm run start:go` pour Expo Go.
- `npm run typecheck`, `npm run lint`, `npm test` — doivent passer avant chaque commit.
- `npm run db:start` / `npm run db:reset` — base locale avec seed (Docker Desktop requis). `npm run db:types` régénère `src/lib/database.types.ts`.
- `maestro test e2e/` — parcours de bout en bout.

## Notes d'environnement
- Expo SDK 58 (React Native 0.88, Reanimated 4.7). Routes dans `app/` à la racine ; le Jardin est `app/(app)/(tabs)/garden.tsx` (route `/garden`).
- Supabase local sur les ports **553xx** (API 55321, DB 55322, Studio 55323, Mailpit 55324) : Windows réserve 54310–54409 (Hyper-V) et Zabava utilise les 543xx.
- `.env.local` (non versionné) : `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — voir `.env.example`.
- `reference/` reste la copie d'origine du kit ; le code vit dans `src/`.
