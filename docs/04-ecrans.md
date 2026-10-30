# 04 — Écrans

Chaque section : capture(s) de référence (`design/screens/`), route expo-router, layout de haut en bas avec mesures, textes exacts, états, interactions, transitions. Fond = `bg` #F3EEE3 sauf mention. Mesures pour 390×844 ; les hauteurs de haut/bas suivent les safe areas.

---

## 1. Lancement — `01-lancement.png`
**Route** `app/index.tsx` (splash animé, décide de la suite).
- Fond `forest` plein écran. Bloc centré verticalement, gap 18 :
  - Illustration 120×130 : tige (path `M60 124 C60 100 58 76 60 40`, trait 5 #8DB46A arrondi), feuille gauche (`M60 84 C40 84 26 72 22 52 C42 52 58 64 60 84 Z` #6E9F4E), feuille droite (`M60 66 C80 65 94 52 97 32 C77 32 62 45 60 66 Z` #8DB46A), bourgeon cercle (60,30) r 8 #E8B931.
  - « Zeve » splash 56 #F3EEE3. « Tes plantes te parlent. » Figtree 16 #C9D6C0.
- Séquence animée : voir 03 §6. Pendant ce temps : chargement polices, restauration de session Supabase, lecture d'une éventuelle notification d'ouverture.
- Sortie (fade, ≥ 2.6 s) : pas de session → Connexion ; session + `onboarded_at` null → Bienvenue rappels ; sinon → Jardin (ou la fiche ciblée par une notification).

## 2. Connexion — `02-connexion.png`, `02b-connexion-email.png`
**Route** `app/(auth)/login.tsx`. Padding 0 22 34.
- **Zone illustration** (flex 1, centrée, padding-top 40, gap 22) :
  - Bloc 300×190 : disque `butter` 220×190 (r 110) centré derrière ; **trio de mascottes** alignées en bas : Pilea (Jeune, 80 px), Monstera (Adulte, 120 px), Cactus oursin (Adulte, 80 px), visage simple souriant, sway + bob décalés.
  - « Zeve » hero 48 forest (rise d1). Slogan bodyL 17 `inkMuted`, centré, max 280 : « Tes plantes te disent quand elles ont soif. Toi, tu n'as plus qu'à arroser. » (rise d2).
- **Zone actions** (gap 10) :
  - Bouton Google : h 56, r 28, fond blanc, bordure 1.5 #CFC6B2, texte 600 16 ink, logo officiel à gauche du texte (gap 12). « Continuer avec Google » (rise d2).
  - Bouton Apple : h 56, r 28, fond #141414, texte blanc 600 16, logo officiel. « Continuer avec Apple » (rise d3). Sur Android : afficher quand même (OAuth web Apple) ou masquer si non configuré — décision produit : **afficher**.
  - « Continuer avec un e-mail » : bouton texte h 48, souligné, 600 15 forest (rise d4). Au tap → remplacé par un formulaire (rise) :
    - Libellé « Ton adresse e-mail » (600 13 muted), rangée gap 8 : champ pilule h 52 (placeholder « nom@exemple.fr », clavier e-mail, autocomplete email) + bouton rond 52 `forest` avec flèche (a11y « Recevoir un lien de connexion »).
    - Aide « On t'envoie un lien magique, pas de mot de passe. » (13 muted).
    - Envoi → toast « Lien envoyé ! Ouvre-le sur ce téléphone. » ; à l'ouverture du lien (deep link) → Connexion en cours.
  - Mentions (12 muted, centré, interligne 1.45) : « En continuant, tu acceptes les [Conditions d'utilisation] et la [Politique de confidentialité]. » — liens soulignés vers les pages web **[À FOURNIR]**.
- **Erreurs** : annulation → toast « Connexion annulée » ; e-mail invalide → bordure #A23B1F + texte « Cette adresse ne semble pas valide. » sous le champ ; erreur réseau → toast « Pas de connexion internet. Réessaie dans un instant. ».

## 3. Autorisation OAuth (système) — `03-oauth-autorisation-google.png`, `03b-…-apple.png`
**Non implémenté par l'app** : c'est l'alerte native d'`ASWebAuthenticationSession` (iOS) / Custom Tab (Android). La maquette documente ce que voit l'utilisateur : voile rgba(15,30,20,.45), carte centrée r 22 « « Zeve » souhaite utiliser « google.com » pour se connecter » / « L'app et le site pourront partager des informations te concernant. » + Annuler / Continuer. Pour Apple sur iOS, c'est la feuille native Sign in with Apple.
**À faire côté app** : le nom affiché vient du `CFBundleDisplayName` = « Zeve ». Gérer le retour « annulé » (toast).

## 4. Choix du compte (fournisseur) — `04-oauth-choix-compte-google.png`, `04b-…-apple.png`
**Non implémenté par l'app** (page web Google / feuille Apple). Ce que la maquette fixe :
- Les permissions demandées sont **uniquement** : nom, photo de profil, adresse e-mail (scopes Google `openid email profile` ; Apple `name email`).
- Apple : l'utilisateur peut **masquer son e-mail** → l'app doit accepter une adresse relais `…@privaterelay.appleid.com` et l'afficher telle quelle dans Réglages.
- Le prénom (`given_name`, ou nom complet Apple au 1er login uniquement) alimente « Bonjour Camille ». Sans prénom : « Bonjour » seul et « Bienvenue ! ».

## 5. Connexion en cours — `05-connexion-en-cours.png`
**Route** `app/(auth)/connecting.tsx`. Centré, gap 26.
- Disque 200 : cercle `sage` r 90 + anneau r 96 trait 4 `forest` en pointillé `120 484` qui tourne (spin 1.1 s).
- Mascotte Monstera Adulte 120 px, visage simple, bob + sway.
- Texte (role status) : « Connexion via Google… » (subTitle 24 forest ; « Apple… », « e-mail… ») et « On prépare ton jardin. » (15 muted).
- Durée = échange de session + chargement du profil, **minimum 1.8 s**. Erreur → retour Connexion (back) + toast « La connexion a échoué. Réessaie. ».

## 6. Bienvenue · rappels — `06-bienvenue-rappels.png`
**Route** `app/(onboarding)/reminders.tsx`. Padding 70 22 34 (haut = insets.top + 16).
- Zone centrale (flex 1, centrée, gap 10) :
  - **Carte notification** 300 px (entrée « notif » délai .5 s) : `surface`, r 20, padding 12/14, ombre notifCard ; icône d'app 40 r 12 `forest` avec pousse #8DB46A ; « Gaston » 700 14 ; « J'ai un peu soif… ça fait 9 jours. » 14 #3A453C. (Exemple fixe, illustratif.)
  - Mascotte Monstera Adulte **200 px**, visage complet (clignement, joues), bob + sway.
  - « Bienvenue, Camille ! » onboarding 30 (rise d1) ; « Tes plantes t'enverront un petit mot quand elles auront soif. Rien de plus, promis. » 16 muted max 300 (rise d2).
- Bas (rise d3, gap 8) : « Activer les rappels » (primary forest) → demande de permission notifications (système) → enregistre `reminders_enabled` et `onboarded_at` → toast « Rappels activés » → Jardin (up). « Plus tard » (texte 600 15) → `reminders_enabled=false`, `onboarded_at` → Jardin (up). Refus système → continuer quand même, `reminders_enabled=false`.
- C'est la **seule** étape d'onboarding (pas d'indicateur d'étapes).

## 7. Mon jardin — `07-jardin.png`, `07b-jardin-tout-arrose.png`, `07c-jardin-toast.png`
**Route** `app/(app)/(tabs)/index.tsx`. Scroll vertical, padding 60 22 120, gap 20. Barre de nav visible.
- **En-tête** (rangée, espace entre) :
  - Colonne gap 4 : « Bonjour Camille » 600 15 muted ; « Mon jardin » title 32 forest ; « 6 plantes · 2 ont soif aujourd'hui » 15 muted (`thirstLine` : « 1 a soif aujourd'hui », « tout le monde est hydraté »).
  - **Bouton +** rond 48 `sun` avec ombre, icône + 22 trait 2.4 forest, a11y « Ajouter une plante » → Nouvelle plante (up). C'est **le seul point d'entrée** de l'ajout.
- **Carte « À arroser aujourd'hui »** (rise d1) — affichée si au moins une plante a soif ou a été arrosée aujourd'hui après avoir eu soif : fond `butter` (couleur réglable), r 24, padding 18, gap 12. Titre : goutte 18 + « À arroser aujourd'hui » 700 15 forest. Une `TodoRow` par plante concernée (triées par jours sans eau décroissants). Tap « J'ai arrosé » → arrosage (voir 06) → badge « ✓ Arrosé » + toast « {Nom} te dit merci ! ».
- « Toutes mes plantes » 700 15 forest (marge haute 4).
- **Grille 2 colonnes** (gap 12) de `PlantCard` (rise d1, d2, d3, d4…), ordre : plantes assoiffées d'abord, puis par date d'ajout. Contenu d'une carte :
  - Puits 104 px `well` r 16 : `PlantAvatar` 86 px (espèce, stade, soif ; visage simple ; sway) ; si soif → plante inclinée −9°, couleurs ternies, bouche triste.
  - Badge de stade en haut à gauche : « Pousse » / « Jeune » / « Adulte ».
  - Nom (600 16), nom courant de l'espèce (12 italique muted), statut : pastille 8 (#D99A12 « A soif » / #4F8350) + texte 13 muted (« Eau dans 3 j », « Eau demain », « Arrosée · eau dans 8 j »).
  - Tap → Fiche (zoom).
- **Toast** (07c) en haut.
- **Vide (non maquetté)** : aucune plante → à la place de la grille, carte `surface` r 24 padding 24 centrée : trio de mascottes (Pousse) 70 px, « Ton jardin est vide » (700 17 forest), « Ajoute ta première plante : une photo suffit. » (14 muted), bouton primary « Ajouter ma première plante » → Nouvelle plante (up). Pas de carte « À arroser ».
- **Chargement (non maquetté)** : squelettes des cartes (puits `well`, lignes `track`) avec pulsation d'opacité .6↔1 1.2 s.
- Tirer pour rafraîchir (couleur du spinner `forest`).

## 8. Fiche plante — `08-fiche-plante-assoiffee.png`, `08b-…-arrosee.png`, `08c-…-pousse.png`, `08d-…-jeune.png`
**Route** `app/(app)/plant/[id].tsx`. Scroll vertical. Pas de barre de nav.
- **En-tête** (padding 54 18 0, rangée espace entre) : bouton rond 44 `surface` retour (a11y « Retour au jardin ») ; au centre nom (plantName 22 forest) et « {latin} · {pièce} » (13 italique muted) ; bouton rond 44 « Plus d'options » (3 points) → menu (non maquetté, feuille du bas : Renommer, Changer de pièce, Modifier le rythme d'arrosage, Historique d'arrosage, Supprimer la plante — mêmes styles que Réglages).
- **Scène** (h 290) :
  - Halo : disque 250 centré, haut à 30 ; `butter` si soif, `sage` sinon (transition 600 ms).
  - Bulle de la mascotte : en haut à gauche (14, 22), max 170, `surface`, r 18/18/18/4, padding 10/12, 14 interligne 1.35, ombre bubble, pop à chaque changement. Textes : voir `moodBubble` (« J'ai un peu soif… (9 j sans eau) », « Merci ! Prochain arrosage dans 8 j. », « Tout va bien, prochain arrosage dans 3 j. »).
  - Mascotte **230 px** (repère 100×110), visage complet : yeux 2.7×3.2 qui clignent, joues .55 (0 si soif), ombre de bord du pot, bouche ; bob + sway ; inclinaison −9° si soif ; gouttes après arrosage. a11y : « {Nom} a soif » / « {Nom} est en forme ».
- **Contenu** (padding 18 18 30, gap 14) :
  1. Trois `InfoTile` (rise d1) : **EAU** jauge (18 % « Sèche » si soif, sinon niveau réel « Bientôt »/« Parfait ») ; **LUMIÈRE** icône soleil #C48A0E + libellé de l'espèce (« Vive, indirecte ») ; **AIR** icône air #4F8350 + « Humide ».
  2. **Bouton arroser** (rise d2) : h 58 r 29, `sun`, goutte + « J'ai arrosé » 700 17 forest. Après tap : fond `sage`, « Arrosé aujourd'hui · annuler » (pop). Re-tap = annule l'arrosage du jour.
  3. **Croissance** (rise d3) : carte `surface` r 18 padding 14/16 : overline « CROISSANCE » + à droite « avec toi depuis 1 an et 2 mois » (13 muted) ; `GrowthSteps` (Pousse < 3 mois / Jeune < 1 an / Adulte 1 an et +).
  4. **Bon à savoir** (rise d3) : overline + conseil 14 (spécifique à la plante sinon conseil du type).
  5. **Carte chat** (rise d4) : fond `sage` r 18 padding 12/12/12/16 : « Une question sur {Nom} ? » 700 15 forest + « Décris ou prends une photo » 13 #3F5A45 ; rond 44 `forest` appareil photo. Tap → Chat (fwd).

## 9. Chat IA — `09-chat-ia.png`, `09b-chat-ia-reponse-en-cours.png`
**Route** `app/(app)/plant/[id]/chat.tsx`. Clavier : `KeyboardAvoidingView` (le champ remonte).
- **En-tête** (padding 54 18 14, bordure basse 1 `line`, gap 12) : retour 44 ; avatar rond 44 `sage` contenant la plante (sans visage, taille actuelle) ; « {Nom} » 700 16 forest + « Assistant plantes · connaît son historique » 13 muted.
- **Fil** (flex 1, ancré en bas, padding 18, gap 12) : « Aujourd'hui » 12 muted centré (séparateurs de date « Hier », « 12 oct. ») ; bulles (voir composant `ChatBubble`) ; photo envoyée = vignette 190×150 r 20/20/6/20 ; réponse de l'assistant avec action éventuelle « Me rappeler dans 3 jours » (crée un rappel + toast « Rappel prévu dans 3 jours ») ; indicateur de saisie (3 points) pendant la génération.
- **Suggestions** (défilement horizontal, padding 0 18 10, gap 8) : chips `butter` h 40 : « Faut-il rempoter ? », « Meilleur emplacement », « Engrais ? ». Tap = envoie la question.
- **Saisie** (padding 8 14 30, gap 8) : bouton 48 `sage` appareil photo (a11y « Prendre une photo » → caméra ou galerie) ; champ pilule h 48 « Pose ta question… » ; bouton 48 `forest` flèche (a11y « Envoyer »). Envoi au retour clavier.
- **Premier message** (aucun historique) : bulle assistant « Salut ! Je suis {Nom}. Pose-moi une question ou envoie-moi une photo. »
- **Erreur** (non maquettée) : bulle assistant `surface` avec texte « Je n'arrive pas à répondre pour l'instant. » + bouton secondaire « Réessayer ».

## 10. Réglages — `10-reglages.png`
**Route** `app/(app)/(tabs)/settings.tsx`. Padding 60 22 120, gap 20. Barre de nav visible (onglet Réglages actif).
- « Réglages » title 32.
- **Profil** (rise d1) : carte `surface` r 24 padding 16 gap 14 : avatar 56 `sage` initiale (Bricolage 22) ou photo du compte ; « Camille » 700 17 ; e-mail 14 muted (relais Apple si masqué) ; badge (h 24 r 12 `well`, coche 12) « Connecté avec Google / Apple / e-mail ».
- **Préférences** (rise d2) : carte r 24 lignes séparées par 1 `lineSoft` :
  - « Rappels d'arrosage » 600 15 + « Quand une plante a soif » 13 muted + `Toggle` (a11y switch). Activer sans permission système → redemande / ouvre les réglages du téléphone.
  - « Heure du rappel » → « 9 h 00 » (sélecteur d'heure natif).
  - « Mes pièces » → nombre (écran de gestion des pièces, non maquetté : liste avec ajout/renommage/suppression, même style de lignes). Dernière ligne de la carte (pas de séparateur).
- **Compte** (rise d3) : « Confidentialité » + chevron (page : export des données, suppression du compte — obligatoire stores) ; « Se déconnecter » 700 15 #A23B1F → confirmation native → Connexion (back).
- Pied (non maquetté, discret) : version de l'app 12 muted centrée.

## 11. Nouvelle plante — `11-nouvelle-plante-vide.png`, `11b-…-reconnaissance.png`, `11c-…-reconnue-photo.png`, `13-nouvelle-plante-espece-choisie.png`
**Route** `app/(app)/new-plant/index.tsx` (présentée en modale plein écran depuis le + du jardin). Formulaire scrollable (padding 20 18, gap 20) + pied fixe.
- En-tête (54 18 0, gap 12) : retour 44 (a11y « Retour au jardin ») → Jardin (back), brouillon abandonné + « Nouvelle plante » subTitle 24.
- **Espèce** :
  - *Aucune* : libellé « Quelle est son espèce ? » + grille 2 colonnes gap 10 de deux boutons h 140 r 22 :
    - « Prendre une photo » (fond `sagePale`, bordure pointillée 1.5 #A9B79A, appareil photo 30, sous-texte « Reconnaissance automatique » 12 #3F5A45) — rise d0.
    - « Choisir dans la liste » (fond `surface`, bordure 1.5 `inputBorder`, loupe 30, sous-texte « 52 espèces » 12 muted) — rise d1.
  - *Reconnaissance en cours* : bloc h 140 r 22 `sageDeep` : arc qui tourne + « Reconnaissance de l'espèce… » 600 15 (role status).
  - *Espèce connue* (pop) : libellé « Espèce reconnue sur ta photo » ou « Espèce choisie » ; carte `surface` r 20 padding 10 gap 12 : vignette 72×76 r 16 `well` avec la plante **Adulte** 66 px (visage simple, sway) ; nom 700 16, latin 13 italique, type 12 #3F5A45 ; bouton « Changer » (contour 1.5 #CFC6B2, h 44, pilule) → Liste des espèces (fwd).
  - Reconnaissance incertaine (confiance < 0.6, non maquetté) : même carte + bandeau 13 #8A5A00 « Pas sûr à 100 % — vérifie avec “Changer”. »
- **Son petit nom** : champ h 50, placeholder « Ex. : {nom de l'espèce} » ; vide à la validation → nom de l'espèce.
- **Pièce** : chips h 44 pour chaque pièce de l'utilisateur (Salon, Chambre, Cuisine, Salle de bain, Balcon) ; sélection unique (forest/texte crème) ; dernière chip « + Pièce » (non maquettée) pour en créer une.
- **Lumière à cet endroit** : 3 options h 64 : « Ombre / loin des fenêtres », « Lumineux / sans soleil direct », « Plein soleil / derrière la vitre ». Conseil sous les options (13 #8A5A00, rise) selon `LIGHT_TIPS[préférée>choisie]`.
- **Pied** (padding 10 18 34) : bouton primary pleine largeur « Ajouter au jardin » (h 56, icône + 20 à gauche) — désactivé tant qu'aucune espèce n'est choisie (fond #B9B4A6, texte #2E3530 « Choisis d’abord son espèce »), transition de fond 300 ms. Tap → création de la plante → Plante ajoutée (up). Pendant l'enregistrement : libellé remplacé par les 3 points animés.

## 12. Liste des espèces — `12-liste-especes.png`, `12b-…-recherche.png`, `12c-…-succulentes.png`, `12d-…-aucun-resultat.png`
**Route** `app/(app)/new-plant/species.tsx`.
- **En-tête** (padding 54 18 12, gap 14, bordure basse 1 `line`) :
  - Retour 44 + colonne : « Choisir une espèce » subTitle 24 ; compteur 13 muted : « 52 espèces · 19 types » (sans filtre) ou « 4 espèces » (filtré).
  - Recherche : champ pilule h 48, loupe à gauche, placeholder « Monstera, basilic, cactus… », insensible aux accents/majuscules, sur nom courant, nom latin et type. Pas de bouton valider (filtre en direct, debounce 120 ms).
  - Chips catégories (défilement horizontal, débordent jusqu'aux bords) : Toutes, Feuillage, Cactus & succulentes, Aromatiques, Fleuries, Arbres & palmiers, Retombantes.
- **Liste** (padding 8 12 30) triée alphabétiquement (locale fr) : `SpeciesRow` (vignette = dessin taille Jeune sans visage). Ligne de l'espèce déjà choisie : fond `sage` + pastille coche.
- Tap → retour à Nouvelle plante (back) avec l'espèce, source « list », haptique légère.
- **Aucun résultat** : centré, « Aucune espèce trouvée » 700 16 forest, « Essaie un autre nom, ou prends-la en photo. » 14 muted, bouton « Prendre une photo » (h 48) → retour + reconnaissance.

## 13. Plante ajoutée — `14-plante-ajoutee.png`
**Route** `app/(app)/new-plant/added.tsx`. Fond `forest`, contenu centré, gap 30, padding 0 28.
- Disque Ø 170 fond `bg`, bordure 6 `sun`, contenant la mascotte de la nouvelle plante **taille Pousse** (130 px, visage simple, sway), alignée en bas — entrée pop. Haptique Success.
- « {Nom} est chez elle ! » (Bricolage 28, #F3EEE3) ; « Elle commence petite : elle grandira dans l'app au fil des mois. » (15 #C9D6C0, max 290) — rise d1.
- Boutons (rise d2, gap 8, pleine largeur) : « Voir sa fiche » (h 56, `sun`, texte forest) → Fiche (zoom) + toast « {Nom} a rejoint ton jardin » ; « Ajouter une autre plante » (texte crème 600 15) → Nouvelle plante vide (up).
- Retour système (Android) → Jardin.

## 14. Planche des dessins — `15-planche-dessins.png`
Écran **de développement uniquement** (`app/dev/plants.tsx`, accessible en build dev via un appui long sur la version dans Réglages) : grille des 19 types × 3 tailles, pour vérifier les dessins. Pas dans l'app publiée.

---

## Règles « Non maquetté » (à appliquer partout)
- Réutiliser strictement les composants du design system ; aucun nouveau style.
- Messages d'erreur : toast (erreur passagère) ou bloc inline 13 #A23B1F sous le champ (validation).
- États de chargement : squelettes `well` / `track` ; boutons en chargement = texte remplacé par 3 points animés (typing), même taille.
- Confirmations destructives (supprimer une plante, se déconnecter) : alerte native.
- Feuilles d'options (menu « … ») : bottom sheet blanche r 26, lignes 56 px, séparateurs `lineSoft`, action destructive en #A23B1F.
- Tout nouvel écran garde : fond crème, en-tête avec retour 44 + titre 24, marges 18, CTA en pied h 56.
