# Analyse Complete - Plan de Page

## But

Creer un espace dedie a l'analyse pedagogique d'un entretien, separe du chat.

Le bloc `Retour sur l'entretien` dans le chat doit rester :
- court
- utile
- consultable rapidement

La page `Analyse complete` doit, elle, devenir :
- un espace de lecture calme
- un retour type prof
- une base exportable en PDF
- plus tard un contenu partageable vers Google Docs

## Pourquoi separer l'analyse du chat

Le chat sert a :
- conduire l'entretien
- poser des questions
- relancer
- observer les reponses du persona

L'analyse complete sert a :
- prendre du recul
- evaluer la conduite d'entretien
- comprendre ce qui a ete obtenu
- preparer la suite

Si on laisse toute l'analyse dans le chat :
- le bloc devient trop long
- on perd en lisibilite
- l'export devient confus
- l'etudiant ne sait plus ce qui releve du dialogue ou du retour pedagogique

## Structure recommandee

### Option retenue

Creer une vraie page dediee, par exemple :
- `/interviews/[id]/analysis`

Et depuis l'ecran d'entretien :
- garder un bouton `Voir l'analyse complete`

### Pourquoi cette option

- plus claire que d'empiler encore du contenu dans le chat
- plus simple a exporter en PDF
- meilleure base future pour Google Docs
- plus proche d'un vrai espace de lecture pedagogique

## Ce que doit contenir la page

### 1. En-tete de page

Objectif :
- rappeler le contexte sans recharger toute la page

Contenu :
- nom du persona
- date de l'entretien
- utilisateur
- niveau global : `Insuffisant` / `Partiel` / `Exploitable`
- score global
- boutons :
  - `Retour au chat`
  - `Exporter l'analyse en PDF`
  - plus tard `Exporter vers Google Docs`

### 2. Synthese pedagogique

Objectif :
- donner une lecture immediate

Contenu :
- titre de feedback
- phrase de synthese
- paragraphe principal
- conseil central

### 3. Tableau de bord d'indicateurs

Objectif :
- montrer des chiffres simples et lisibles

Contenu :
- messages etudiant
- mots produits
- reponses longues
- exemples concrets
- questions ouvertes
- tokens totaux

### 4. Conduite d'entretien

Objectif :
- evaluer comment l'utilisateur a mene l'entretien

Contenu :
- style de question
- qualite des relances
- repetitions
- bruit ou messages tests
- commentaire de type prof

### 5. Lecture du materiau recueilli

Objectif :
- juger la qualite du materiau obtenu

Contenu :
- densite des reponses
- niveau de concret
- tensions ou contrastes reperes
- commentaire pedagogique

### 6. Couverture des themes

Objectif :
- montrer ce qui a ete couvert ou pas

Contenu :
- themes couverts
- themes partiels
- themes manquants
- eventuellement indices de preuve par theme

### 7. Exemples tires de l'entretien

Objectif :
- rendre le feedback concret

Contenu :
- bonnes questions posees
- questions faibles
- verbatims forts
- exemples de materiau encore faible

### 8. Plan de progression

Objectif :
- dire quoi faire ensuite

Contenu :
- 3 prochaines relances
- conseil central
- objectif du prochain entretien

### 9. Alertes pedagogiques

Objectif :
- signaler les cas problematiques

Contenu :
- bruit
- faux entretien
- trop peu de matiere
- questions repetitives
- manque de couverture

## Version 1 de la page

Pour rester pragmatiques, la V1 de cette page peut se limiter a :
- en-tete
- synthese pedagogique
- indicateurs
- conduite d'entretien
- lecture du materiau
- couverture des themes
- exemples
- plan de progression

Pas besoin en V1 de :
- graphiques complexes
- comparaison multi-entretiens
- sur-visualisation

## Lien avec le bloc entretien

Le bloc `Retour sur l'entretien` dans le chat devient alors :
- une porte d'entree
- une synthese courte
- un bouton `Voir l'analyse complete`

Donc :
- chat = action
- analyse complete = recul

## Lien avec l'export PDF

La page dediee permet naturellement un futur export :

### PDF entretien
- transcript
- prompt

### PDF analyse
- sections pedagogiques
- indicateurs
- exemples
- recommandations

Statut actuel :
- route PDF d'analyse en place
- export declenche depuis la page `Analyse complete`
- transcript et analyse restent bien separes

Il faut donc penser l'analyse complete comme un contenu exportable des le depart.

## Lien avec Google Docs

Dans un deuxieme temps, cette page pourra aussi nourrir :
- un export Google Docs de l'analyse

Cela sera plus simple si le contenu est deja :
- structure
- separe du chat
- stable dans sa hierarchie

## UX recommandee

La page doit etre :
- plus calme que le chat
- plus lisible
- moins dense visuellement
- plus proche d'un rapport pedagogique

Direction visuelle :
- grandes sections nettes
- cards ou panneaux lisibles
- navigation simple
- impression de dossier de lecture, pas de dashboard purement technique

## Ordre de mise en oeuvre recommande

1. creer la route/page `analysis`
2. reutiliser les donnees d'analyse deja calculees
3. afficher les sections principales
4. ajouter le bouton `Voir l'analyse complete` dans l'ecran entretien
5. ensuite seulement construire l'export PDF d'analyse

## Critere de succes

La page sera consideree comme reussie si :
- l'etudiant comprend rapidement ce que l'entretien a produit
- il peut distinguer dialogue et analyse
- il sait quoi ameliorer
- le contenu est deja assez propre pour un futur PDF pedagogique
