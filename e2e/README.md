# Tests de bout en bout (Maestro)

Les 8 parcours de `docs/05` : `flows/01` à `flows/08`. Connexion automatisée par lien magique
(`subflows/login.yaml` lit l'e-mail dans Mailpit et ouvre le lien profond `zeve://auth/callback`).

## Dans GitHub Actions (recommandé)
Workflow **E2E Android** (onglet Actions → *Run workflow*) : build de l'APK de test sur Linux, Supabase
local, émulateur et suite complète ; APK, rapport JUnit et captures en artefacts. Aucun jeton requis.

## En local — préparer (une fois)
1. [Maestro](https://maestro.mobile.dev) et un émulateur Android (API 33+) démarré.
2. Supabase local avec réponses d'IA déterministes — `supabase/functions/.env` :
   ```
   IDENTIFY_MOCK_SPECIES=monstera
   CHAT_MOCK=1
   ```
   puis `npm run db:start`.
3. Build de test installé sur l'émulateur (profil `e2e` d'`eas.json` : Supabase local via
   `10.0.2.2`, HTTP autorisé uniquement dans ce build) :
   ```
   npx eas-cli build --profile e2e --platform android --local --output zeve-e2e.apk
   adb install -r zeve-e2e.apk
   ```

## Lancer
```
npm run db:reset      # repart du jardin de démo de Camille
npm run e2e           # = maestro test e2e
```
L'ordre est fixé dans `config.yaml` (les parcours partagent le compte de démo).

## Hors suite automatique
| Parcours | Pourquoi | Comment le vérifier |
|---|---|---|
| 1 avec Google / Apple | page du fournisseur, comptes réels | à la main sur téléphone : Connexion → Google → choix du compte → Bienvenue → Jardin |
| 5 (photo) | dépend de l'appareil photo de l'émulateur | `maestro test e2e/flows/05-ajout-photo.yaml` (tag `manual`) ou à la main |
| Notifications | heure réelle du rappel | Réglages → heure dans 2 min, app fermée, plante assoiffée → notification → tap → fiche |

## Toasts

Les flows n'affirment jamais un toast : ils restent 2.6 s et `tapOn` attend que l'écran se
stabilise, souvent plus longtemps. On vérifie l'effet durable (compteur, jauge, écran d'arrivée) ;
les toasts sont couverts par les tests unitaires.
