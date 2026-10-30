# 02 — Design system

Toutes les valeurs sont dans `reference/theme.ts` (à copier en `src/theme/index.ts`). Écran de référence : **390 × 844** (iPhone 14/15). Les mesures sont en points (dp).

## 1. Couleurs

### Fonds et surfaces
| Token | Hex | Usage |
|---|---|---|
| `bg` | #F3EEE3 | Fond de toutes les vues claires. Aussi texte sur fond sombre. |
| `surface` | #FBF8F1 | Cartes, tuiles d'info, champs, boutons ronds clairs (retour, options). |
| `well` | #EDE5D4 | « Puits » où se tiennent les plantes dans les cartes et listes ; badges neutres. |
| `surfaceAlt` | #F7F4ED | En-tête de la feuille OAuth, encadré « Zeve pourra voir ». |
| `white` | #FFFFFF | Bouton Google, feuille du fournisseur OAuth, bouton « Partager / Masquer » non sélectionné. |

### Marque
| Token | Hex | Usage |
|---|---|---|
| `forest` | #1F3D2B | Couleur de marque. Titres, boutons primaires, barre de navigation, fonds sombres (lancement, « Plante ajoutée »), bulles de chat de l'utilisateur. |
| `forest2` | #2F5A3A | Interrupteur actif, coches, pastille de sélection. |
| `sun` | #E8B931 | Accent jaune : bouton +, CTA « J'ai arrosé » (fiche), onglet actif, « Voir sa fiche », cercle autour de la plante ajoutée, bord du pot. |
| `butter` | #F6E3A6 | Carte « À arroser aujourd'hui » (personnalisable : #F6E3A6 / #DCE8CF / #EADFC8), halo de la mascotte qui a soif, chips de suggestion du chat, option de lumière sélectionnée. |
| `sage` | #DCE8CF | Halo de la mascotte en forme, carte « Une question sur… », avatars, étapes de croissance passées, ligne d'espèce sélectionnée, bouton « Arrosé aujourd'hui · annuler ». |
| `sageDeep` / `sagePale` | #CFE0C3 / #E9EFDF | Placeholders photo, reconnaissance en cours / bouton « Prendre une photo ». |
| `potBody` / `potShadow` | #D6A132 / #B88424 | Corps du pot, ombre du bord. |

### Texte
| Token | Hex | Contraste sur #F3EEE3 | Usage |
|---|---|---|---|
| `ink` | #1C2A21 | ≈ 13:1 | Texte courant. |
| `forest` | #1F3D2B | ≈ 10:1 | Titres, liens, libellés de boutons secondaires. |
| `inkMuted` | #55604F | ≈ 5.6:1 | Sous-titres, légendes, overlines, noms latins. |
| `inkSoft` | #3A453C | ≈ 9:1 | Texte tertiaire (badges, domaine OAuth). |
| `forestText` | #3F5A45 | — | Texte secondaire sur fond sauge. |
| `warnText` | #8A5A00 | ≈ 5:1 | Conseil de lumière. |
| `danger` | #A23B1F | ≈ 5.8:1 | « Se déconnecter ». |
| `darkMuted` | #C9D6C0 | sur #1F3D2B ≈ 8:1 | Texte secondaire sur écrans sombres. |

### Bordures et lignes
`line` #E2D9C6 (séparateurs d'en-tête, étapes) · `lineSoft` #ECE4D3 (lignes de réglages) · `inputBorder` #D8CFBB (champs, chips) · `strongBorder` #CFC6B2 (bouton Google, « Changer ») · `track` #E6DDCB (piste de jauge).

### Sémantique
`water` #3E77A8 (jauge, gouttes) · `thirstyDot` #D99A12 · `okDot` #4F8350 · `blush` #E98B6B (joues, opacité .55) · `overlay` rgba(15,30,20,.45) · toast fond #1C2A21 texte #F3EEE3 icône #E8B931 · désactivé fond #B9B4A6 texte #2E3530 · Apple #141414 (anneau #5A5A5A).

### Couleurs des plantes
Chaque espèce a 3 couleurs (`a` feuille principale, `b` secondaire, `f` fleur/fruit) dans `reference/plants/species.ts`. Constantes du dessin : tige #3F6B45 (assoiffée #6E7A4A), nervure #EAF0DE, détail foncé #2F5A3A, tronc #7A5A3A. Plante assoiffée : `a` et `b` mélangées à 50 % avec #B5A85E.

## 2. Typographie
Paquets : `@expo-google-fonts/bricolage-grotesque` (500, 700) et `@expo-google-fonts/figtree` (400, 500, 600, 700). Écran de lancement natif maintenu jusqu'au chargement des polices.

