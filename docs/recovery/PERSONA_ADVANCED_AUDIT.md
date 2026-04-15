# Persona Advanced Audit

## But

Auditer l'etat actuel du repo par rapport a la direction :
- parametres de persona
- prompt interne
- grille d'entretien
- suivi pendant l'entretien
- analyse finale / export

## Ce qui existe deja

### Persona

Fichiers principaux :
- `src/app/personnas/page.tsx`
- `src/app/personnas/components/AgentCard.tsx`
- `src/app/personnas/[id]/page.tsx`
- `src/app/personnas/personaFiche.ts`
- `src/lib/agents.ts`
- `src/lib/data/agents.ts`

Etat :
- liste des personnas fonctionnelle
- cartes enrichies
- fiche persona V1
- historique par persona
- CTA vers entretien
- champ `interview_guide` ajoute

### Prompt

Fichiers principaux :
- `src/app/personnas/new/NewPersonnaForm.tsx`
- `src/app/personnas/[id]/edit/page.tsx`
- `src/app/personnas/components/PersonnaPromptEditor.tsx`
- `src/app/personnas/components/PromptReviewSidebar.tsx`
- `src/app/api/agents/[id]/prompts/route.ts`
- `src/app/api/agents/[id]/prompts/publish/route.ts`

Etat :
- prompt brut encore central dans creation / edition
- validation Cauldron existe
- mode prompt avance utilisable
- pas encore de couche `PersonaConfig`
- pas encore de generation automatique du prompt depuis des parametres visibles

### Grille d'entretien

Fichiers principaux :
- `src/app/personnas/[id]/page.tsx`
- `src/app/personnas/[id]/edit/page.tsx`
- `src/app/personnas/new/NewPersonnaForm.tsx`
- `src/app/personnas/personaFiche.ts`
- `supabase/migrations/20260414_add_agents_interview_guide.sql`

Etat :
- grille editable existe deja sous forme de texte
- fiche persona affiche une grille stockee ou une grille de secours derivee du prompt
- pas encore de structure typee `InterviewGrid`
- pas encore de themes/questions/relances sous forme d'objet
- pas encore de suivi dynamique des themes pendant le chat

### Chat

Fichiers principaux :
- `src/app/interview/page.tsx`
- `src/app/interview/[id]/page.tsx`
- `src/app/components/InterviewLayout.tsx`
- `src/app/components/InterviewSidebar.tsx`
- `src/lib/interviewChat.ts`
- `src/app/api/chat/route.ts`

Etat :
- chat fonctionnel
- sidebar riche
- historique avec actions
- feedback dans le chat
- reponse progressive cote UI
- pas encore de panneau grille dynamique pendant l'entretien
- suggestions de relance actuelles encore generiques

### Analyse finale / export

Fichiers principaux :
- `src/lib/interviewAnalysis.ts`
- `src/lib/schemas.ts`
- `src/app/api/interviews/analysis/route.ts`
- `src/app/interview/[id]/analysis/page.tsx`
- `src/app/components/InterviewAnalysisContent.tsx`
- `src/app/api/interviews/analysis/export/route.ts`
- `src/lib/interviewExport.ts`

Etat :
- analyse V3 existe
- analyse complete a sa propre page
- export PDF d'analyse existe
- analyse detecte questions, relances, bruit, exemples, couverture de themes
- couverture de themes utilise encore des mots-cles internes generiques
- l'analyse n'utilise pas encore la grille propre du persona

## Ce qu'on peut reutiliser directement

- page liste `personnas`
- fiche persona
- champ `interview_guide`
- editeur prompt comme mode avance
- validation Cauldron
- chat et sidebar
- page analyse complete
- export PDF d'analyse
- types d'analyse deja presents dans `src/lib/schemas.ts`

## Ce qu'il faut refactorer legerement

### Creation / edition persona

Passer de :
- prompt brut visible au centre comme logique principale

A :
- parametres de persona visibles comme logique principale
- prompt brut disponible en mode avance

### Grille

Passer de :
- `interview_guide: text`

A :
- texte conserve pour compatibilite
- parseur / modele structure `InterviewGrid`
- plus tard stockage JSON si necessaire

### Analyse

Passer de :
- couverture par mots-cles generiques

A :
- couverture basee sur la grille du persona
- themes couverts / partiels / absents issus de la grille

## Ce qu'il faut ajouter

### Types

