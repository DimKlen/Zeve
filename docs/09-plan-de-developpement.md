# 09 — Plan de développement

9 phases, à faire dans l'ordre. Chaque phase : objectif, tâches, critères d'acceptation (CA), captures à comparer, et un **prompt prêt à coller** dans Claude Code. Estimation indicative pour un agent supervisé : 1 à 3 sessions par phase.

Rappel pour chaque phase : lire `CLAUDE.md`, les docs citées, ouvrir les captures, puis coder. Terminer par `npm run typecheck && npm run lint && npm test` et une comparaison visuelle.

---

## Phase 0 — Socle du projet
**Objectif** : projet Expo prêt, thème, polices, navigation vide, base Supabase locale.
- Créer l'app Expo TypeScript (template `default` expo-router), arborescence de `docs/08`.
- Installer les dépendances de `docs/08` ; configurer `app.config.ts` (scheme `zeve`, nom Zeve, portrait, light, plugins notifications / apple-auth / image-picker / splash).
- Copier `reference/theme.ts` → `src/theme`, `reference/motion.ts` → `src/motion`, `reference/icons.tsx` → `src/components/icons.tsx`, `reference/plants/*` → `src/plants/`, `reference/i18n/fr.json` → `src/i18n/`.
- Charger les polices + splash natif #1F3D2B. Créer les routes vides de `docs/05` avec un `Screen` de base.
- ESLint, Prettier, Jest, scripts `typecheck`, `lint`, `test`. `eas.json` (development / preview / production).
- Supabase local (`supabase init`, migration `0001_init.sql` depuis `reference/supabase/schema.sql`, `db reset`).

**CA** : l'app démarre sur iOS et Android ; les polices Bricolage/Figtree s'affichent ; `supabase db reset` crée les tables et 52 espèces ; CI locale verte.

> **Prompt** : « Lis CLAUDE.md, docs/08-architecture.md et docs/05-navigation-flux.md. Réalise la Phase 0 de docs/09-plan-de-developpement.md : initialise le projet Expo TypeScript avec expo-router, installe et configure les dépendances listées, copie les fichiers de reference/ aux emplacements indiqués, crée toutes les routes vides avec un composant Screen, configure les polices et le splash, ESLint/Prettier/Jest, eas.json et Supabase local avec la migration fournie. Donne-moi les commandes pour lancer l'app. »

---

## Phase 1 — Design system & mascotte
**Objectif** : tous les composants de `docs/02 §7`, les animations de `docs/03`, la mascotte `PlantAvatar` et la planche des dessins.
- Composants : Button (primary/sun/secondary/disabled + chargement), TextButton, IconButton, ProviderButton, Card, Chip (3 variantes), LightOption, TextField (+ recherche), Toggle, Toast (store + entrée/sortie), BottomSheet, TabBar, InfoTile, WaterGauge, GrowthSteps, ChatBubble, TypingDots, Spinner, AddedBadge, Rise, Screen (entrée fwd/back/up/fade/zoom + réduction des mouvements).
- `PlantAvatar` (feuillage animé séparé du pot, visage simple/complet, blink, bob, gouttes) + tests de `drawPlant` (nombre d'éléments par stade).
- Écran `app/dev/plants.tsx` = planche des dessins (19 × 3) + page « Kitchen sink » listant chaque composant dans tous ses états.
- `src/motion/transitions.ts` : table de `docs/03 §2` et helper `go(route, params)` qui choisit l'animation.

**CA** : la planche dev correspond à `15-planche-dessins.png` (mêmes formes, couleurs, tailles relatives) ; chaque composant respecte les tokens ; sway/bob/blink fluides à 60 fps ; réduction des mouvements coupe tout.

> **Prompt** : « Phase 1. Lis docs/02-design-system.md, docs/03-motion-transitions.md et docs/10-dessins-plantes.md. Implémente tous les composants listés en §7 du design system avec les tokens de src/theme et src/motion, le composant Screen avec ses 5 animations d'entrée, la table des transitions, et PlantAvatar à partir de reference/plants/PlantAvatar.tsx. Crée app/dev/plants.tsx qui reproduit design/screens/15-planche-dessins.png et une page kitchen sink. Compare la planche à la capture et corrige les écarts. »

---

## Phase 2 — Authentification, lancement & onboarding
**Écrans** : 01, 02, 02b, 05, 06 (+ comportements 03/04 système).
- Lancement animé (séquence exacte) et aiguillage session / onboarding / notification d'ouverture.
- Connexion : trio animé, boutons Google/Apple officiels, e-mail + lien magique, mentions.
- Supabase Auth Google (PKCE + WebBrowser), Apple (natif iOS / web Android), OTP e-mail, callback `zeve://auth/callback`, persistance SecureStore, `useAuth`.
- Connexion en cours (min 1.8 s), erreurs/annulation (toasts).
- Onboarding en une étape : rappels (permission notifications, `reminders_enabled`, jeton, `onboarded_at`) → Jardin (up).
- Gardes de routes `(auth)` / `(onboarding)` / `(app)`.

**CA** : les 3 méthodes de connexion fonctionnent sur appareil réel ; annuler affiche « Connexion annulée » ; un nouveau compte voit l'onboarding une seule fois ; un compte existant arrive au Jardin ; captures 01, 02, 02b, 05, 06 reproduites (positions, typo, couleurs, animations d'entrée).

