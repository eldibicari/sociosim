# Persona Advanced Architecture Plan

## Intention

Ce document garde la direction produit avancee du bloc `personnas`.

L'objectif n'est pas de reconstruire SocioSim depuis zero, mais de faire evoluer l'existant vers une architecture plus claire, plus pedagogique et plus demoable.

## Probleme a resoudre

Le projet ne doit pas melanger :
- le prompt de la persona
- la grille d'entretien
- l'analyse finale
- l'export

Ces objets sont lies, mais ils n'ont pas le meme role.

## Decision produit

- `Prompt` : moteur interne de simulation. Il pilote la voix, le comportement et les limites de la persona.
- `Parametres de persona` : interface lisible pour configurer la persona sans editer directement tout le prompt.
- `Grille d'entretien` : objet methodologique visible, modifiable et utilisable avant, pendant et apres l'entretien.
- `Analyse finale` : sortie post-entretien separee, pedagogique, exportable et exploitable.

## Architecture cible

### 1. Configuration de l'entretien

L'utilisateur choisit ou configure :
- la persona
- le type d'entretien
- l'objectif de l'entretien
- les themes principaux
- le niveau de difficulte
- quelques contraintes de style ou de contexte si utile

### 2. Generation interne

Le systeme produit deux objets distincts :
- un prompt systeme interne pour la persona
- une grille d'entretien visible pour l'utilisateur

### 3. Entretien en direct

Pendant le chat :
- la persona repond selon son prompt
- la grille reste visible dans un panneau ou une zone dediee
- le systeme indique les themes deja couverts
- le systeme suggere des relances
- le systeme repere les zones encore peu explorees

### 4. Sorties finales

A la fin, le systeme produit :
- un compte rendu synthetique
- une analyse methodologique
- une grille d'entretien finale exportable

## Couche parametres de persona

Les parametres doivent devenir des champs UI exploitables, pas seulement du texte brut.

### Identite et role

- prenom / nom fictif
- age
- genre si utile
- profession ou role social
- environnement social
- lieu ou contexte de vie
- niveau d'etude ou experience

### Rapport au sujet

- concerne directement ou indirectement
- favorable, ambivalent, reticent ou conflictuel
- niveau d'implication
- niveau de politisation ou de conscience du sujet

### Style interactionnel

- bavard ou concis
- direct ou prudent
- cooperatif ou mefiant
- stable ou contradictoire
- emotionnel ou factuel
- spontane ou reflechi

### Niveau de difficulte pedagogique

- facile
- intermediaire
- difficile

Effets attendus :
- plus ou moins de precision
- plus ou moins de resistance
- plus ou moins de relances necessaires
- plus ou moins d'ambiguite

### Sensibilites / zones delicates

- themes evites
- themes demandant de la confiance
- sujets declenchant des reponses breves ou defensives

### Consignes de langage

- registre de langue
- longueur moyenne des reponses
- ton general
- vocabulaire simple ou technique

## Prompt interne modulaire

Le prompt genere devrait etre compose de blocs :
- identite
- contexte social
- posture par rapport au sujet
- comportement conversationnel
- niveau de difficulte
- garde-fous de coherence
- regles de reponse

Contraintes :
- la persona doit rester coherente
- elle ne doit pas repondre comme un assistant IA
- elle doit repondre comme une personne interrogee dans un entretien semi-directif
- elle peut etre partielle, hesitante ou contradictoire, mais de maniere credible
- elle ne doit pas transformer l'echange en cours magistral

## Grille d'entretien

La grille devient un objet central de methode.

Structure cible :
- titre de l'entretien
- objectif
- themes
- sous-themes
- questions principales
- relances possibles
- indicateurs de couverture pendant l'entretien
- notes eventuelles

Moments d'utilisation :
- avant l'entretien : preparation
- pendant l'entretien : guide dynamique
- apres l'entretien : document final

## Analyse finale

La sortie finale doit rester separee de la grille.

Sections minimales :
- synthese de l'entretien
- analyse methodologique
- verbatims / elements saillants

Elements utiles :
- themes bien explores
- themes superficiels
- themes absents
- relances qui auraient pu etre faites
- evaluation generale de la conduite d'entretien
- indicateur leger de couverture, sans gamification excessive

## Types cibles

Types a definir progressivement :
- `PersonaConfig`
- `PersonaPromptBlueprint`
- `InterviewGrid`
- `GridTheme`
- `GridQuestion`
- `InterviewSession`
- `InterviewAnalysis`
- `ExportPayload`

## Adaptation progressive au repo actuel

Le projet possede deja plusieurs briques reutilisables :
- page liste `personnas`
- fiche persona
- champ `interview_guide`
- edition du prompt
- chat entretien
- analyse V3
- page analyse complete
- export PDF d'analyse

La prochaine evolution ne doit donc pas recommencer le bloc, mais ajouter une couche structurante :
1. auditer l'existant
2. definir les types cibles
3. transformer progressivement la grille en objet plus structure
4. preparer une couche `PersonaConfig`
5. composer le prompt interne a partir des parametres
6. connecter la grille a l'ecran d'entretien
7. enrichir l'analyse finale avec la grille et la couverture des themes

## Ordre de travail retenu

### Phase 1

Audit de l'existant et cartographie des fichiers concernes.

### Phase 2

Definition des types pour :
- persona config
- grille
- analyse finale

Etat :
- implemente dans `src/lib/personaConfig.ts`
- couvre `PersonaConfig`, `PersonaPromptBlueprint`, `InterviewGrid`, `GridTheme`, `GridQuestion`, `InterviewGridCoverage`, `InterviewMethodAnalysis` et `ExportPayload`
- ne change pas encore la base de donnees

### Phase 3

Ajout ou refactor leger de la generation du prompt a partir des parametres.

Etat :
- implemente comme logique pure dans `src/lib/personaPromptComposer.ts`
- `buildPersonaPromptBlueprint(config)` produit les blocs internes
- `buildPersonaPromptFromConfig(config)` compose le prompt systeme final
- branche dans la creation de persona via une configuration guidee V1
- l'editeur de prompt reste disponible comme mode avance
- reste a etendre cette logique a la page d'edition

### Phase 4

Structuration de la grille comme objet visible et editable.

### Phase 5

Connexion de la grille a l'ecran de chat :
- themes couverts
- relances
- suivi methodologique simple

### Phase 6

Sortie finale :
- synthese
- analyse methodologique
- verbatims
- export final

### Phase 7

Polish UX et coherence generale.

## Regle

Ne pas repartir de zero.

Ne pas casser les briques deja bonnes.

Avancer par petites adaptations demoables.
