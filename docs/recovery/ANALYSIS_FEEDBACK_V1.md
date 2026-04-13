# Analysis / Feedback V1

## But

Remettre une vraie valeur pedagogique post-entretien avant la reconstruction UI.

Cette V1 doit rester :
- simple
- credible
- rapide a implementer
- lisible pour l'etudiant

Elle ne cherche pas encore a couvrir toute la logique avancee perdue avant le vol.

## Ce que la V1 doit faire

Apres un entretien, le systeme doit produire :
- un niveau global de qualite du materiau
- un court feedback pedagogique
- une analyse plus ou moins detaillee selon ce niveau

## Niveau global attendu

Trois niveaux seulement :

### 1. Insuffisant

Cas typiques :
- entretien trop court
- trop peu de reponses exploitables
- reponses trop vagues
- conversation hors sujet

Comportement :
- pas d'analyse detaillee
- message pedagogique clair
- suggestion simple pour mieux relancer l'entretien

### 2. Partiel

Cas typiques :
- quelques elements utiles
- mais zones importantes encore floues
- exemples trop rares
- manque de profondeur ou de precision

Comportement :
- analyse reduite
- avertissement sur les limites du materiau
- conseils simples pour enrichir un prochain entretien

### 3. Exploitable

Cas typiques :
- matiere suffisante
- plusieurs reponses concretes
- exemples exploitables
- entretien globalement coherent

Comportement :
- analyse courte mais complete
- points forts du materiau
- pistes de lecture sociologique ou de codage

## Structure minimale de la sortie

La V1 doit renvoyer un objet simple avec :
- `material_quality`
- `feedback_title`
- `feedback_text`
- `strengths`
- `limits`
- `next_steps`

Optionnel en V1 si c'est facile :
- `signals`
  exemple : nombre de messages, presence d'exemples concrets, longueur moyenne des reponses

## Regles simples de decision

La V1 ne doit pas pretendre mesurer parfaitement la qualite.
Elle peut s'appuyer sur des heuristiques simples.

Exemples de signaux utiles :
- nombre de messages assistant / utilisateur
- longueur totale des reponses utilisateur
- presence d'exemples concrets
- presence de themes repetes
- presence de reponses trop courtes ou evasives

Regle de bon sens :
- si le materiau est faible, on n'affiche pas une grande analyse pseudo-savante
- si le materiau est moyen, on reste prudent
- si le materiau est bon, on autorise une synthese plus riche

## Ce que la V1 ne doit pas faire

Ne pas faire maintenant :
- systeme complet de 5 phases validees automatiquement
- scoring complexe opaque
- grosses promesses d'analyse scientifique automatique
- longs blocs IA verbeux
- faux sentiment de precision

## Ton du feedback

Le ton doit etre :
- pedagogique
- encourageant
- honnete
- non punitif

Exemples :
- "Le materiau est encore trop faible pour une analyse detaillee."
- "Quelques elements sont exploitables, mais plusieurs zones restent a approfondir."
- "L'entretien fournit deja une base exploitable pour une premiere lecture."

## Forme de la V1 dans l'app

Avant la refonte UI, une presentation simple suffit :
- un badge ou titre pour le niveau global
- un paragraphe de feedback
- 3 listes courtes :
  - points forts
  - limites
  - prochaines relances / prochaines etapes

## Ordre de mise en oeuvre recommande

1. definir le schema de sortie
2. construire une premiere logique simple cote serveur
3. brancher un affichage minimal dans l'app
4. tester sur 3 cas :
   - entretien faible
   - entretien moyen
   - entretien exploitable

## Critere de succes

La V1 est reussie si :
- elle ne survend pas la qualite du materiau
- elle distingue bien les 3 niveaux
- elle donne un retour utile a l'etudiant
- elle est assez simple pour etre stable rapidement

## Statut

Document de cadrage V1.
Pas encore implemente dans le code au moment de sa creation.
