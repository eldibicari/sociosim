# Fiche Persona Plan

## But

Definir une vraie **fiche persona** qui serve de noyau au bloc `personnas`.

Cette fiche doit permettre a l'etudiant de comprendre rapidement :
- qui est le persona
- comment l'aborder
- quelle grille d'entretien utiliser
- quel prompt le fait vivre
- quels entretiens existent deja avec lui

## Principe retenu

On **ne fusionne pas** la grille d'entretien et le prompt dans un seul bloc opaque.

On les **lie fortement** dans une meme fiche persona, mais avec des roles distincts :
- `Prompt persona` : donne la voix, le profil, les tensions, les usages, le style de reponse
- `Grille d'entretien` : guide l'etudiant dans la conduite de l'entretien et les themes a couvrir

## Position dans le produit

La fiche persona doit devenir le point d'entree principal entre :
- la page liste `personnas`
- l'historique des entretiens
- la creation / edition
- le lancement d'un nouvel entretien

## Structure cible de la fiche persona

### 1. En-tete

Contenu :
- nom du persona
- description courte
- statut
- auteur / origine si utile
- boutons principaux

Actions visibles :
- `Commencer un entretien`
- `Voir l'historique`
- `Modifier`

Resultat attendu :
- l'utilisateur comprend immediatement a qui il a affaire et quoi faire ensuite

### 2. Resume du persona

Contenu :
- presentation synthétique du profil
- niveau ou type d'etudiant
- rapport a l'IA
- posture generale
- points de vigilance

Resultat attendu :
- l'etudiant sait comment situer le persona avant de commencer

### 3. Grille d'entretien associee

Contenu :
- themes principaux a couvrir
- sous-questions utiles
- relances conseillees
- angles a ne pas oublier

Important :
- la grille doit etre pedagogique et lisible
- elle n'est pas le prompt

Resultat attendu :
- l'etudiant dispose d'une vraie aide de conduite

### 4. Prompt associe

Contenu :
- prompt actif ou prompt publie
- possibilite de consulter le contenu
- acces a l'edition si autorise

Resultat attendu :
- le persona garde une base technique visible sans la mettre au centre de la page

### 5. Historique par persona

Contenu :
- liste des entretiens deja realises avec ce persona
- date
- utilisateur si utile
- reprise rapide

Actions :
- `Continuer`
- `Voir l'analyse`

Resultat attendu :
- chaque persona devient un veritable espace de travail reutilisable

### 6. Conseils de posture

Contenu possible :
- comment entrer en matiere
- quels types de questions sont recommandees
- quels pieges eviter

Resultat attendu :
- la fiche ne sert pas juste a decrire, elle aide aussi a conduire l'entretien

## Ce que doit afficher une carte persona dans la liste

Chaque carte de la page `personnas` doit idealement montrer :
- nom
- description courte
- statut
- auteur ou type si utile
- indices d'usage si disponible

Actions principales :
- `Commencer`
- `Historique`
- `Voir la fiche`
- `Prompt` ou `Modifier`

## Lien avec l'accueil

Quelques personnas exemples pourront ensuite etre remontes sur la page d'accueil.

La fiche persona doit donc etre :
- lisible
- presentable
- pedagogique
- pas uniquement technique

## Definition d'une fiche persona reussie

La fiche sera consideree comme assez bonne quand :
1. elle explique clairement le persona
2. elle relie grille, prompt et historique sans confusion
3. elle donne une aide concrete a l'etudiant
4. elle permet de lancer un entretien rapidement
5. elle reste plus editoriale que purement admin

## Prochaine sous-etape recommandee

Apres ce cadrage, la prochaine etape la plus logique est :
- refaire la page liste `personnas`

Pourquoi :
- la liste doit pointer vers la future fiche
- les cartes doivent deja porter cette logique
- cela permettra ensuite de creer la route/page de fiche persona sur une base plus claire
