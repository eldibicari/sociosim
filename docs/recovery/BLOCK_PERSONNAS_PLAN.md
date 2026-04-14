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

Etat :
- en cours avance
- recherche visible ajoutee
- filtres pills ajoutes
- hierarchie de page refaite
- cartes mieux preparees pour la suite
- validation visuelle faite

### Etape 3

Cartes personna :
- meilleur rendu du nom / description
- badges d'etat
- historique plus lisible
- CTA entretien plus clair
- bouton `Voir la fiche` ajoute

Etat :
- en cours avance
- les cartes pointent maintenant vers une fiche persona V1
- la fiche relie deja entree entretien, prompt et historique

### Etape 4

Creation de personna :
- verifier le layout 3 colonnes
- polir la colonne gauche
- polir la colonne validation
- garder Cauldron visible mais pas lourd

Etat :
- en cours avance
- la creation est maintenant plus guidee et plus rassurante
- la validation explique mieux ce qu'elle verifie
- l'ecran d'edition retrouve le meme ton pedagogique
- la grille d'entretien devient maintenant un vrai contenu editable du persona

### Etape 5

Finitions :
- cohesion visuelle
- micro-textes
- verification de demo

## Recommandation immediate

La prochaine sous-etape la plus rentable est :
- tester visuellement la fiche persona V1
- puis enrichir ce qui manque le plus entre historique detaille, grille associee et creation / edition

Pourquoi :
- la liste a deja retrouve un bon niveau
- la fiche persona devient maintenant le vrai noyau du bloc
- c'est elle qui doit relier entretien, prompt et historique

## Cadrage complementaire deja retenu

La logique de la future fiche persona est maintenant posee dans :
- `docs/recovery/PERSONA_FICHE_PLAN.md`

Elements cles retenus :
- ne pas fusionner grille d'entretien et prompt
- les regrouper dans une meme fiche persona
- garder `Historique` comme action principale par persona
- faire de la fiche persona un vrai point d'entree pedagogique
