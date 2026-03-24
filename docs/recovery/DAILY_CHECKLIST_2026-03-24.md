# Daily Checklist - 2026-03-24

## Contexte
Cette checklist correspond au travail prévu pour le **mardi 24 mars 2026**.

Le but n’est pas de refaire le produit. Le but est de remettre le pipeline réel en état de marche avant la phase de reconstruction UI.

## Objectif du jour
Faire en sorte que l’état actuel du projet fonctionne réellement, avant de passer à 3-4 jours de reconstruction UI.

## Priorité 1 - `sociosim`
- [ ] vérifier que `npm install` est ok
- [ ] vérifier que `npx next dev` fonctionne
- [ ] vérifier `.env.local`
- [ ] réparer le login local
- [ ] tester accès aux pages principales après connexion

## Priorité 2 - Supabase
- [ ] démarrer Supabase local
- [ ] vérifier `db reset`
- [ ] corriger le problème seed auth / identities si nécessaire
- [ ] vérifier que le user seed peut se connecter

## Priorité 3 - `sociosim-adk-agent`
- [ ] lire le README
- [ ] créer les variables d’environnement minimales
- [ ] lancer le service
- [ ] tester endpoint de base
- [ ] vérifier la connexion avec `sociosim`

## Priorité 4 - `cauldron`
- [ ] lire le README
- [ ] créer les variables d’environnement minimales
- [ ] lancer le service
- [ ] tester `/health` ou endpoint principal
- [ ] vérifier la connexion avec `sociosim`

## Priorité 5 - Parcours minimal
- [ ] login
- [ ] accès personas
- [ ] ouverture entretien
- [ ] réponse agent
- [ ] accès analyse / feedback si déjà présent
- [ ] export si déjà présent

## Règles du jour
- ne pas toucher au design d’abord
- ne pas lancer de grosse feature
- ne pas ouvrir un chantier lourd tant que le parcours principal ne fonctionne pas
- faire des commits propres
- noter ce qui marche et ce qui bloque

## Ce qu’on fera seulement après
- reconstruction UI sur 3-4 jours
- amélioration accueil
- amélioration personas
- amélioration entretien
- amélioration guide
- logique matériau suffisant / analyse / feedback si elle n’est pas encore revenue