> **Prompt** : « Phase 2. Lis docs/04-ecrans.md sections 1 à 6, docs/06 F1–F2 et docs/03 §6. Implémente le lancement animé, la connexion (Google, Apple, lien magique) avec Supabase, l'écran Connexion en cours, l'onboarding rappels et les gardes de navigation. Ouvre design/screens/01 à 06 et fais correspondre chaque écran. Configure ce qu'il faut dans app.config.ts et liste-moi les réglages à faire dans Supabase, Google Cloud et Apple Developer. »

---

## Phase 3 — Jardin & fiche plante
**Écrans** : 07, 07b, 07c, 08, 08b, 08c, 08d.
- Seed de démo (docs/06 F13). Hooks `usePlants`, `usePlant` sur `plant_overview` ; `plantStatus` testé.
- Jardin : en-tête, bouton + (vers Nouvelle plante — branché en Phase 4), carte « À arroser » (couleur réglable), grille avec badges de stade, tri, toasts, tirer pour rafraîchir, état vide, squelettes.
- Arrosage optimiste + annulation, haptique, replanification des notifications (stub en attendant la Phase 6).
- Fiche : scène (halo, bulle, mascotte 230 px avec humeur, gouttes), tuiles, bouton arroser/annuler, croissance, bon à savoir, carte chat, menu « … » (feuille d'options : renommer, pièce, rythme d'arrosage, historique, supprimer).
- TabBar Jardin/Réglages, transitions zoom/back/fade.

**CA** : avec le seed, le Jardin et la Fiche de Gaston sont identiques aux captures 07 et 08 ; arroser Gaston donne 07b/08b ; Piquant = Pousse (08c), Frida = Jeune (08d) ; l'annulation revient à l'état précédent ; tests `plantStatus` verts (soif, jauge, libellés, stades, `sinceText`).

> **Prompt** : « Phase 3. Lis docs/04 sections 7 et 8, docs/06 F3–F5, docs/07 (plant_overview, mutations). Crée le seed de démo, les hooks de données, le Jardin et la Fiche plante avec arrosage optimiste et annulation, puis la TabBar. Écris d'abord les tests de src/plants/plantStatus.ts. Compare à design/screens/07* et 08* et corrige jusqu'à correspondance. »

---