| Style | Police | Taille / interligne | Espacement | Où |
|---|---|---|---|---|
| splash | Bricolage 700 | 56 | −0.03em | « Zeve » sur le lancement |
| hero | Bricolage 700 | 48 | −0.03em | « Zeve » sur Connexion |
| title | Bricolage 700 | 32 | −0.02em | Mon jardin, Réglages |
| onboarding | Bricolage 700 | 30 | −0.02em | Bienvenue, Camille ! |
| added | Bricolage 700 | 28 | 0 | « Lianne est chez elle ! » |
| subTitle | Bricolage 700 | 24 | 0 | Nouvelle plante, Choisir une espèce, Connexion via Google… |
| plantName | Bricolage 700 | 22 | 0 | Nom dans l'en-tête de la fiche |
| bodyL | Figtree 400 | 17 / 1.4 | | Slogan de connexion |
| body | Figtree 400 | 16 / 1.45 | | Textes d'onboarding, champs |
| bodyS | Figtree 400 | 15 / 1.4 | | Sous-titres, bulles de chat, lignes de réglages (600) |
| small | Figtree 400 | 14 / 1.45 | | Bulle mascotte, « Bon à savoir », permissions |
| caption | Figtree 400 | 13 | | Pièce · jours sans eau, noms latins (italique), libellés de champs (600) |
| micro | Figtree 400 | 12 | | Mentions légales, aide sous CTA, indices |
| overline | Figtree 600 | 12, MAJUSCULES | +0.06em | EAU, LUMIÈRE, AIR, CROISSANCE, BON À SAVOIR |
| button | Figtree 700 | 16 | | CTA pleine largeur |
| cardTitle | Figtree 600 | 16 | | Noms de plantes dans les cartes |
| sectionTitle | Figtree 700 | 15 | | « À arroser aujourd'hui », « Toutes mes plantes » |

Noms latins : *italique*. Badges de stade : Figtree 700, 11.

## 3. Espacements & mise en page
- Marges latérales : **22** (écrans à onglets, connexion, onboarding) ; **18** (fiche, chat, création, liste) ; **12** pour la liste d'espèces (lignes de 10 de padding interne).
- Haut d'écran : contenu à **60** du haut (onglets) / **54** (détails) sur iPhone avec encoche → implémente `insets.top + 6` / `insets.top`.
- Bas : CTA à **30–34** du bas (`insets.bottom + 0..8`). Le contenu des onglets a 120 de marge basse pour passer sous la barre de nav.
- Écarts verticaux usuels : 20 (sections du jardin, champs de création), 14 (blocs de la fiche), 12 (cartes de la grille, éléments de la carte « À arroser »), 10 (boutons empilés), 8 (chips, libellé → champ).
- Grille du jardin : 2 colonnes, gouttière 12. Tuiles d'info de la fiche : 3 colonnes, gouttière 10. Choix de lumière : 3 colonnes, gouttière 8.

