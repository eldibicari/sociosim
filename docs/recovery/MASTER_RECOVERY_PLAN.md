# Master Recovery Plan

## But

Suivre la reprise du projet bloc par bloc, sans se disperser et sans lancer plusieurs gros chantiers en meme temps.

## Methode de travail

- un seul bloc principal a la fois
- une seule sous-etape active a la fois
- checkpoint git quand une sous-etape devient stable
- relecture des docs `recovery/` au debut de chaque reprise

## Ordre global retenu

### 1. Bloc entretien
Statut :
- en grande partie fini

Contenu :
- chat central
- suggestions initiales
- sidebar
- analyse / feedback
- analyse complete
- export PDF d'analyse
- streaming progressif
- robustesse minimale du chat

Etat :
- assez fini pour la demo
- reste surtout du polish futur

### 2. Bloc personnas
Statut :
- bloc terminé
- grille séparée du prompt (page /grille dédiée)
- grille visible pendant l'entretien (bouton sidebar)
- analyse enrichie avec les vrais thèmes de la grille
- prêt pour le bloc accueil

Contenu :
- page liste `personnas`
- cartes personna
- fiche persona
- historique par persona
- creation / edition
- lien avec grille d'entretien et prompt
- preparation des personnas exemples pour la future home
- evolution avancee a cadrer dans `PERSONA_ADVANCED_ARCHITECTURE_PLAN.md`

### 3. Bloc accueil
Statut :
- terminé

Contenu :
- hero avec gradient + badge + CTAs auth-aware
- 3 cartes personas vitrine (Jade/Oriane/Théo) avec greetings, mini-échanges, animations CSS
- section 3 étapes pédagogiques
- section ancrage théorique (Bourdieu/Crozier&Friedberg/Latour)
- CTA final adapté à l'état de connexion
- /api/home/featured pour charger les IDs réels depuis la DB
- fallback propre si agents non trouvés en DB

### 4. Bloc guide
Statut :
- terminé

Contenu :
- hero section avec icône, titre, sous-titre, CTA
- blockquotes → style callout avec bordure violette (prompts d'entretien)
- hiérarchie h2/h3 améliorée
- lien "Guide" ajouté dans le header pour les utilisateurs connectés
- CTA "Choisir un persona" en bas de page

### 5. Bloc profil / utilisateurs
Statut :
- secondaire

Contenu :
- pages deja fonctionnelles
- polish seulement si necessaire pour la demo

### 6. Polish final demo
Statut :
- fin de parcours

Contenu :
- coherence visuelle
- verifications finales
- derniers bugs visibles
- commits propres

## Regle de reprise

A chaque nouvelle session :
1. relire ce document
2. relire le doc du bloc courant
3. choisir une seule sous-etape
4. avancer jusqu'a un point stable

## Bloc courant retenu

- bloc `polish final demo`

## Sous-etape recommandee pour la prochaine reprise

- vérification de la cohérence visuelle entre toutes les pages
- audit des derniers bugs visibles (routing, états vides, messages d'erreur)
- commits propres, vérification des branches
