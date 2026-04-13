# Analysis / Feedback V2 Plan

## But

Faire evoluer le bloc `Retour sur l'entretien` vers un retour plus clair, plus pedagogique et plus proche de l'ancien avancement perdu.

Cette V2 doit rester :
- lisible pour un etudiant
- rapide a comprendre
- basee sur des signaux concrets
- assez simple pour rester stable localement

Elle ne doit pas devenir une "fausse IA savante" ni un systeme opaque.

## Constats sur la V1 actuelle

La V1 actuelle distingue bien :
- `insuffisant`
- `partiel`
- `exploitable`

Mais elle reste trop pauvre pour une vraie valeur pedagogique, car :
- elle depend surtout du nombre de messages et du nombre de mots
- elle n'explique pas assez clairement ce qui manque
- elle ne montre pas assez les signaux chiffrés utiles
- elle ne donne pas encore un retour du type :
  - ce qui a ete fait
  - ce qui reste a faire
  - comment mieux conduire le prochain entretien

## Direction retenue pour la V2

La V2 doit combiner :
- une evaluation globale simple
- quelques indicateurs quantifies
- un retour pedagogique en langage clair

On garde 3 niveaux seulement :
- `Insuffisant`
- `Partiel`
- `Exploitable`

## Signaux a utiliser

### 1. Volume du materiau
- nombre de messages utilisateur
- nombre total de mots utilisateur
- longueur moyenne des reponses
- nombre de reponses longues

### 2. Dynamique de l'entretien
- nombre de reponses assistant
- rapport questions / reponses
- presence d'une vraie progression dans l'echange

### 3. Richesse des reponses
- presence d'exemples concrets
- presence de justifications
- presence d'elements situes dans le temps ou dans une situation

### 4. Qualite de la conduite d'entretien
- part estimee de questions ouvertes
- variete des relances
- risque de rester trop general

### 5. Usage et intensite
- input tokens
- output tokens
- total tokens

Les tokens ne doivent pas remplacer le jugement sur le contenu, mais ils peuvent aider a comprendre si l'entretien est trop faible ou deja consistant.

## Nouveau rendu pedagogique vise

Le bloc doit afficher 4 zones simples :

### Zone 1 - Niveau global
- badge `Insuffisant` / `Partiel` / `Exploitable`
- phrase tres courte

Exemple :
- `Materiau encore insuffisant pour une analyse fiable.`

### Zone 2 - Indicateurs cles
- `Messages etudiant`
- `Mots produits`
- `Reponses longues`
- `Exemples concrets`
- `Questions ouvertes`
- `Tokens totaux`

Cette zone doit etre plus "statistique lisible" que "texte vague".

### Zone 3 - Lecture pedagogique
3 sous-blocs courts :
- `Ce qui est deja bien`
- `Ce qui manque encore`
- `Comment ameliorer`

### Zone 4 - Prochain geste utile
Une recommandation tres concrete.

Exemples :
- `Demandez un exemple recent et detaille d'usage de l'IA dans un cours precis.`
- `Relancez sur une situation ou l'etudiant a hesite, corrige ou compare plusieurs usages.`

## Ce qu'on veut eviter

- un long paragraphe flou
- des listes trop generiques
- des scores incomprehensibles
- des promesses d'analyse scientifique automatique
- un bloc qui reste presque toujours sur `insuffisant`

## Heuristique V2 proposee

La qualite globale doit venir d'un petit score simple, base sur plusieurs dimensions.

### Dimensions
- volume
- profondeur
- concret
- ouverture

### Idee simple
Chaque dimension produit un score de 0 a 3.

Exemple :
- `volume_score`
- `depth_score`
- `concrete_score`
- `openness_score`

Puis on derive :
- `insuffisant` si la plupart des scores sont trop bas
- `partiel` si une base existe mais reste incomplete
- `exploitable` si plusieurs dimensions sont deja solides

## Estimation des questions ouvertes

On n'a pas besoin d'un detecteur parfait.

Une heuristique simple suffit en V2 :
- compter les messages utilisateur en forme interrogative cote enqueteur
- reperer des formulations du type :
  - `comment`
  - `pourquoi`
  - `qu'est-ce que`
  - `dans quel cas`
  - `peux-tu me raconter`
  - `est-ce que tu peux decrire`

Objectif :
- afficher un indicateur utile
- pas produire une "verite scientifique"

## Structure cible de la sortie API

En plus de la V1 actuelle, la V2 devrait idealement renvoyer :
- `summary_line`
- `metrics`
- `score_breakdown`
- `coaching_tip`

Exemple de forme :
- `material_quality`
- `summary_line`
- `feedback_title`
- `feedback_text`
- `strengths`
- `limits`
- `next_steps`
- `coaching_tip`
- `metrics`
- `score_breakdown`
- `signals`

## Exemple de metrics

- `student_messages`
- `student_words`
- `avg_words_per_answer`
- `long_answers`
- `concrete_examples`
- `open_question_ratio`
- `total_tokens`

## Exemple de score_breakdown

- `volume_score`
- `depth_score`
- `concrete_score`
- `openness_score`

## Ordre de mise en oeuvre recommande

1. ameliorer la logique serveur
2. enrichir le schema TypeScript
3. mettre a jour le hook front
4. refaire l'affichage du bloc `Retour sur l'entretien`
5. tester sur 3 cas :
   - entretien tres faible
   - entretien moyen
   - entretien exploitable

## Critere de succes

La V2 sera consideree comme bonne si :
- elle explique mieux pourquoi le materiau est faible ou non
- elle affiche des chiffres simples et utiles
- elle donne un conseil concret a l'etudiant
- elle classe moins brutalement les entretiens courts mais deja prometteurs
- elle rend le bloc entretien plus professionnel pour la demo
