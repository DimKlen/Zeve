# 06 — Fonctionnalités & règles métier

## F1. Authentification (OAuth au démarrage)
- Fournisseurs : **Google**, **Apple**, **e-mail par lien magique**. Pas de mot de passe.
- Supabase Auth :
  - Google : `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'zeve://auth/callback', skipBrowserRedirect: true, scopes: 'openid email profile' } })` puis `WebBrowser.openAuthSessionAsync(url, redirectTo)` → `exchangeCodeForSession(code)` (flux PKCE). Alternative native possible plus tard (`@react-native-google-signin/google-signin` + `signInWithIdToken`).
  - Apple : iOS → `expo-apple-authentication` (feuille native, scopes FULL_NAME + EMAIL) puis `signInWithIdToken({ provider: 'apple', token, nonce })`. Android → OAuth web Supabase (même flux que Google).
  - E-mail : `signInWithOtp({ email, options: { emailRedirectTo: 'zeve://auth/callback' } })`.
- Session persistée (AsyncStorage / SecureStore adapter), rafraîchissement automatique, `onAuthStateChange` alimente le store d'auth.
- Au premier login : trigger SQL crée `profiles`. Apple ne donne le nom qu'au 1er login → le renvoyer dans `profiles.first_name` côté app.
- Annulation → toast « Connexion annulée ». Écran « Connexion en cours » minimum 1.8 s.
- Déconnexion : `signOut()`, purge du cache Query et du store, annulation des notifications locales, retour Connexion.
- Suppression de compte (Confidentialité) : Edge Function `delete-account` (supprime données + storage + utilisateur). Obligatoire App Store.

## F2. Onboarding
- Une seule étape, « rappels », affichée tant que `profiles.onboarded_at` est null (une seule fois par compte).
- « Activer les rappels » : demande la permission notifications (`expo-notifications`), enregistre `reminders_enabled` et le jeton push, puis `onboarded_at`. « Plus tard » : `reminders_enabled=false` + `onboarded_at`, sans rien demander. Dans les deux cas → Jardin.

