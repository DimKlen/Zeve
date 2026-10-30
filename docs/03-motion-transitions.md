# 03 — Mouvement & transitions

Le mouvement fait partie de l'identité : les plantes sont **vivantes**, les écrans se déplacent de façon **spatiale et cohérente**. Valeurs exactes du prototype, implémentées dans `reference/motion.ts` (Reanimated 3+).

## 1. Courbes
| Nom | Valeur | Usage |
|---|---|---|
| `screen` | cubic-bezier(.22, .8, .24, 1) | Transitions d'écran, rise, zoom |
| `sheet` | cubic-bezier(.22, .9, .24, 1) | Feuilles, alertes, toasts, notification |
| `overshoot` | cubic-bezier(.3, 1.5, .5, 1) | Feuilles qui poussent au lancement |
| `inOut` | ease-in-out | Boucles (sway, bob), fondus |
| `in` | ease-in | Chute des gouttes |

## 2. Transitions d'écran
Principe : **seul l'écran entrant s'anime** (l'écran sortant est remplacé). Implémentation recommandée : `Stack` d'expo-router avec `animation: 'none'`, et chaque écran enveloppé dans `<Screen enter="fwd|back|up|fade|zoom">` qui applique le `Keyframe` correspondant sur son conteneur racine (`entering`). Le type d'entrée est passé en paramètre de navigation ou déduit de la paire (origine → destination) via une table centralisée `src/motion/transitions.ts`. Le geste de retour iOS et le bouton retour Android rejouent `back`.

| Nom | Animation | Durée |
|---|---|---|
| **fwd** | translateX +60 → 0, opacité 0 → 1 | 440 ms, `screen` |
| **back** | translateX −60 → 0, opacité 0 → 1 | 440 ms, `screen` |
| **up** | translateY +90 → 0, opacité 0 → 1 | 500 ms, `screen` |
| **fade** | opacité 0 → 1 | 500 ms, ease |
| **zoom** | scale .92 → 1, opacité 0 → 1 | 500 ms, `screen` |

### Table complète (origine → destination : animation)
| Origine | Action | Destination | Anim |
|---|---|---|---|
| Lancement | auto après 2.6 s, pas de session | Connexion | fade |
| Lancement | session valide | Jardin | fade |
| Connexion | compte choisi / lien magique ouvert | Connexion en cours | fade |
| Connexion en cours | succès, 1er login | Bienvenue · rappels | fwd |
| Connexion en cours | succès, déjà onboardé | Jardin | fade |
| Bienvenue · rappels | Activer les rappels / Plus tard | Jardin | up |
| Jardin | tap carte plante | Fiche plante | **zoom** |
| Fiche plante | retour | Jardin | back |
| Fiche plante | « Une question sur… » | Chat | fwd |
| Chat | retour | Fiche plante | back |
| Jardin ↔ Réglages | onglet | — | fade |
| Jardin | bouton + | Nouvelle plante | up |
| Nouvelle plante | retour | Jardin | back |
| Nouvelle plante | « Choisir dans la liste » / « Changer » | Liste des espèces | fwd |
| Liste des espèces | choisir une espèce / retour | Nouvelle plante | back |
| Nouvelle plante | « Ajouter au jardin » | Plante ajoutée | up |
| Plante ajoutée | « Voir sa fiche » | Fiche plante | zoom |
| Plante ajoutée | « Ajouter une autre plante » | Nouvelle plante (vide) | up |
| Réglages | Se déconnecter | Connexion | back |
| Notification | tap | Fiche plante concernée | zoom |

La barre de navigation **ne s'anime pas** entre Jardin et Réglages (elle reste fixe ; seul le contenu fait un fondu). Elle est masquée sur tous les autres écrans.

## 3. Apparition des éléments (« rise »)
`translateY 26 → 0` + opacité, **550 ms** `screen`, avec retard en cascade : d1 80 ms, d2 160, d3 240, d4 320, d5 600, d6 1000.

| Écran | Éléments en rise (délai) |
|---|---|
| Connexion | Titre « Zeve » d1, slogan d2, bouton Google d2, bouton Apple d3, « Continuer avec un e-mail » d4, mentions d4 ; formulaire e-mail : rise sans délai à l'ouverture |
| Feuille OAuth (compte) | En-tête d0, liste comptes d1, choix e-mail Apple d2, permissions d2, note d3 |
| Bienvenue · rappels | Titre d1, texte d2, boutons d3 |
| Jardin | Carte « À arroser » d1 ; cartes plantes d1, d2, d3, d4, d4, d4… |
| Fiche plante | Tuiles d'info d1, bouton arroser d2, croissance d3, bon à savoir d3, carte chat d4 |
| Réglages | Profil d1, préférences d2, compte d3 |
| Nouvelle plante | Bouton photo d0, bouton liste d1 ; carte espèce : pop |
| Plante ajoutée | Disque : pop ; texte d1 ; boutons d2 |
| Chat | Chaque nouvelle bulle : rise d0 |

## 4. Micro-interactions
| Nom | Détail | Où |
|---|---|---|
| **press** | scale .96 au toucher, 150 ms | Tous les boutons et cartes tappables |
| **pop** | scale .9 → 1.05 (60 %) → 1, 500 ms ease-out | Badge « ✓ Arrosé », bouton arroser après tap, bulle de la mascotte au changement, carte d'espèce choisie, disque de « Plante ajoutée » |
| **gouttes** | 3 gouttes bleues : translateY −16 → +30 (repère plante), opacité 0 → 1 (30 %) → 0, 1.1 s ease-in, délais 0 / 250 / 400 ms ; disparition auto 1.4 s | Fiche plante après « J'ai arrosé » |
| **changement d'humeur** | halo (#F6E3A6 ↔ #DCE8CF), couleur des feuilles, inclinaison (−9° ↔ 0°), joues (0 ↔ .55), bouche : transition 600 ms | Fiche plante |
| **jauge** | largeur 18 % ↔ 92 %, 800 ms `screen` | Tuile Eau |
| **fond de bouton** | 300 ms (jaune → sauge après arrosage ; gris → vert quand l'espèce est choisie) | Bouton arroser, « Ajouter au jardin » |
| **interrupteur** | fond + position du bouton, 250 ms | Rappels d'arrosage |
| **onglet** | fond et couleur de l'onglet, 250 ms | Barre de nav |
| **chips / pièces / lumière** | fond et couleur, 200 ms | Création, liste d'espèces |
| **haptique** | `Haptics.impactAsync(Light)` sur « J'ai arrosé », sélection d'espèce, onglets ; `notificationAsync(Success)` quand une plante est ajoutée ; `Warning` sur erreur | — |

## 5. Boucles (« la plante est vivante »)
| Nom | Détail | Où |
|---|---|---|
| **sway** | feuillage seul (pas le pot) : rotation −2.5° ↔ +2.5°, 4.5 s ease-in-out infini, origine (50, 62) du repère 100×110 | Toutes les mascottes (sauf vignettes de la liste d'espèces et planche) |
| **bob** | mascotte entière : translateY 0 ↔ −6, 3.2 s ease-in-out ; trio de connexion décalé de −1.1 s et −2.2 s | Connexion (trio), Connexion en cours, Bienvenue, Fiche plante |
| **blink** | yeux : scaleY 1 → .1 → 1 entre 93 % et 100 % d'un cycle de 5 s | Fiche plante, Bienvenue |
| **spin** | rotation 360°, 1.1 s linéaire | Anneau « Connexion via… » (arc pointillé 120 / 484), icône de reconnaissance d'espèce |
| **typing** | 3 points 8 px #55604F : opacité .25 → 1 → .25 et translateY 0 → −3 → 0 à 30 %, 1.2 s, décalés de .2 s | Chat |

## 6. Séquences
### Lancement (fond forest)
1. Tige (trait 5 #8DB46A) se dessine de bas en haut : 1 s ease-out, délai 0.2 s.
2. Feuille gauche (#6E9F4E) pousse depuis sa base : scale 0 → 1, 0.55 s `overshoot`, délai 0.8 s.
3. Feuille droite (#8DB46A) : idem, délai 1 s.
4. Bourgeon jaune (cercle r 8) : scale 0 → 1, délai 1 s.
5. « Zeve » (56 px, #F3EEE3) : rise délai 0.6 s. Slogan « Tes plantes te parlent. » (16, #C9D6C0) : rise délai 1 s.
6. Passage à l'écran suivant à 2.6 s (fade). Le splash natif (expo-splash-screen) a le même fond #1F3D2B pour un enchaînement invisible.

### Connexion OAuth
Tap fournisseur → alerte système (native) → feuille du fournisseur (native) → retour app → **Connexion en cours** (fade) : anneau qui tourne + mascotte qui flotte ; durée réelle de l'échange de jeton, **minimum 1.8 s** → écran suivant.

### Ajout d'une plante
+ du jardin → Nouvelle plante (up) → photo (spinner « Reconnaissance de l'espèce… » puis carte espèce en pop) ou liste (fwd / back) → « Ajouter au jardin » devient actif (fond 300 ms) → **Plante ajoutée** (up) : disque crème bordé de jaune avec la mascotte taille Pousse (pop, sway), titre (rise d1), boutons (rise d2), haptique Success → « Voir sa fiche » (zoom) + toast « {Nom} a rejoint ton jardin ».

### Arrosage depuis la fiche
Tap « J'ai arrosé » → haptique → gouttes → humeur passe à « en forme » (600 ms) → bulle « Merci ! Prochain arrosage dans 8 j. » (pop) → bouton devient sauge « Arrosé aujourd'hui · annuler » (pop) → toast « Gaston te dit merci ! ».

### Arrosage depuis le jardin
Tap « J'ai arrosé » sur la ligne → remplacé par « ✓ Arrosé » (pop) → la carte de la plante dans la grille se redresse et change de couleur → sous-titre mis à jour → toast. La carte « À arroser » reste affichée avec les ✓ jusqu'au lendemain.

## 7. Mouvement réduit
Si `useReducedMotion()` : durées → 0, pas de boucles (sway, bob, blink, typing remplacé par « … » statique), gouttes masquées, transitions d'écran instantanées. Le spinner reste mais sans rotation (affiche « Chargement… »).

## 8. Performance
- Animations sur le thread UI (Reanimated worklets), jamais `setState` par frame.
- Liste d'espèces (52 lignes) : vignettes **sans** sway ni visage animé ; `FlatList` virtualisée.
- Grille du jardin : sway actif mais `PlantAvatar` mémoïsé et dessins mis en cache (`drawPlant`).
- Cible : 60 fps sur un Android milieu de gamme ; si chute, désactiver le sway hors écran (`useIsFocused`).