## Phase 4 — Ajout d'une plante (espèces, photo IA)
**Écrans** : 11, 11b, 11c, 12, 12b, 12c, 12d, 13, 14.
- Bouton + du jardin (et CTA de l'état vide) → Nouvelle plante en modale (up) ; brouillon Zustand réinitialisé.
- Nouvelle plante : choix photo / liste, reconnaissance, carte espèce + « Changer », nom, pièces, lumière + conseils, CTA « Ajouter au jardin » désactivé/actif, état d'enregistrement.
- Liste des espèces : recherche sans accents, catégories, tri, sélection, état vide → photo.
- Edge Function `identify-species` (prompt docs/07) + upload photo (tmp → dossier de la plante).
- Création de la plante (`createPlant`), écran Plante ajoutée (mascotte Pousse, haptique), « Voir sa fiche » + toast, « Ajouter une autre plante ».

**CA** : le parcours photo et le parcours liste créent une plante qui apparaît en Pousse au Jardin et dans sa fiche ; la recherche « fic » donne Ficus benjamina et Figuier lyre ; une photo non reconnue bascule vers la liste ; captures 11 à 14 reproduites.

> **Prompt** : « Phase 4. Lis docs/04 sections 11 à 13, docs/06 F6–F7, docs/07 identify-species. Implémente le parcours d'ajout depuis le bouton + : Nouvelle plante avec brouillon, liste des 52 espèces (recherche, catégories), reconnaissance photo via une Edge Function Claude, création de la plante et écran Plante ajoutée. Compare à design/screens/11 à 14. »

---

## Phase 5 — Chat IA
**Écrans** : 09, 09b.
- Edge Function `plant-chat` (contexte, prompt, quota, actions), `useChat` / `useSendMessage` (optimiste), indicateur de saisie, suggestions, photo (caméra/galerie + upload), action « Me rappeler dans N jours » (reminders + toast), séparateurs de date, erreur + réessayer, clavier.

**CA** : poser une question renvoie une réponse à la 1re personne en < 8 s ; la photo est visible dans le fil ; l'action rappel crée une notification planifiée ; captures 09 et 09b reproduites.

> **Prompt** : « Phase 5. Lis docs/04 section 9, docs/06 F8, docs/07 plant-chat. Implémente l'Edge Function et l'écran de chat complet. Compare à design/screens/09 et 09b. »

---

## Phase 6 — Notifications & réglages
**Écrans** : 10 (+ pièces, confidentialité non maquettés).
- `features/notifications/schedule.ts` : recalcul des rappels locaux (docs/06 F9) à l'ouverture, après arrosage, ajout, changement d'heure ; tap notification → fiche.
- Réglages : profil + badge fournisseur, interrupteur rappels (permission), heure (picker natif), pièces (CRUD), confidentialité (export JSON, suppression de compte via Edge Function), déconnexion avec confirmation, version (appui long → dev).

**CA** : désactiver les rappels annule toutes les notifications ; changer l'heure replanifie ; supprimer le compte efface tout ; capture 10 reproduite.

> **Prompt** : « Phase 6. Lis docs/04 section 10, docs/06 F9–F10. Implémente la planification des notifications locales et l'ensemble des réglages, y compris les écrans non maquettés en suivant les règles “Non maquetté” de docs/04. Compare à design/screens/10. »

---

## Phase 7 — Finitions & parité visuelle
- Passer la check-list de `docs/11` écran par écran (espacements, typo, couleurs, ombres, rayons, textes exacts).
- Vérifier chaque transition de la table `docs/03 §2` et chaque séquence `§6` ; haptique ; réduction des mouvements.
- Toasts (catalogue F11), états vides/chargement/erreur, hors-ligne (cache persisté + file d'arrosages), passage de stade.
- Accessibilité (VoiceOver/TalkBack), tailles de police dynamiques jusqu'à 130 % sans casse, contrastes.
- Performance : 60 fps sur Android milieu de gamme, démarrage < 2.5 s hors animation.

**CA** : check-list `docs/11` entièrement cochée ; aucune régression E2E.

> **Prompt** : « Phase 7. Applique la check-list de docs/11-qualite-accessibilite-tests.md à chaque écran en comparant avec design/screens/. Corrige tous les écarts, puis vérifie toutes les transitions de docs/03 et l'accessibilité. Fais-moi un rapport des écarts restants. »

---

## Phase 8 — Tests, build & publication
- Tests unitaires (règles métier, recherche, transitions), tests de composants clés, flows Maestro (`docs/05` parcours 1 à 8, reconnaissance photo bouchonnée en CI).
- Sentry (optionnel), EAS Build preview → TestFlight / test interne Play, icône d'app (mascotte Monstera sur fond #F3EEE3), écran de lancement, captures stores à partir des écrans, fiche store FR, politique de confidentialité, réponses aux questionnaires (données collectées : e-mail, nom, photos de plantes).
- v2 optionnelle : `daily-reminders` serveur + push Expo.

**CA** : builds installables sur les deux stores en test ; flows Maestro verts.

> **Prompt** : « Phase 8. Écris les tests manquants et les flows Maestro de docs/05, configure EAS pour preview et production, prépare l'icône et les métadonnées stores. Liste ce que je dois fournir (comptes, certificats, textes). »

---

## Jalons
| Jalon | Fin de phase | Démo |
|---|---|---|
| M1 « Ça ressemble à Zeve » | 1 | Planche des dessins + composants animés |
| M2 « Je me connecte » | 2 | OAuth réel + onboarding |
| M3 « J'arrose » | 3 | Jardin + fiche avec données |
| M4 « J'ajoute une plante » | 4 | Ajout par photo et par liste |
| M5 « Ma plante me répond » | 5 | Chat IA |
| M6 « Prêt pour les testeurs » | 8 | TestFlight / Play interne |

## À fournir par toi
Bundle id / package, compte Apple Developer, projet Google Cloud (identifiants OAuth iOS/Android/Web), projet Supabase, clé API Anthropic, pages web Conditions & Confidentialité.