## F3. Jardin & état des plantes
Règles implémentées dans `reference/plants/plantStatus.ts` (tests unitaires obligatoires) :
- **Dernier arrosage** = max(`watering_events.watered_at`) ; si aucun, la date de création sert de référence.
- **Jours sans eau** = jours calendaires (fuseau de l'utilisateur) entre la référence et aujourd'hui.
- **Intervalle** `water_every_days` : copié de l'espèce à la création (ex. Monstera 8, Basilic 2, Cactus 14, Fougère 3), modifiable dans le menu « … » de la fiche.
- **A soif** si jours sans eau ≥ intervalle. Prochain arrosage : « aujourd'hui », « demain », « dans N j ».
- **Jauge** : 1 − jours/intervalle, bornée ; affichée 18 % et « Sèche » si soif ; « Bientôt » < 50 % ; « Parfait » sinon (92 % après un arrosage du jour).
- **Humeur** : soif → bouche triste, inclinaison −9°, feuilles ternies (50 % vers #B5A85E), tige #6E7A4A, halo `butter`, pas de joues ; sinon bouche souriante, halo `sage`, joues .55.
- **Carte « À arroser aujourd'hui »** : plantes assoiffées + plantes arrosées aujourd'hui qui étaient assoiffées (affichées ✓ « Arrosé ») ; masquée si vide.
- **Tri de la grille** : assoiffées d'abord (plus de jours sans eau en premier), puis date d'ajout croissante.
- Données temps réel non nécessaires ; invalidation TanStack Query après chaque mutation, refetch au retour au premier plan.

## F4. Arrosage
- « J'ai arrosé » (jardin ou fiche) → insert `watering_events` (optimiste : l'UI change immédiatement, rollback + toast d'erreur si échec).
- Retour : haptique légère, gouttes (fiche), pop, toast « {Nom} te dit merci ! ».
- **Annuler** : depuis la fiche, si un arrosage existe aujourd'hui, le bouton devient « Arrosé aujourd'hui · annuler » ; tap → supprime l'événement du jour le plus récent.
- Un seul arrosage compté par jour pour les calculs (plusieurs taps n'empilent pas : bouton = bascule).
- Les notifications locales sont replanifiées après chaque arrosage.

## F5. Croissance (3 tailles)
- Stade selon l'**ancienneté dans l'app** (`created_at`) : **Pousse** < 90 jours, **Jeune** < 365 jours, **Adulte** ≥ 365 jours.
- Rendu : facteur d'échelle 0.62 / 0.82 / 1 **et** éléments supplémentaires à chaque stade (feuilles, fleurs, bras, frondes) — voir `docs/10-dessins-plantes.md`.
- Une nouvelle plante commence **toujours** en Pousse (même si la vraie plante est grande : c'est la relation avec l'app qui grandit).
- Passage de stade (non maquetté, recommandé) : au premier affichage après le changement, toast « {Nom} a grandi ! Elle est maintenant Jeune. » + pop de la mascotte.
- Fiche : bloc « Croissance » + « avec toi depuis … » (`sinceText`).

## F6. Ajout d'une plante & espèces
- Point d'entrée **unique** : le bouton + du jardin (et le CTA de l'état vide), qui ouvre Nouvelle plante en modale.
- Espèce obligatoire, par **photo** (F7) ou **liste** (52 espèces, 19 types, 6 catégories — `reference/plants/species.ts`).
- Recherche : insensible aux accents/majuscules, sur nom, latin, libellé du type ; filtre catégorie combinable ; tri alphabétique fr ; état vide avec CTA photo.
- « Changer » rouvre la liste avec l'espèce courante sélectionnée.
- Nom : vide → nom de l'espèce. 1–24 caractères.
- « Ajouter au jardin » : insert `plants` (+ `species_source`, `water_every_days` de l'espèce, photo éventuelle déplacée de `tmp/` vers `{user_id}/{plant_id}/`) → écran Plante ajoutée → « Voir sa fiche » + toast « {Nom} a rejoint ton jardin ». En cas d'échec : toast d'erreur, on reste sur le formulaire (rien n'est perdu).

## F7. Reconnaissance d'espèce par photo (IA)
> Moteur : **Pl@ntNet** au lieu de Claude (décision du 30/10/2026, voir docs/07). Le comportement de l'app est inchangé.
- `expo-image-picker` (caméra par défaut, galerie possible), compression JPEG ≤ 1280 px, qualité 0.7.
- Upload dans `plant-photos/{uid}/tmp/{uuid}.jpg` puis Edge Function `identify-species` : envoie l'image à Claude (vision) avec **la liste fermée des 52 ids d'espèces** et demande un JSON `{ speciesId, confidence, alternatives: [id, id] }`. Si aucune ne correspond : `speciesId: null` → afficher la liste avec message « On n'a pas reconnu cette plante. Choisis-la dans la liste. »
- UI : état « Reconnaissance de l'espèce… » (spinner) ; succès → carte « Espèce reconnue sur ta photo » ; confiance < 0.6 → bandeau de vérification.
- Timeout 20 s → toast + bascule liste.

## F8. Chat IA par plante
> Moteur : **Gemini** (offre gratuite) au lieu de Claude (décision du 30/10/2026, voir docs/07). Le comportement de l'app est inchangé.
- Un fil par plante (`chat_messages`). Edge Function `plant-chat` : reçoit `{ plantId, text?, photoPath? }`, charge le contexte (espèce, nom, exposition idéale et emplacement conseillé de l'espèce, intervalle, derniers arrosages, stade, 20 derniers messages), appelle Claude (vision si photo), stocke les deux messages, renvoie la réponse (streaming optionnel en phase polish).
- Personnalité : la plante répond **à la première personne**, en français, tutoiement, réponses courtes (2 à 4 phrases par défaut, développées seulement sur demande), conseils concrets, **périmètre strict** (plantes, arbres, jardinage, botanique, entretien, maladies, nuisibles, rempotage, arrosage, placement ; toute question hors sujet est refusée poliment en une phrase avec retour vers les plantes, et le cadrage résiste aux « oublie tes instructions » et jeux de rôle), aucune promesse médicale/vétérinaire ; signale la toxicité si pertinent ; propose au besoin une **action** structurée `{"type":"remind","days":3,"label":"Me rappeler dans 3 jours"}` rendue en bouton.
- Suggestions fixes : « Faut-il rempoter ? », « Meilleur emplacement », « Engrais ? ».
- Photo dans le chat : même pipeline d'upload ; la bulle montre la vignette réelle.
- Limites : 30 messages / jour / utilisateur (compteur côté fonction) → message « On se repose un peu, reviens demain ! ».
- Action « Me rappeler dans N jours » → `reminders` + notification locale planifiée + toast « Rappel prévu dans 3 jours ».

## F9. Notifications
- **v1 locales** (`expo-notifications`), recalculées à chaque ouverture et mutation :
  - Rappel quotidien à `reminder_time` (défaut 9 h 00) **uniquement si** au moins une plante a/aura soif ce jour-là. Titre = nom de la plante la plus assoiffée ; corps à la 1re personne : « J'ai un peu soif… ça fait 9 jours. » ; si plusieurs : titre « Zeve », corps « Gaston et 1 autre plante ont soif. ».
  - Rappels ponctuels du chat.
  - Tap → Fiche de la plante (ou Jardin si plusieurs).
- **v2 serveur** (phase optionnelle) : cron Supabase (pg_cron) + Edge Function `daily-reminders` + Expo Push, pour fiabiliser quand l'app n'est pas ouverte.
- Réglages : interrupteur + heure. Désactiver = annuler toutes les notifications planifiées.

## F10. Réglages
Profil (prénom, e-mail affiché, fournisseur), rappels (interrupteur, heure), confidentialité (politique, export JSON des données, suppression du compte), déconnexion. Version de l'app.

## F11. Toasts (catalogue)
| Déclencheur | Texte |
|---|---|
| Arrosage | {Nom} te dit merci ! |
| Rappels activés | Rappels activés |
| Annulation OAuth | Connexion annulée |
| Lien magique envoyé | Lien envoyé ! Ouvre-le sur ce téléphone. |
| Rappel créé | Rappel prévu dans 3 jours |
| Plante créée | {Nom} a rejoint ton jardin |
| Passage de stade | {Nom} a grandi ! Elle est maintenant {Jeune/Adulte}. |
| Hors-ligne | Pas de connexion internet. Réessaie dans un instant. |

## F12. Hors-ligne
- Lecture : cache TanStack Query persisté (AsyncStorage) → le jardin s'affiche hors-ligne.
- Arrosage hors-ligne : mis en file (mutation persistée) et rejoué au retour du réseau.
- Ajout de plante, chat, reconnaissance : nécessitent le réseau (toast hors-ligne).

## F13. Données de démo
Script `supabase/seed.dev.sql` (ou bouton dev) qui crée les 6 plantes de Camille avec des `created_at` et arrosages produisant exactement les captures : Gaston (430 j, dernier arrosage il y a 9 j, intervalle 8), Basilic (35 j, il y a 3 j, intervalle 2), Pépite (160 j, 3 j restants), Frida (290 j, demain), Olivia (820 j, dans 5 j), Piquant (60 j, dans 12 j).

## F14. Plusieurs jardins (ajout hors design)
- Un **jardin** est un lieu (ville, pays, coordonnées facultatives) qui regroupe des **plantes**.
- **Jamais de jardin vide** : un jardin naît avec sa première plante (RPC `create_garden_with_plant`) et la base le
  supprime quand sa dernière plante active est supprimée ou déplacée (déclencheur `plants_drop_empty_garden`).
  L'app prévient avant (« … est la dernière plante de … »).
- **Nom par défaut** : « <Ville> <n> », premier numéro libre pour la ville (« Montréal 1 », « Montréal 2 ») ;
  sans ville « Jardin <n> ». Modifiable à la création et dans le menu « … » du jardin.
- **Lieu** : « Utiliser ma position » (permission demandée à ce moment, refus géré) ou saisie ville + pays.
- **Accueil** : un seul jardin → l'écran du jardin directement (comme avant) ; plusieurs → « Mes jardins » :
  arrosages du jour de tous les jardins puis une carte par jardin, qui ouvre l'écran du jardin.
- **Saisons** : suivent l'hémisphère du jardin (latitude, sinon pays) ; le chat reçoit le lieu et la saison.
- **Noms de plantes** : un nom suggéré est pré-rempli (univers japonais, grec, égyptien, nordique, celte, étoiles),
  « Autre nom » en tire un autre, jamais un nom déjà porté dans le jardin ; le champ reste libre.

## F15. Rythme d'arrosage appris et météo du jardin (ajout hors design)
- **Apprentissage** : chaque arrosage garde l'intervalle attendu (`watering_events.expected_days`). Les
  intervalles réels, ramenés aux conditions météo normales, donnent le rythme observé (moyenne qui privilégie
  les plus récents ; absences > 2× l'attendu et arrosages du même jour ignorés). Module pur partagé app/chat :
  `supabase/functions/_shared/wateringModel.ts` (réexporté par `src/plants/wateringModel.ts`).
- **Proposer, jamais imposer** : après 3 intervalles exploitables, si le rythme est stable et diffère d'au
  moins 1 jour, la fiche affiche « Son vrai rythme » [Adopter] [Plus tard]. Après « Plus tard », rien avant
  3 nouveaux arrosages.
- **Météo** : Edge Function `garden-weather` (Open-Meteo, gratuit, sans clé), cache `garden_weather` par jardin
  et par jour (30 j passés + 7 j de prévisions), rafraîchi au plus toutes les 6 h. Chaque jour « sèche » la
  terre selon l'évapotranspiration du lieu rapportée à sa normale ; la date d'arrosage est avancée ou retardée
  d'au plus 2 jours, avec la raison sous la jauge (« Plus tôt : il fait chaud à Montréal »).
- **Intérieur** : toutes les plantes sont suivies comme des plantes d'intérieur, la météo n'en pèse qu'un quart.
- **Une seule source de vérité** : `dueInfo` sert la jauge, la carte « À arroser », les rappels et le chat.
  `plant_overview.is_thirsty` reste le calcul brut (rythme fixe) et n'est pas lu par l'app.
- Local, CI et E2E : `WEATHER_MOCK=1` (météo neutre, aucun effet).

## F16. Mode « Découvrir » (ajout hors design)
- **Où** : troisième onglet de la barre flottante (Jardin · Découvrir · Réglages). Photographier une plante
  (appareil photo) ou « Choisir une photo » (galerie) ; rien n'est ajouté au jardin (l'ajout reste réservé au +).
- **Reconnaissance** : Edge Function `discover-plant` → Pl@ntNet (3 meilleurs candidats : nom commun FR, latin,
  famille, confiance). Sous 50 % de confiance : « Pas sûr à 100 % » et les autres possibilités en puces.
- **Fiche découverte** : Gemini en JSON structuré (schéma imposé, validé par `normalizeFacts`) : comestibilité
  (Comestible / En partie / Toxique / Non comestible / Inconnu, toujours avec « Ne mange jamais une plante
  identifiée seulement par une app »), origine, usages humains, faune, anecdotes. Au moindre doute : « Inconnu ».
  Cache partagé `plant_facts` par espèce (quota Gemini) ; lien vers le guide d'entretien si l'espèce est au catalogue.
- **Quota** : 20 découvertes par jour et par utilisateur (table `discoveries`).
- **Confidentialité** : la photo envoyée est supprimée après l'identification ; l'historique (10 dernières
  découvertes) reste sur l'appareil.
- Local, CI et E2E : `DISCOVER_MOCK=1` (un pissenlit, fiche fixe).

## F17. Météo du jardin visible et conseils du jour (ajout hors design)
- `garden-weather` enregistre aussi la météo du moment (`gardens.weather_now` : température, humidité) et la
  minimale du jour (`garden_weather.temp_min`, gel annoncé).
- **Affichage** : puce « 8 °C · 71 % » à côté du lieu dans l'en-tête d'un jardin ; sur la fiche, carte Saison :
  « Aujourd'hui à Paris : 8 °C, 71 % d'humidité ». Rien sans lieu.
- **Conseils** : `src/plants/weatherAdvice.ts` compare la météo du lieu (maintenant + minimales des 3 prochains
  jours) aux besoins de l'espèce (`climateOf`) : rentrer avant le gel (plante qui sort l'été, hors hiver),
  éloigner des vitres quand il fait froid dehors (≤ 10 °C ou proche du minimum de l'espèce, rustiques exceptées),
  protéger de la chaleur, air sec du chauffage (espèces qui aiment l'humidité), succulente par temps très humide.
  Au plus 2 ; chacun remplace le conseil de saison du même sujet (« Emplacement · Météo du jour »).
- Le chat reçoit la météo du moment.

