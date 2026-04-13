# Bloc Entretien

## But

Finir proprement le bloc entretien avant de passer aux autres pages UI.

Le bloc entretien comprend :
- le chat central
- les suggestions initiales
- le feedback V1
- la sidebar
- la robustesse minimale du parcours

## Ce qui est deja en place

- nouvel entretien fonctionnel
- reponse du persona fonctionnelle
- suggestions initiales revenues
- suggestions masquees quand l'utilisateur ecrit
- suggestions masquees pendant la reponse du persona
- feedback V1 affiche dans l'ecran d'entretien
- sidebar deja presente avec historique, stats, exports et aide

## Ce que les captures anciennes montrent

L'ecran entretien etait deja pense comme un vrai espace de conduite d'entretien :
- zone centrale tres aeree
- etat initial fort
- suggestions visibles des le depart
- champ de saisie bien pose en bas
- sidebar utile et riche
- historique directement accessible
- stats et informations persona visibles

## Direction retenue

Inspiration generale :
- chat central simple
- sidebar riche
- historique conversationnel clair
- sensation de continuite et de reprise

Important :
- ne pas cloner visuellement Character.AI
- reprendre surtout la logique d'usage
- garder l'identite Mimesis

## Definition du bloc entretien termine

Le bloc entretien sera considere comme assez fini pour la demo quand on aura :

1. un etat initial propre
2. des suggestions propres
3. un chat stable
4. une sidebar utile et lisible
5. un feedback V1 bien integre
6. une gestion decente des erreurs de session
7. un rendu visuel proche des captures sur cette page

## Sous-bloc sidebar

### Ce qu'elle sait deja faire

- ouvrir / reduire
- commencer un nouvel entretien
- ouvrir l'aide
- exporter
- afficher les infos persona
- afficher les stats
- afficher l'historique
- mettre en avant l'entretien courant

### Ce qui manque

- largeur plus utile
- hierarchie plus pro
- titres de chats plus humains
- actions rapides sur les chats
- suppression
- renommage
- epinglage

## Ordre de travail retenu

### Etape 1

Sidebar front-only :
- largeur plus utile
- meilleure hierarchie visuelle
- historique plus lisible

Pas encore :
- rename
- pin
- delete
- backend supplementaire

### Etape 2

Titres automatiques de chat :
- derives du premier message utilisateur
- meilleure lecture de l'historique

### Etape 3

Actions sur les chats :
- menu d'actions
- suppression simple
- renommage
- epinglage

Cette etape pourra demander du backend et peut-etre une evolution du schema.

### Avancement actuel

- etape 1 faite : largeur plus utile + meilleure hierarchie de sidebar
- etape 2 faite : titres automatiques derives du premier message utilisateur
- etape 3 faite cote front :
  - menu `...` par chat
  - suppression depuis la sidebar
  - renommage local du titre
  - epinglage local
  - scroll complet de l'historique
- reste a consolider dans le bloc entretien :
  - polish visuel de la sidebar
  - verifier le ressenti du bloc `Retour sur l'entretien`
  - decider plus tard si rename/pin doivent devenir persistants en base

### Etape 4

Finitions visuelles :
- espacements
- hierarchie
- accentuation de l'etat courant
- style plus abouti

### Avancement visuel actuel

- cartes de chats plus lisibles et plus contrastées
- carte persona/stats plus nette
- zone conversations mieux separee visuellement
- etat vide du centre plus presentable
- bloc `Retour sur l'entretien` plus discret et plus lisible

## Regle de travail

Une seule sous-etape a la fois.
On ne ferme pas le bloc entretien tant que la sidebar n'est pas assez bonne pour un usage etudiant reel.