- `PersonaConfig`
- `PersonaPromptBlueprint`
- `InterviewGrid`
- `GridTheme`
- `GridQuestion`
- `InterviewGridCoverage`
- `ExportPayload`

### Logique

- composer un prompt interne depuis `PersonaConfig`
- convertir une grille texte en grille structuree
- generer une grille de depart depuis les parametres
- analyser la couverture des themes de la grille pendant/apres l'entretien

### UI

- ecran creation/edition oriente parametres
- mode avance pour le prompt brut
- affichage grille plus structure dans fiche persona
- plus tard panneau grille dans le chat
- plus tard restitution finale enrichie avec grille finale

## Premier schema de types propose

```ts
export type PersonaDifficulty = "facile" | "intermediaire" | "difficile";

export type PersonaSubjectPosition =
  | "favorable"
  | "ambivalent"
  | "reticent"
  | "conflictuel";

export type PersonaConfig = {
  identity: {
    firstName: string;
    age?: string;
    gender?: string;
    role?: string;
    socialEnvironment?: string;
    livingContext?: string;
    educationLevel?: string;
  };
  subjectRelation: {
    position: PersonaSubjectPosition;
    involvementLevel?: string;
    politicizationLevel?: string;
    keyTensions: string[];
  };
  interactionStyle: {
    verbosity: "concis" | "equilibre" | "bavard";
    stance: "direct" | "prudent";
    cooperation: "cooperatif" | "mefiant";
    consistency: "stable" | "contradictoire";
    affect: "factuel" | "emotionnel";
  };
  difficulty: PersonaDifficulty;
  sensitiveZones: string[];
  language: {
    register: string;
    averageAnswerLength: string;
    tone: string;
    vocabularyLevel: string;
  };
  additionalInstructions?: string;
};

export type PersonaPromptBlueprint = {
  identityBlock: string;
  socialContextBlock: string;
  subjectPostureBlock: string;
  conversationBehaviorBlock: string;
  difficultyBlock: string;
  coherenceGuardsBlock: string;
  responseRulesBlock: string;
};

export type GridQuestion = {
  id: string;
  label: string;
  intent?: string;
  followUps: string[];
};

export type GridTheme = {
  id: string;
  title: string;
  objective: string;
  questions: GridQuestion[];
};

export type InterviewGrid = {
  title: string;
  objective: string;
  themes: GridTheme[];
  notes?: string;
};

export type InterviewGridCoverage = {
  themeId: string;
  status: "non_aborde" | "partiel" | "couvert";
  evidence: string[];
  suggestedFollowUps: string[];
};
```

## Plan d'adaptation concret

### Phase 2 immediate

Ajouter les types dans un fichier dedie, sans toucher a la DB :
- `src/lib/personaConfig.ts`

But :
- stabiliser le vocabulaire technique
- eviter de tout melanger dans `schemas.ts`

Etat :
- implemente
- schemas Zod et types ajoutes dans `src/lib/personaConfig.ts`
- test de base ajoute dans `src/lib/personaConfig.test.ts`
- aucune migration DB ajoutee a ce stade

### Phase 3

Ajouter un composeur de prompt :
- `buildPersonaPrompt(config: PersonaConfig): string`

Le prompt brut devient une sortie generee, pas le point de depart principal.

Etat :
- logique ajoutee dans `src/lib/personaPromptComposer.ts`
- tests ajoutes dans `src/lib/personaPromptComposer.test.ts`
- l'UI continue pour l'instant a afficher l'editeur de prompt brut
- prochaine etape : introduire progressivement les champs de configuration visibles

### Phase 4

Structurer la grille :
- parser la grille texte actuelle en `InterviewGrid`
- afficher cette structure dans la fiche
- garder le champ texte comme fallback compatible

### Phase 5

Connecter la grille au chat :
- afficher les themes de la grille dans un panneau
- calculer une couverture simple a partir des messages
- proposer des relances par theme

### Phase 6

Enrichir l'analyse :
- remplacer les themes generiques par les themes de la grille
- ajouter une grille finale exportable dans le PDF d'analyse

## Decision recommandee

Ne pas continuer a mettre le prompt brut au centre de l'experience utilisateur.

Le prompt brut doit devenir :
- soit une sortie generee
- soit un mode avance

L'experience principale doit devenir :
- configurer la persona
- preparer la grille
- mener l'entretien
- analyser les resultats
