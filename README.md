# Zeve — kit de développement

Tout ce qu'il faut pour qu'un agent de code (Claude Code) construise l'application mobile **Zeve** à l'identique du design réalisé dans Claude Design.

> Zeve : une app de jardin d'intérieur où chaque plante est une petite mascotte vivante dans son pot. Elle te dit quand elle a soif, grandit avec le temps, répond à tes questions (chat IA avec photo) et se reconnaît en une photo quand tu l'ajoutes.

## Contenu

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Instructions permanentes pour l'agent (à copier à la racine du repo). |
| `docs/01-vision-ambiance.md` | Produit, public, ton, ambiance, principes. |
| `docs/02-design-system.md` | Couleurs, typo, espacements, rayons, ombres, icônes, composants. |
| `docs/03-motion-transitions.md` | Toutes les transitions et animations, valeurs exactes. |
| `docs/04-ecrans.md` | Spécification de chaque écran (layout, contenu, états, interactions) + captures. |
| `docs/05-navigation-flux.md` | Carte de navigation, parcours, routes expo-router. |
| `docs/06-fonctionnalites.md` | Règles métier : arrosage, soif, croissance, ajout de plante, IA, notifications, OAuth. |
| `docs/07-donnees-backend.md` | Supabase : schéma, RLS, stockage, Edge Functions, prompts IA. |
| `docs/08-architecture.md` | Stack, librairies, arborescence, conventions de code. |
| `docs/09-plan-de-developpement.md` | Phases, tickets, critères d'acceptation, prompts prêts à coller. |
| `docs/10-dessins-plantes.md` | Système des 19 dessins × 3 tailles et son implémentation. |
| `docs/11-qualite-accessibilite-tests.md` | Accessibilité, performance, tests, check-list de parité visuelle. |
| `design/screens/*.png` | 29 captures haute définition (@2x) de tous les écrans et états. |
| `design/prototype-claude-design.dc.html` | Source du prototype Claude Design : **référence ultime** en cas de doute sur une valeur. |
| `reference/theme.ts` | Tokens de design prêts à l'emploi. |
| `reference/motion.ts` | Tokens d'animation + Keyframes Reanimated. |
| `reference/icons.tsx` | Toutes les icônes (react-native-svg). |
| `reference/plants/*` | Dessins générés, catalogue 52 espèces, moteur `drawPlant`, composant `PlantAvatar`, règles `plantStatus`. |
| `reference/supabase/schema.sql` | Migration initiale complète (tables, RLS, vue, storage, seed des espèces). |
| `reference/i18n/fr.json` | Tous les textes de l'interface. |

## Comment l'utiliser avec Claude Code

1. Crée un dossier vide pour le projet, copie **tout ce kit** dedans sous `docs-zeve/` (ou à la racine) et place `CLAUDE.md` à la racine.
2. Ouvre Claude Code dans ce dossier et donne-lui le prompt de la **Phase 0** de `docs/09-plan-de-developpement.md`.
3. Enchaîne les phases dans l'ordre. Chaque phase se termine par une démo et une comparaison avec les captures `design/screens/`.
4. Pour chaque écran, l'agent doit ouvrir la capture correspondante **et** la section de `docs/04-ecrans.md` avant d'écrire du code.

## Décisions par défaut (modifiables)

- **Mobile** : Expo (React Native, TypeScript, expo-router), *development build* recommandé (OAuth natif, notifications).
- **Backend** : Supabase (Auth OAuth Google/Apple + lien magique, Postgres, Storage, Edge Functions).
- **IA** : API Claude (vision) appelée uniquement depuis des Edge Functions (clé jamais dans l'app).
- **Langue** : français uniquement en v1 (textes centralisés dans `fr.json` pour une traduction future).
- Éléments marqués **[À FOURNIR]** : identifiants OAuth, clés API, bundle id, pages web légales.
- **Ajout d'une plante** : uniquement depuis le bouton + du jardin (photo ou liste d'espèces).
