# Bloc Personnas

## But

Finir proprement le bloc `personnas` avant de passer a un autre ecran principal.

Le bloc comprend :
- la liste des personnas
- la recherche / les filtres
- les cartes personna
- les actions rapides
- le flux de creation / edition
- la validation visible du prompt

## Ce que disent les docs recovery

### Recovery global
- le bloc `personnas` fait partie du parcours principal a restaurer avant la demo
- il vient juste avant l'entretien dans le flow etudiant
- il doit etre stable, montrable et lisible

### Ecart visuel retenu
Les captures anciennes montrent :
- un titre de section `Espace personnas`
- une zone de recherche
- des filtres en pills
- des cartes plus riches
- des badges d'etat visibles
- un bouton `Creer une nouvelle personna`

La creation de personna montrait deja :
- colonne gauche : nom, description, aide
- centre : editeur du prompt
- colonne droite : validation du prompt

## Ce qui existe deja dans le code

### Liste
- chargement des agents
- redirection login
- separation enseignant / etudiant
- creation de session depuis la carte
- historique
- acces prompt
- activation / desactivation

### Creation / edition
- layout 3 colonnes deja present
- editeur prompt deja present
- validation Cauldron deja visible

## Ce qui manque ou semble en retrait

### Liste personnas
- pas encore de vraie recherche visible
- pas encore de filtres pills comme dans les captures
- hierarchie visuelle encore assez simple
- cartes encore trop utilitaires
- peu de mise en avant du statut ou de l'usage
- entree dans l'entretien encore un peu faible visuellement

### Flux creation
- base deja riche
- mais probablement encore besoin de polish visuel
- aide a la generation encore dense
- validation a verifier cote lisibilite

## Definition du bloc personnas termine

Le bloc sera considere comme assez fini pour la demo quand on aura :

1. une page liste lisible et plus proche des captures
2. une recherche simple et utile
3. des filtres visibles
4. des cartes personna plus parlantes
5. un CTA d'entretien clair
6. une page de creation propre et lisible
7. une validation prompt visible sans surcharge

## Ordre de travail retenu

### Etape 1

Audit + cadrage ferme :
- ce document
- comparaison code / recovery / captures

### Etape 2

Liste personnas :
- remettre le titre / sous-titre de section
- ajouter recherche
- ajouter filtres visibles
- mieux structurer les groupes

### Etape 3

Cartes personna :
- meilleur rendu du nom / description
- badges d'etat
- historique plus lisible
- CTA entretien plus clair

### Etape 4

Creation de personna :
- verifier le layout 3 colonnes
- polir la colonne gauche
- polir la colonne validation
- garder Cauldron visible mais pas lourd

### Etape 5

Finitions :
- cohesion visuelle
- micro-textes
- verification de demo

## Recommandation immediate

La prochaine sous-etape la plus rentable est :
- commencer par la page liste `personnas`

Pourquoi :
- elle est visible tout de suite
- elle est directement dans le parcours principal
- elle semble la plus eloignee des captures sur le plan UX
