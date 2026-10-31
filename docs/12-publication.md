# 12 — Build, tests de bout en bout et publication

## Profils EAS (`eas.json`)
| Profil | Usage | Particularités |
|---|---|---|
| `development` | development build (Expo Dev Client) | OAuth natif, notifications, rechargement à chaud |
| `preview` | APK Android interne / build iOS ad hoc | Supabase en ligne (variables d'environnement EAS « preview ») |
| `production` | stores | numéro de build auto-incrémenté (version gérée par EAS) |
| `e2e` | tests Maestro sur émulateur | Supabase local via `10.0.2.2`, HTTP autorisé (`ZEVE_E2E=1`) — jamais publié |

Variables à créer dans EAS (Project → Environment variables), environnements *preview* et *production* :
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (clé publique du projet Supabase en ligne).

## Build Android sans EAS (machine locale)
JDK 21 et SDK Android requis.
```
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk (signé avec la clé de debug : test uniquement)
```
**Windows** : la compilation C++ (Reanimated, Screens) dépasse la limite de 260 caractères des chemins
sous `C:\Users\…\Projects\Zeve`. Compiler depuis un lecteur virtuel court, en montant le dossier
**parent** (à la racine d'un lecteur, l'autolinking d'Expo ne trouve pas `package.json`) :
```
subst Z: C:\Users\Sekoya\Projects            # puis travailler dans Z:\Zeve
subst Z: /D                                  # pour le retirer
```
En cas d'échec précédent, supprimer d'abord `android/` et les dossiers `node_modules/*/android/.cxx`.

## Build Android via GitHub Actions (APK en release)
Workflow `APK Android` (déclenchement manuel). Pré-requis : secret `EXPO_TOKEN` du dépôt, et clé de
signature Android créée une fois sur EAS : `npx eas-cli credentials -p android` → *Keystore* → *Generate new*.

## Supabase en ligne
```
npx supabase link --project-ref <ref>
npx supabase db push                     # migrations 0001 → 0003
npx supabase functions deploy identify-species plant-chat delete-account
npx supabase secrets set PLANTNET_API_KEY=… GEMINI_API_KEY=… GEMINI_MODEL=gemini-3.5-flash-lite
```
Auth → URL Configuration : ajouter `zeve://auth/callback`. Ne pas exécuter `seed.dev.sql` en ligne.

## Tests de bout en bout
Workflow GitHub **E2E Android** (manuel) : APK de test construit sur Linux sans EAS, Supabase local,
émulateur, suite Maestro (8 parcours de `docs/05`) ; l'APK de test est téléchargeable en artefact.
Détails et exécution locale : `e2e/README.md`.

## Store
Fiche, captures et questionnaires : `docs/store/fiche-store.md`. Pages légales publiées depuis le dépôt :
`docs/store/politique-confidentialite.md`, `docs/store/conditions-utilisation.md`.

## À fournir par le propriétaire
| Élément | Pour | Où le mettre |
|---|---|---|
| Jeton Expo (`EXPO_TOKEN`) | builds EAS depuis GitHub | secret GitHub du dépôt |
| Clé de signature Android | APK / Play Store | `npx eas-cli credentials -p android` (générée par EAS) |
| Projet Supabase en ligne | données hors de ta machine | voir « Supabase en ligne » |
| Identifiants OAuth Google (client Web) | « Continuer avec Google » | Supabase → Auth → Providers → Google |
| Apple Developer (99 $/an) : Services ID + clé Sign in with Apple | « Continuer avec Apple », iOS, TestFlight | Supabase → Auth → Providers → Apple ; certificats via `eas credentials` |
| Compte Google Play Console (25 $ une fois) | publication Android | Play Console, puis `eas submit` |
| Bundle id / package définitif | stores (aujourd'hui `com.zeve.app`) | variable `ZEVE_BUNDLE_ID` ou `app.config.ts` |
| Adresse e-mail de contact | pages légales et fiches store | `docs/store/*.md` (repère « [À FOURNIR] ») |
