# 08 — Architecture & stack

## Stack
| Besoin | Choix |
|---|---|
| App | **Expo** (dernière SDK stable) + React Native + **TypeScript strict** |
| Navigation | **expo-router** (Stack `animation: 'none'` + transitions maison, Tabs avec barre personnalisée) |
| Animations | **react-native-reanimated** (Keyframes, worklets), react-native-gesture-handler |
| Dessin | **react-native-svg** (plantes, icônes, anneaux) |
| Polices | `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/figtree`, `expo-font`, `expo-splash-screen` (fond #1F3D2B) |
| Backend | **Supabase** (`@supabase/supabase-js`), session dans `expo-secure-store` (adapter) |
| OAuth | `expo-web-browser` + `expo-auth-session` (redirect `zeve://auth/callback`), `expo-apple-authentication`, `expo-crypto` (nonce) |
| Données | **TanStack Query** (+ persistance AsyncStorage), **Zustand** (brouillon de création, toasts, UI) |
| Photos | `expo-image-picker`, `expo-image-manipulator` (redimension), `expo-image` (affichage) |
| Notifications | `expo-notifications` |
| Haptique | `expo-haptics` |
| Safe areas | `react-native-safe-area-context` |
| Qualité | ESLint (expo config) + Prettier, Jest + `@testing-library/react-native`, **Maestro** (E2E) |
| Build | **EAS Build** (profils development / preview / production), EAS Update. Un *development build* est recommandé (OAuth natif Apple, notifications) ; Expo Go suffit pour les premières phases UI. |

## Arborescence du code
```
app/                       # routes (voir docs/05)
src/
  theme/index.ts           # ← reference/theme.ts
  motion/index.ts          # ← reference/motion.ts
  motion/transitions.ts    # table (origine, destination) → anim + helper navigate(...)
  i18n/fr.json             # ← reference/i18n/fr.json ; helper t('clé', { nom })
  components/
    icons.tsx              # ← reference/icons.tsx
    Screen.tsx             # conteneur racine : fond, safe areas, animation d'entrée
    Button.tsx, IconButton.tsx, ProviderButton.tsx, TextButton.tsx
    Card.tsx, Chip.tsx, LightOption.tsx, TextField.tsx, Toggle.tsx
    Toast.tsx (+ store), BottomSheet.tsx, TabBar.tsx
    InfoTile.tsx, WaterGauge.tsx, GrowthSteps.tsx, ChatBubble.tsx, TypingDots.tsx
    Spinner.tsx, Rise.tsx (wrapper d'entrée en cascade)
  plants/
    plantForms.generated.ts, species.ts, careInfo.ts, drawPlant.ts, plantStatus.ts   # ← reference/plants
    PlantAvatar.tsx        # ← reference/plants/PlantAvatar.tsx
  features/
    auth/  (useAuth, signInWithGoogle, signInWithApple, signInWithEmail, callback)
    garden/ (usePlants, useWater, PlantCard, TodoCard)
    plant/  (usePlant, MascotScene, MoodBubble)
    chat/   (useChat, useSendMessage)
    newPlant/ (draftStore, useIdentifySpecies, SpeciesRow, useCreatePlant, AddedBadge)
    notifications/ (schedule.ts : recalcul des rappels locaux)
    settings/
  lib/
    supabase.ts, database.types.ts, queryClient.ts, haptics.ts, dates.ts, deeplinks.ts
supabase/
  migrations/0001_init.sql # ← reference/supabase/schema.sql
  seed.dev.sql             # Camille & ses 6 plantes
  functions/identify-species, plant-chat, delete-account, daily-reminders
e2e/                       # flows Maestro (docs/05 « Parcours clés »)
```

## Conventions
- Composants fonctionnels, props typées, pas de style inline numérique : `StyleSheet.create` avec tokens du thème.
- Un écran = composition de composants ; aucune requête Supabase directement dans un écran (passer par les hooks `features/*`).
- Textes via `t()`. Dates en français (`Intl.DateTimeFormat('fr-FR')`).
- Accessibilité : `accessibilityRole`, `accessibilityLabel`, `accessibilityState` (selected/checked/disabled) sur tous les éléments interactifs ; `accessibilityLiveRegion="polite"` sur les toasts et états « en cours ».
- Erreurs : `try/catch` dans les mutations → toast ; journalisation (Sentry optionnel en phase 8).
- Configuration (app.config.ts) : `scheme: 'zeve'`, nom « Zeve », bundle id **[À FOURNIR]**, orientation portrait, `userInterfaceStyle: 'light'`, plugins (notifications, apple-auth, image-picker, splash), textes d'usage (caméra : « Zeve utilise l'appareil photo pour reconnaître tes plantes et les montrer à l'assistant. », photos).

## Variables d'environnement
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (app) ; `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` (Edge Functions). Identifiants OAuth Google (iOS/Android/Web) et Apple (Service ID, clé) dans le tableau de bord Supabase.
