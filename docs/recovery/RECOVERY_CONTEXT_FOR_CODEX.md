# RECOVERY_CONTEXT_FOR_CODEX.md

## Contexte général
Le projet a été interrompu à cause du vol de l’ordinateur de travail. L’environnement a été reconstruit sur un nouveau PC Windows. Les dépôts GitHub disponibles ont été reclonés, mais ils ne contiennent pas le dernier avancement local avant le vol.

L’objectif n’est pas une refonte parfaite. L’objectif est une reconstruction pragmatique et rapide pour revenir d’ici dimanche à un état proche de l’avancement de stage avant le vol.

## Dépôts concernés
1. `sociosim`
2. `sociosim-adk-agent`
3. `cauldron`

## État actuel connu
### Environnement
- VS Code, Git, GitHub Desktop, Node, Docker sont installés
- Les 3 dépôts sont clonés et ouverts dans le même workspace
- `sociosim` se lance sur `localhost:3000`
- Une branche de secours `recovery-setup` existe déjà sur GitHub

### Problèmes encore ouverts
- L’auth locale de `sociosim` n’est pas encore totalement réparée
- `sociosim-adk-agent` n’a pas encore été relancé et vérifié
- `cauldron` n’a pas encore été relancé et vérifié
- Une partie de l’avancement UI local avant le vol a été perdue

## Priorité absolue de la semaine
Revenir à un état fonctionnel et montrable avant dimanche.

Cela veut dire :
- tout ce qui existe déjà doit fonctionner
- le parcours principal doit être rétabli
- l’UI doit être reconstruite seulement sur les pages clés
- on évite les chantiers lourds non essentiels

## Ce qu’il ne faut PAS faire maintenant
Ne pas lancer maintenant :
- voix
- avatars avancés
- Google Drive complet
- upload libre de fichiers/photos
- refonte globale du projet
- changements risqués du thème global si ce n’est pas nécessaire

## Parcours principal à rétablir d’abord
1. login / auth locale
2. accès aux personas
3. ouverture d’un entretien
4. conversation avec le persona
5. affichage de l’analyse / feedback
6. exports principaux

## Décisions produit importantes
### 1. Reconstruction rapide, pas perfection
Le projet n’a pas besoin d’être parfait cette semaine.
Il doit être :
- stable
- cohérent
- montrable
- proche du niveau de stage utile avant le vol

### 2. UI à refaire seulement sur les pages clés
Pages à prioriser :
- accueil
- personas
- entretien
- analyse / feedback
- guide d’entretien

Pages secondaires à toucher plus tard si besoin :
- profil
- utilisateurs
- autres détails admin

### 3. Guide d’entretien
Le contenu du guide ne doit pas être réécrit.
On peut améliorer uniquement :
- la forme
- la hiérarchie visuelle
- la lisibilité
- la structure de lecture
- les tableaux
- les citations
- le sommaire

### 4. Progression d’entretien
On ne veut plus un système de 5 phases affichées comme si elles étaient automatiquement validées juste parce qu’il y a eu quelques messages.

À la place, on veut plutôt une logique plus simple et plus crédible :
- 3 états ou 3 étapes d’entretien visibles
- progression plus pédagogique
- ne pas faire croire que toutes les phases ont été couvertes si la conversation est faible ou hors sujet

### 5. Analyse / feedback
Le projet doit intégrer une logique de qualité du matériau :
- Insuffisant
- Partiel
- Exploitable

Comportement attendu :
- Insuffisant → pas d’analyse détaillée, message pédagogique clair
- Partiel → analyse réduite + avertissement
- Exploitable → analyse complète

### 6. Suggestions dans le chat
Amélioration attendue :
- masquer les suggestions quand l’utilisateur écrit
- masquer aussi les suggestions quand le persona est en train de répondre
- à terme, proposer un bouton ou un mécanisme simple pour afficher des relances utiles

## Ce que Codex doit faire
Codex doit agir comme exécutant précis, pas comme designer libre.

### Règle importante
Ne pas inventer une nouvelle direction produit.
Ne pas “réimaginer” l’application.
Ne pas lancer plusieurs gros chantiers en même temps.
Ne modifier que ce qui est demandé.

### Quand on demande un audit
Codex doit :
- lire les fichiers existants
- dire ce qui existe déjà
- dire ce qui manque
- proposer la manière la plus rapide de revenir à un état stable

### Quand on demande du code
Codex doit :
- modifier uniquement les fichiers nécessaires
- garder l’architecture existante
- éviter les changements globaux risqués
- éviter les dépendances npm supplémentaires sauf demande explicite

## Ordre de travail recommandé
### Sprint 1
Remettre `sociosim` totalement utilisable en local :
- corriger l’auth
- vérifier Supabase
- vérifier login
- vérifier accès pages clés

### Sprint 2
Relancer les services :
- `sociosim-adk-agent`
- `cauldron`
- vérifier les connexions entre services

### Sprint 3
Remettre le parcours produit principal :
- personas
- entretien
- analyse / feedback
- exports

### Sprint 4
Refaire les pages UI les plus importantes :
- accueil
- personas
- entretien
- guide

### Sprint 5
Stabiliser et préparer la démo :
- tests de parcours
- corrections de bugs visibles
- commits propres

## Style de réponse attendu de Codex
Toujours répondre simplement.
Toujours privilégier :
- ce qui existe déjà
- la réparation ciblée
- le gain de temps
- les étapes courtes

Éviter :
- le jargon inutile
- les solutions trop ambitieuses
- les gros changements non demandés

## Quand il y a plusieurs options
Toujours proposer :
1. l’option la plus rapide
2. l’option plus propre si elle reste réaliste
3. la recommandation finale

## Résultat attendu d’ici dimanche
Un projet qui :
- tourne localement
- permet le parcours principal
- ressemble à nouveau au projet de stage
- est assez stable pour reprendre le travail sérieusement la semaine suivante
