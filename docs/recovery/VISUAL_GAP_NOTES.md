# Visual Gap Notes

## But du document
Ce document garde une trace textuelle des captures de l’ancien état local du projet.

Il sert à :
- mémoriser le niveau visuel déjà atteint
- éviter d’oublier des éléments UI importants
- comparer plus vite l’état actuel au rendu souhaité

## Source
- captures envoyées dans la conversation de reprise
- état visuel local affiché sur les captures datées du **6 mars 2026**

Important :
- les images ne sont pas encore archivées dans le repo
- quand elles seront disponibles sur disque, les ranger dans `docs/recovery/screenshots/`

## Signature visuelle générale observée
Le produit avait déjà une identité visuelle assez nette :
- fond clair ivoire avec texture quadrillée douce
- bleu marine comme couleur principale
- accent corail / saumon
- logo et mot-symbole `Mimesis`
- cartes arrondies, assez aérées
- footer institutionnel Université Gustave Eiffel
- ambiance plus éditoriale qu’une simple app admin

## Accueil
Les captures montrent une page d’accueil déjà assez avancée visuellement avec :
- un hero `Bienvenue sur Mimesis`
- un badge au-dessus du titre
- deux CTA principaux
- un bloc `Sociologue du jour`
- une section sombre `Méthode Mimesis`
- une section claire `Trois repères pour conduire un entretien rigoureux`

Éléments à retenir :
- l’accueil servait déjà à expliquer la promesse pédagogique
- il y avait une vraie narration visuelle
- la logique en 3 temps était déjà visible

## Login
La page login montre :
- une carte centrale assez premium
- un fond texturé léger
- un badge en tête de carte
- une hiérarchie propre
- des liens secondaires bien placés

Éléments à retenir :
- la page n’était pas une simple page formulaire brute
- l’identité `Mimesis` était déjà visible dès la connexion

## Personnas
La page personnas montre :
- un titre de section `Espace personnas`
- une zone de recherche
- des filtres en pills
- des cartes par persona
- badges d’état et actions visibles
- un bouton `Créer une nouvelle personna`

Éléments à retenir :
- la page était déjà structurée pour un usage réel
- elle mélangeait recherche, statut, historique et actions de gestion

## Création de personna
La page `/personnas/new` montre une structure en trois zones :
- colonne gauche : nom, description, aide
- centre : éditeur du prompt
- colonne droite : validation du prompt

Éléments à retenir :
- le flux de création était déjà riche
- la validation Cauldron était pensée comme partie visible du workflow

## Liste des entretiens
La page `/interviews` montre :
- un titre `Tous les entretiens`
- des filtres
- une liste de cartes
- un résumé d’entretien dans chaque carte
- un bouton `Continuer`
- un bouton flottant ou accentué pour démarrer

Éléments à retenir :
- l’écran n’était pas seulement un historique brut
- il y avait déjà une logique de reprise d’entretien

## Écran d’entretien
Les captures montrent deux états utiles.

### État 1 : zone principale prête au démarrage
- message `Prêt pour l'entretien ?`
- suggestions de premières questions
- champ de saisie en bas
- header avec persona et statut en ligne

### État 2 : sidebar ouverte
- bouton `Commencer un nouvel entretien`
- infos persona
- statistiques
- historique
- liste d’anciens chats

Éléments à retenir :
- la sidebar faisait partie de l’expérience
- l’historique et les stats étaient visibles sans quitter le chat
- la structure visuelle du chat est un repère fort à conserver

## Guide d’entretien
La page guide montre :
- une page de lecture pleine largeur utile
- gros titres
- contenu textuel dense
- structure de phases

Éléments à retenir :
- le contenu existait déjà
- l’amélioration future concerne surtout la forme, la lisibilité et la hiérarchie

## Profil
La capture profil montre :
- une page simple de mise à jour du profil
- un menu utilisateur ouvert
- email et rôle admin visibles
- réglages de texte et thème dans le menu

Éléments à retenir :
- le menu utilisateur et les préférences faisaient déjà partie du produit

## Utilisateurs
La page `/manage-users` montre :
- une invitation utilisateur
- un tableau des comptes
- statut admin visible
- actions de gestion
- cohérence forte avec le header global

Éléments à retenir :
- l’espace admin existait déjà dans un état fonctionnel

## Ce que ces captures suggèrent comme écarts possibles à surveiller
- perte partielle du niveau de finition de l’accueil
- perte partielle de la cohérence visuelle entre pages
- risque de simplification excessive du chat si on ne garde pas la sidebar et ses détails
- risque d’oublier des éléments secondaires importants : menu profil, historique, badges, aides, validation visible

## Usage recommandé
Quand on reprend une page, se poser ces trois questions :
1. quelle structure existait déjà dans l’ancien état visuel ?
2. qu’est-ce qui est indispensable à récupérer pour la démo ?
3. qu’est-ce qui peut attendre après la remise en route complète du produit ?

## Dossier visuel à compléter plus tard
Quand on aura les fichiers image en local, créer idéalement :
- `docs/recovery/screenshots/home-hero.png`
- `docs/recovery/screenshots/home-method.png`
- `docs/recovery/screenshots/login.png`
- `docs/recovery/screenshots/personnas.png`
- `docs/recovery/screenshots/personna-new.png`
- `docs/recovery/screenshots/interviews.png`
- `docs/recovery/screenshots/interview-ready.png`
- `docs/recovery/screenshots/interview-sidebar.png`
- `docs/recovery/screenshots/guide.png`
- `docs/recovery/screenshots/profile.png`
- `docs/recovery/screenshots/manage-users.png`