## 4. Rayons
pilule = hauteur/2 pour tous les boutons et chips · 14 (étapes, vignette de liste) · 16 (champs, choix de lumière, puits de vignette) · 18 (tuiles d'info, cartes « Bon à savoir », « Une question », lignes d'espèces) · 20 (carte espèce choisie, bulles de chat avec coin de 6 du côté de l'auteur, notification) · 22 (cartes plantes, boutons photo/liste, alerte OAuth) · 24 (carte « À arroser », sections réglages, toast) · 26 (haut de la feuille OAuth) · 32 (barre de nav). Bulle de la mascotte : 18/18/18/4.

## 5. Ombres (rares)
- Bouton + : 0 6 16 rgba(196,138,14,.30)
- Barre de nav : 0 10 30 rgba(31,61,43,.25)
- Toast : 0 10 30 rgba(0,0,0,.20)
- Carte de notification (onboarding) : 0 10 30 rgba(31,61,43,.12)
- Bulle de la mascotte : 0 2 0 rgba(31,61,43,.06)
- Bouton d'interrupteur : 0 1 3 rgba(0,0,0,.2)

## 6. Iconographie
- Tracés au trait, viewBox 24, `stroke-width` 2 (2.2–2.6 pour les petites tailles), extrémités et jonctions arrondies. Fichier : `reference/icons.tsx`.
- Tailles : 20 dans les boutons ronds de 44, 22 dans la nav et les tuiles, 18 dans les listes, 14–16 dans les badges.
- Liste : plus, retour, chevron, plus d'options (3 points pleins), goutte, soleil, air, appareil photo, envoyer, pousse (onglet Jardin), réglages, loupe, coche, cadenas, personne, e-mail, arc de chargement.
- Logos Google/Apple : **remplacer** les monogrammes « G »/« A » du prototype par les boutons officiels conformes aux guidelines (Google Sign-In branding, Sign in with Apple HIG), en gardant hauteur 56, rayon 28, ordre et couleurs (Google blanc + contour #CFC6B2, Apple #141414).

## 7. Composants (à construire en Phase 1)
| Composant | Spécification |
|---|---|
| `Button` primary | h 56, r 28, fond `forest`, texte `bg` Figtree 700 16, icône 20 à gauche avec gap 10 (ex. + dans « Ajouter au jardin »). Variante `sun` (fond #E8B931, texte forest) pour « Voir sa fiche », « J'ai arrosé » (h 58, texte 17). Variante désactivée (#B9B4A6 / #2E3530). Animation press scale .96. |
| `Button` secondary | Contour 1.5 `forest` transparent (« Me rappeler dans 3 jours », h 44). |
| `TextButton` | h 44–48, transparent, Figtree 600 15, `forest` (souligné pour « Continuer avec un e-mail »). |
| `IconButton` | rond 44 `surface` (retour, options) ; rond 48 pour + (`sun` + ombre) et pour photo/envoyer du chat (`sage` / `forest`). |
| `ProviderButton` | Google / Apple, h 56, r 28 (voir §6). |
| `Card` | `surface`, r 22, padding 12/14/14. |
| `PlantCard` | Carte du jardin : puits `well` h 104 r 16 contenant `PlantAvatar` 86 px ; badge de stade en haut à gauche (h 22, r 11, fond rgba(251,248,241,.85), Figtree 700 11 #3A453C) ; nom (600 16), nom courant (12 italique muted), statut avec pastille 8 px. |
| `TodoRow` | Fond rgba(251,248,241,.7), r 16, padding 10/10/10/14 ; nom 600 16 + « Pièce · 9 j sans eau » 13 muted ; bouton « J'ai arrosé » (h 44, r 22, forest, texte 600 14) ou badge « ✓ Arrosé » (#2F5A3A, pop). |
| `InfoTile` | `surface`, r 18, padding 12, gap 8 : overline, contenu (jauge ou icône 22), valeur 600 14. |
| `WaterGauge` | Piste h 8 r 4 `track`, remplissage `water`, largeur animée 800 ms. |
| `GrowthSteps` | 3 cases (gouttière 8) r 14, padding 10/8 : icône pousse 16/20/24, libellé 700 13, indice 11. Actuelle : fond `forest` texte `bg` ; passée : fond `sage` ; future : fond `bg` + bordure `line`. |
| `Chip` | h 38 r 19 bordure 1.5 ; sélectionnée `forest`/texte `bg`, sinon `surface`/bordure `inputBorder`. Variante pièce h 44 r 22. Variante suggestion h 40 r 20 fond `butter` sans bordure. |
| `LightOption` | h 64 r 16 bordure 1.5 ; sélectionnée fond `butter` bordure `sunDeep` ; libellé 600 13 + indice 500 12 muted. |
| `TextField` | h 50 (52 e-mail, 48 recherche/chat) r 16 (pilule pour e-mail, recherche, chat) bordure 1.5 `inputBorder` fond `surface` padding 0 16, Figtree 16 (15). Libellé au-dessus 600 13 muted, gap 8. Recherche : icône loupe à 16 px du bord, padding gauche 44. |
| `Toggle` | 56×34 r 17 padding 3, fond `forest2` (actif) / `strongBorder`, bouton blanc 28 + ombre, transition 250 ms. `accessibilityRole="switch"`. |
| `Toast` | En haut (top `insets.top`), marges 22, min h 48, r 24, padding 12/16, fond `ink`, texte 600 14 `bg`, icône coche jaune 18. Entrée 400 ms, visible 2.6 s. Un seul à la fois. |
| `SystemAlert` (maquette) | Pour documentation : en réalité l'alerte OAuth est native (voir 06). |
| `BottomSheet` | Fond blanc, r 26 en haut, voile `overlay` (fondu 300 ms), monte 500 ms. |
| `TabBar` | Pilule flottante centrée 240×64, r 32, `forest`, padding 6, 2 onglets égaux (h 52 r 26) icône 20 + libellé 700 14 : Jardin, Réglages. Actif : fond `sun`, texte/icône `forest` ; inactif : transparent, `bg`. Ombre nav. Bas à 24 du bord (`insets.bottom + 8` min 24). L'ajout de plante passe par le + du jardin. |
| `ChatBubble` | Moi : `forest` texte `bg`, r 20/20/6/20, max 260. Assistant : `surface`, r 20/20/20/6, max 300, padding 14, texte pre-line, action optionnelle (Button secondary h 44). Photo : 190×150 `sageDeep` bordure pointillée #8DAA80. Indicateur de saisie : 3 points 8 px. |
| `AddedBadge` | Disque Ø 170 fond `bg`, bordure 6 `sun`, plante taille Pousse 130 px alignée en bas (écran « Plante ajoutée »), entrée pop. |
| `PlantAvatar` | Voir `docs/10-dessins-plantes.md`. |
| `SpeciesRow` | h ≥ 72, padding 6/10, r 18 ; vignette 54×58 r 14 `well` avec plante 50 px (taille Jeune, sans visage) ; nom 700 15, latin 13 italique, type 12 `forestText` ; sélectionnée fond `sage` + pastille coche 28 `forest`. |
| `ScreenHeader` | Bouton retour 44 + titre (subTitle) gap 12 ; variante centrée (fiche) : retour / nom + latin·pièce / options. |
