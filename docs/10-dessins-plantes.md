# 10 — Dessins des plantes (19 types × 3 tailles)

Référence visuelle : `design/screens/15-planche-dessins.png`. Code : `reference/plants/`.

## Principe
- Chaque espèce du catalogue (52) appartient à **un type de dessin** (19). Les espèces d'un même type partagent la forme et ont leurs propres couleurs (`a`, `b`, `f`).
- Chaque dessin est une liste d'éléments SVG dans un repère **100 × 110**, base de la tige en **(50, 64)**, juste au-dessus du bord du pot (rect 23,62 54×10).
- Chaque élément porte `s` = taille minimale d'apparition : 1 Pousse, 2 Jeune, 3 Adulte. Le feuillage est en plus mis à l'échelle autour de (50,64) : 0.62 / 0.82 / 1.
- Le **pot** et le **visage** sont communs à toutes les plantes (dessinés par `PlantAvatar`).

## Les 19 types
| Type (`form`) | Libellé | Ressemblance | Espèces |
|---|---|---|---|
| monstera | Feuilles découpées | Grandes feuilles en cœur avec fentes claires | Monstera, Monstera à trous, Philodendron selloum |
| herb | Aromatiques | Tige centrale, paires de feuilles ovales | Basilic, Menthe, Persil, Coriandre, Origan |
| lavender | Lavande & romarin | Feuilles fines grises + épis de fleurs | Lavande, Romarin |
| pilea | Feuilles rondes | Feuilles « pièces » sur pétioles fins | Pilea, Peperomia |
| calathea | Calathéas & marantas | Larges feuilles ovales à rayures claires | Calathea orbifolia, Calathea paon, Maranta, Aglaonema |
| olive | Petits arbres | Tronc brun, petites feuilles fines, fruits | Olivier, Citronnier, Ficus benjamina |
| cactus | Cactus colonnaires | Colonne côtelée, bras, épines, fleur | Cactus oursin, Cierge du Pérou |
| echeveria | Rosettes succulentes | Rosette de feuilles charnues | Echeveria, Joubarbe, Graptopetalum |
| aloe | Aloès & agaves | Feuilles épaisses pointues, points clairs | Aloe vera, Haworthia, Agave |
| sansevieria | Sansevierias | Lames dressées à bandes et liseré | Langue de belle-mère, Sansevieria cylindrica |
| pothos | Lianes retombantes | Feuilles en cœur + lianes qui débordent du pot | Pothos, Philodendron grimpant, Lierre, Misère |
| fern | Fougères | Frondes arquées à folioles | Fougère de Boston, Capillaire |
| palm | Palmiers | Palmes longues à folioles fines | Kentia, Areca, Palmier nain |
| ficus | Ficus à grandes feuilles | Tige droite, grandes feuilles ovales nervurées, gaine rose | Caoutchouc, Figuier lyre, Schefflera, Avocatier |
| orchid | Orchidées | Feuilles basses larges + hampe florale | Orchidée papillon, Cymbidium |
| lily | Fleurs-spathes | Feuilles lancéolées + spathes et spadice | Fleur de lune, Anthurium |
| zz | Tiges charnues | Tiges arquées à folioles ovales brillantes | Plante ZZ, Arbre de jade |
| geranium | Fleurs de balcon | Feuilles rondes à zone sombre + bouquets | Géranium, Bégonia, Violette africaine |
| spider | Plantes araignées | Feuilles rubanées arquées à rayure, bébé plante | Plante araignée |

## Ce qui change par taille
- **Pousse** : forme minimale (2–5 éléments principaux), échelle 0.62.
- **Jeune** : + feuilles/frondes/arme ou première floraison selon le type, échelle 0.82.
- **Adulte** : forme complète (fleurs, bras du cactus, lianes jusqu'au sol, fruits, bébé de la plante araignée), échelle 1.

## Couleurs résolues (`drawPlant`)
`A`, `B`, `F` = couleurs de l'espèce ; `S` tige #3F6B45 ; `V` nervures #EAF0DE ; `D` détails #2F5A3A ; `T` tronc #7A5A3A ; hex littéral sinon. Plante assoiffée : `A`/`B` mélangées à 50 % avec #B5A85E, tige #6E7A4A, groupe feuillage incliné `rotate(-9 50 64)`, bouche triste.

## Implémentation React Native
- `drawPlant(speciesId, stage, thirsty)` → `{ shapes, scale, tilt, mouth }` (mis en cache).
- `PlantAvatar` : `<Svg viewBox="0 0 100 110">` → `G tilt` → `G scale` → `G animé (sway)` → `Path` pour chaque élément ; puis pot + visage. Les `transform` des éléments sont des chaînes SVG standards (supportées par react-native-svg).
- Si l'animation de `rotation/origin` sur `G` n'est pas fluide sur une plateforme, alternative : deux `Svg` superposés (feuillage dans une `Animated.View` avec `transformOrigin: '50% 56.4%'` + rotation, pot au-dessus) — rendu identique.
- Tailles utilisées : 50 (liste d'espèces, stade Jeune, sans visage, sans sway), 66 (carte espèce, Adulte), 80/120 (trio connexion), 86 (cartes jardin), 130 (plante ajoutée, Pousse), 120 (connexion en cours), 200 (onboarding), 230 (fiche), 36 (avatar chat, sans visage).
- `plantForms.generated.ts` est généré depuis le prototype : ne pas l'éditer à la main. Pour retoucher un dessin, modifier `buildForms()` dans `design/prototype-claude-design.dc.html` (même logique) et régénérer.

## Tests
- Pour chaque type : nombre d'éléments stade 1 < stade 2 ≤ stade 3.
- Chaque espèce de `species.ts` a un `form` existant ; ids identiques à la table `species` (seed SQL).
- Snapshot de la planche dev.
