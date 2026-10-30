# 01 — Vision & ambiance

## Le produit en une phrase
**Zeve** transforme chaque plante d'intérieur en une petite mascotte vivante dans son pot : elle te dit quand elle a soif, grandit avec toi et répond à tes questions.

## Pour qui
- Particuliers avec 3 à 30 plantes, débutants ou intermédiaires, qui oublient d'arroser ou ne savent pas quoi faire quand une feuille jaunit.
- Usage : quelques secondes par jour (« qui a soif ? » → « J'ai arrosé »), plus des moments plus longs (ajouter une plante en photo, poser une question).
- Générique : n'importe qui peut gérer ses propres plantes (multi-utilisateur, chaque compte isolé).

## Promesse & piliers
1. **Vivant** : les plantes ont un visage, une humeur (contente / assoiffée), se balancent doucement, clignent des yeux, et grandissent (Pousse → Jeune → Adulte) au fil des mois passés dans l'app. Esprit Tamagotchi, sans culpabilisation.
2. **Simple** : une action principale par écran. Le geste quotidien tient en un tap.
3. **Sans friction** : ajouter une plante = une photo (l'espèce est reconnue) ou un choix dans une liste de 52 espèces, en moins d'une minute.
4. **Bienveillant et utile** : l'assistant IA connaît l'historique de la plante (dernier arrosage, espèce, pièce, lumière) et répond en langage simple.

## Ambiance visuelle
- **Lumineuse, douce, naturelle** : fond crème (#F3EEE3), cartes ivoire (#FBF8F1), verts forêt profonds (#1F3D2B), touches de jaune soleil (#E8B931) et de beurre (#F6E3A6), sauge pâle (#DCE8CF).
- **Chaleureuse et un peu ludique** : titres en Bricolage Grotesque (grotesque expressive, légèrement « fait main »), texte en Figtree (lisible, rond). Formes très arrondies (cartes 22–24 px, boutons en pilule).
- **Illustrée** : pas de photos de stock. Les plantes sont des illustrations vectorielles plates, avec un pot jaune moutarde et un visage minimaliste (deux yeux ronds, une bouche en arc, joues rosées quand tout va bien).
- **Calme** : beaucoup d'air, contrastes francs mais pas criards, aucun dégradé, ombres rares et douces (bouton +, barre de nav, toast).
- **Deux tonalités d'écran** : clair (crème) pour le quotidien ; sombre (forêt #1F3D2B) pour les moments forts (lancement, « Plante ajoutée »), avec des touches de jaune soleil.

## Ton & voix (français)
- **Tutoiement**, phrases courtes, chaleureuses, jamais infantilisantes.
- Les plantes parlent à la première personne : « J'ai un peu soif… », « Merci ! Prochain arrosage dans 8 jours. », « Salut ! Je suis Gaston. »
- L'app parle simplement : « Quelle est son espèce ? », « Elle commence petite : elle grandira dans l'app au fil des mois. », « On t'envoie un lien magique, pas de mot de passe. »
- Pas de jargon technique. Noms latins en italique, en complément du nom courant.
- Pas de pression : « Plus tard » est toujours possible ; les rappels sont « un petit mot quand elles auront soif. Rien de plus, promis. »

## Principes d'interaction
- **Un geste = un retour** : chaque action a une réponse visible (pop, gouttes d'eau, toast, changement d'humeur de la mascotte) et haptique légère.
- **Transitions spatiales cohérentes** : avancer = glisse depuis la droite ; revenir = depuis la gauche ; ouvrir quelque chose de « modal » = monte du bas ; ouvrir une plante = zoom doux ; changer d'onglet = fondu.
- **Annulable** : « J'ai arrosé » se défait d'un tap (« Arrosé aujourd'hui · annuler »).
- **Accessible** par défaut : vrais boutons, libellés pour lecteurs d'écran, contrastes AA, animations coupées si l'utilisateur réduit les mouvements.

## Ce que Zeve n'est pas (v1)
- Pas de capteurs d'humidité connectés, pas de réseau social, pas de boutique.
- Pas de mode sombre en v1 (l'ambiance crème est l'identité ; les écrans sombres existent déjà ponctuellement).
- Pas de tablette optimisée en v1 (portrait téléphone, largeur de référence 390 px, s'adapte de 360 à 430).

## Persona de démo (données du prototype)
Camille, 6 plantes : **Gaston** (Monstera, Salon, adulte, a soif — 9 j sans eau), **Basilic** (Cuisine, pousse, a soif — 3 j), **Pépite** (Pilea, Chambre, jeune), **Frida** (Calathea orbifolia, Salle de bain, jeune), **Olivia** (Olivier, Balcon, adulte), **Piquant** (Cactus oursin, Bureau, pousse). À reproduire dans le seed de développement.
