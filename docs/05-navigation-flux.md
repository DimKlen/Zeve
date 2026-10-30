# 05 — Navigation & parcours

## Arborescence expo-router
```
app/
  _layout.tsx                 # Providers (Query, Auth, Theme, Toast, Fonts), Stack racine animation:'none'
  index.tsx                   # Lancement animé + aiguillage
  (auth)/
    _layout.tsx               # Redirige vers (app) si session
    login.tsx                 # Connexion (Google, Apple, e-mail)
    connecting.tsx            # Connexion en cours
  auth/callback.tsx           # Deep link zeve://auth/callback (OAuth + lien magique)
  (onboarding)/
    reminders.tsx             # Bienvenue · rappels (unique étape)
  (app)/
    _layout.tsx               # Garde : session obligatoire, onboarding fait
    (tabs)/
      _layout.tsx             # TabBar flottante personnalisée (Jardin, Réglages)
      garden.tsx              # Mon jardin (route /garden : « / » est déjà pris par le Lancement)
      settings.tsx            # Réglages
    plant/[id]/index.tsx      # Fiche plante
    plant/[id]/chat.tsx       # Chat IA
    new-plant/index.tsx       # Nouvelle plante (presentation: 'fullScreenModal')
    new-plant/species.tsx     # Liste des espèces
    new-plant/added.tsx       # Plante ajoutée
    settings/rooms.tsx        # Mes pièces (non maquetté)
    settings/privacy.tsx      # Confidentialité (non maquetté)
  dev/plants.tsx              # Planche des dessins (dev uniquement)
```
L'état de création (espèce, source, nom, pièce, lumière, photo) vit dans un store Zustand `useNewPlantDraft` partagé par `new-plant/*`, réinitialisé à chaque ouverture depuis le + du jardin et après « Ajouter une autre plante ».

## Carte des écrans
```mermaid
flowchart TD
  L[Lancement] -->|pas de session| C[Connexion]
  L -->|session, onboarding à faire| R[Bienvenue · rappels]
  L -->|session| J[Mon jardin]
  C -->|Google / Apple| SYS[[Alerte + compte\n(système)]] --> CC[Connexion en cours]
  C -->|e-mail → lien magique| CC
  SYS -->|Annuler| C
  CC -->|1er login| R --> J
  CC -->|déjà onboardé| J
  J <-->|onglets| S[Réglages]
  J -->|carte plante| F[Fiche plante]
  F --> CH[Chat IA]
  J -->|bouton +| N[Nouvelle plante]
  N --> LS[Liste des espèces] --> N
  N -->|Ajouter au jardin| OK[Plante ajoutée]
  OK -->|Voir sa fiche| F
  OK -->|Ajouter une autre| N
  S -->|Se déconnecter| C
  NOTIF((Notification)) --> F
```

## Parcours clés (pour tests E2E Maestro)
1. **Premier lancement Google** : Lancement → Connexion → Google → (système) → Connexion en cours → Bienvenue rappels → Activer → Jardin vide.
2. **Lien magique** : Connexion → e-mail → envoi → toast → ouverture du lien → Connexion en cours → Bienvenue → Jardin.
3. **Arrosage quotidien** : Jardin → « J'ai arrosé » sur Gaston → badge ✓ + toast → carte Gaston redressée → sous-titre « 1 a soif aujourd'hui ».
4. **Arrosage depuis la fiche + annulation** : Jardin → Gaston (zoom) → J'ai arrosé (gouttes, humeur) → « annuler » → retour état assoiffé.
5. **Ajout par photo** : + → Nouvelle plante → Prendre une photo → reconnue → nom → pièce → lumière → Ajouter au jardin → Plante ajoutée → Voir sa fiche (stade Pousse).
6. **Ajout par liste** : + → Choisir dans la liste → recherche « fic » → Figuier lyre → Nouvelle plante (Espèce choisie) → Changer → Cactus & succulentes → Echeveria → Ajouter au jardin.
7. **Chat** : Fiche → Une question → suggestion « Engrais ? » → points → réponse.
8. **Déconnexion** : Réglages → Se déconnecter → confirmer → Connexion.

## Liens profonds
- Schéma : `zeve://`.
- OAuth / lien magique : `zeve://auth/callback`.
- Notifications : payload `{ plantId }` → Fiche (zoom) ; si plusieurs plantes → Jardin.
