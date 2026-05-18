# CLAUDE_CODE_PLAN — Mimesis UI/UX + Déploiement

## 0. Contexte court

Le projet est **Mimesis / SocioSim** : un simulateur d’entretiens semi-directifs en sciences sociales. L’objectif n’est pas de faire un chatbot de divertissement, mais une expérience d’entretien avec personas, grille, relances, analyse et export.

Direction visuelle demandée : **s’inspirer fortement de Character.ai en sensation d’usage** — sidebar, discovery feed, cartes de personnages, chat immersif, panneau de personnage — **sans copier pixel par pixel**, sans reprendre ses assets, et sans perdre l’identité Mimesis.

Le projet utilise : Next.js 16, React 19, Chakra UI v3, Panda CSS, Supabase, ADK Agent Service, framer-motion, three/react-three-fiber/drei déjà installés.

## 1. Objectif de cette intervention

Créer une version visuellement professionnelle, proche de l’expérience Character.ai, mais fidèle à Mimesis.

Priorités :

1. Stabiliser le projet pour qu’il puisse être build/deploy.
2. Améliorer fortement la DA sans casser l’architecture.
3. Transformer la page personas en vraie page de découverte type Character.ai.
4. Rendre l’interface d’entretien plus immersive : chat central + sidebar historique + panneau persona.
5. Préparer la mise en ligne complète ensuite : frontend, Supabase Cloud, backend ADK.

## 2. Règles non négociables

- Ne pas refaire toute l’architecture.
- Ne pas supprimer les routes existantes.
- Ne pas casser Supabase, les API routes, les sessions, les exports, l’analyse ou l’historique.
- Ne pas toucher à `styled-system/` : Panda le génère.
- Respecter Chakra UI v3 : utiliser `gap`, `colorPalette`, `disabled`, etc.
- Garder les textes UI principaux en français.
- Ne pas cacher les erreurs importantes avec des silent fails.
- Ne jamais commiter ou pousser sans demande explicite.
- Stopper à la fin de chaque phase et résumer les fichiers modifiés.

## 3. Audit actuel — décisions

### À garder

- La logique fonctionnelle existante : API routes, Supabase, ADK, sessions, messages.
- `InterviewLayout`, `InterviewSidebar`, `MessageInput`, `ChatMessage` comme base fonctionnelle.
- `AgentCard` comme base logique, mais pas forcément son design actuel.
- Les pages de fiche persona, grille, prompt, historique, analyse et export.
- L’idée Mimesis : simulation d’entretien SHS, pas simple chatbot.
- Les notions pédagogiques : grille d’entretien, relances, matériau, analyse, export.

### À modifier fortement

- Page `/personnas` : trop “dashboard académique”, pas assez “discovery feed / character selection”.
- Cartes personas : trop informatives, pas assez immersives et visuelles. Les initiales seules font placeholder.
- Chat : actuellement propre, mais encore trop “app académique”. Il faut renforcer le sentiment d’une conversation avec une persona.
- Header global : utile, mais pour les zones app principales il faut une navigation latérale plus proche de Character.ai.
- Couleurs : réduire l’effet “gradient IA template”. Utiliser une base plus neutre, avec accents Mimesis.

### À refaire si nécessaire

- Le layout visuel de `/personnas`.
- Le style des cartes personas.
- L’organisation desktop de l’écran d’entretien : gauche historique, centre chat, droite fiche persona.
- L’état vide du chat pour le rendre plus proche d’un début de conversation Character.ai.

### À repousser après cette passe

- Voix réelle/TTS.
- Avatars générés définitifs si les assets ne sont pas prêts.
- 3D lourde en react-three-fiber dans toute l’interface.
- Marketplace, feed social, likes, commentaires, système communautaire.

## 4. Problèmes techniques bloquants observés

Avant toute refonte UI sérieuse, corriger les erreurs TypeScript.

J’ai testé :

- `npm run lint` : passe avec seulement 3 warnings.
- `npm run typecheck` : échoue.
- `npm run build` avec variables env factices : pas validé, timeout pendant l’optimisation Next dans l’environnement de test. Le build doit être retesté localement après correction typecheck.

Erreurs typecheck principales :

1. Tests `src/app/api/agents/route.test.ts` et `src/app/api/sessions/route.test.ts` : les mocks `AgentRecord` n’ont pas `interview_guide`.
2. `src/app/components/InterviewAnalysisContent.tsx` : tuple array inféré comme `string | string[]`, donc `key={title}` invalide.
3. `src/app/components/InterviewGridPanel.tsx` : `Dialog.Root placement="end"` incompatible avec Chakra v3 attendu.
4. `src/app/profile/page.tsx` : typage de l’icône `React.ElementType` trop large, provoque `never` sur props.
5. `src/components/ui/rich-text-editor-control.tsx` : props `IconButton` / dynamic props trop strictes.

Critère avant design :

```bash
npm run typecheck
npm run lint
```

Les deux doivent passer.

## 5. Direction artistique cible

### Sensation générale

Mimesis doit donner l’impression de :

- Character.ai pour la navigation, les cartes et la conversation.
- Un outil universitaire sérieux pour le vocabulaire, l’analyse et l’export.
- Une expérience de terrain simulé, pas un site vitrine marketing.

### Style

- Fond : gris/ivoire très clair, proche app moderne.
- Surfaces : blanc, gris doux, borders légères.
- Accent : un bleu profond / indigo Mimesis, utilisé avec retenue.
- Pas de gradients partout.
- Ombres profondes mais propres sur les cartes personas.
- Coins très arrondis.
- Micro-animations courtes : 150–250 ms.
- Cartes personas avec profondeur, hover 3D léger, shine subtil, avatar visible.

### À éviter

- Trop de badges multicolores.
- Trop de sections marketing sur la home.
- Trop de blobs/gradients qui donnent un rendu “template IA”.
- Trop d’éléments académiques affichés en même temps dans le chat.
- 3D lourde si elle ralentit ou fragilise le build.

## 6. Phase 0 — Stabilisation technique

Objectif : projet prêt à être modifié et déployé.

Tâches :

1. Corriger les erreurs TypeScript listées ci-dessus.
2. Ne pas changer le comportement métier.
3. Corriger les warnings lint faciles si possible.
4. Lancer :

```bash
npm run typecheck
npm run lint
```

5. Si les deux passent, commit local recommandé :

```bash
git add .
git commit -m "fix typecheck before ui polish"
```

Ne pas push sans autorisation.

## 7. Phase 1 — Design system Mimesis x Character.ai

Objectif : poser une base visuelle claire avant de modifier les pages.

Tâches :

1. Dans `src/app/globals.css`, nettoyer/renforcer les tokens existants :
   - `--color-bg`
   - `--color-surface`
   - `--color-surface-muted`
   - `--color-text-primary`
   - `--color-text-muted`
   - `--color-border`
   - `--color-accent`
   - ombres `sm/md/lg/card/float`
2. Garder une palette calme : fond ivoire/gris, surface blanche, accent indigo/bleu.
3. Ajouter des classes utilitaires simples pour :
   - `.mimesis-app-shell`
   - `.persona-card-tilt`
   - `.persona-card-shine`
   - `.soft-scrollbar`
4. Ne pas créer un design system énorme.

Critère de succès : les futures pages peuvent réutiliser les mêmes tokens, sans mélanger 10 styles différents.

## 8. Phase 2 — App sidebar inspirée Character.ai

Objectif : rapprocher les zones principales de Character.ai avec une vraie sidebar.

Créer ou refactorer un composant :

```txt
src/app/components/MimesisAppSidebar.tsx
```

Contenu sidebar desktop :

- Logo Mimesis
- Bouton principal : “Nouvel entretien” ou “Créer un persona” selon contexte
- Navigation :
  - Découvrir
  - Mes entretiens
  - Guide
  - Analyse / exports si pertinent
  - Admin seulement si rôle admin
- Recherche compacte si utile
- Historique récent en bas ou sous la nav
- Profil utilisateur en bas

Règles :

- Ne pas supprimer le `Header` global partout immédiatement.
- Sur `/personnas` et `/interview`, privilégier une expérience sidebar.
- Si le Header entre en conflit visuel, masquer ou réduire son impact sur ces pages via classes/layout existants.
- Mobile : sidebar transformée en top compact ou drawer simple.

Critère de succès : quand on ouvre `/personnas` ou `/interview`, on doit sentir une app de conversation/personas, pas seulement une landing page.

## 9. Phase 3 — Refonte de `/personnas` en discovery feed

Objectif : page la plus proche visuellement de Character.ai, adaptée à Mimesis.

Fichier principal :

```txt
src/app/personnas/page.tsx
```

Composant principal à refondre visuellement :

```txt
src/app/personnas/components/AgentCard.tsx
```

Structure cible :

- Sidebar à gauche.
- Header central : “Welcome back” / “Choisir un enquêté virtuel”.
- Barre de recherche large et douce en haut.
- Filtres en pills, très discrets.
- Grille de grandes cartes verticales type character cards.
- Cartes par persona avec avatar/visuel fort.

Carte persona cible :

- Grand visuel ou avatar en haut.
- Nom du persona.
- Auteur/type discret.
- Courte accroche narrative, pas trop longue.
- Badges méthodologiques : difficulté, thème, statut.
- Actions visibles mais pas lourdes :
  - commencer
  - fiche
  - historique si existant
  - prompt/admin si autorisé
- Hover 3D léger : tilt, ombre, brillance subtile.

Implémentation 3D recommandée :

- Utiliser `framer-motion` + CSS perspective.
- Ne pas utiliser react-three-fiber pour les cartes dans cette phase, sauf si vraiment nécessaire.
- Ajouter un effet spatial léger : `transform: perspective(...) rotateX(...) rotateY(...) translateY(...)`.
- Garder l’animation subtile et performante.

Avatars :

- Ne pas rester uniquement sur des initiales.
- Créer un mapping visuel temporaire dans un fichier du type :

```txt
src/lib/personaVisuals.ts
```

Ce fichier peut associer `oriane`, `theo`, `jade` à :

- gradient de fond
- icône/emoji abstrait ou initiale améliorée
- futur chemin d’image local `public/personas/oriane.webp`
- tonalité visuelle

Si aucun asset image n’est disponible, utiliser des avatars CSS premium, pas des initiales plates.

Critère de succès : la page doit ressembler à une bibliothèque vivante de personnages, pas à un tableau admin.

## 10. Phase 4 — Refonte de l’écran d’entretien

Objectif : chat plus proche de Character.ai, mais avec les outils Mimesis.

Fichiers probables :

```txt
src/app/components/InterviewLayout.tsx
src/app/components/InterviewSidebar.tsx
src/components/ChatMessage.tsx
src/components/MessageInput.tsx
src/app/components/InterviewGridPanel.tsx
```

Structure desktop cible :

```txt
[left sidebar historique] [chat central] [right persona panel]
```

Centre chat :

- Top header avec avatar + nom persona + statut.
- Zone conversation plus aérée.
- Messages assistant : bulles gris clair / blanc, style lecture.
- Messages utilisateur : bulles gris plus foncé ou accent très discret, pas gros gradient violet.
- Input bottom proche Character.ai : champ large arrondi, bouton send circulaire.
- État vide : avatar persona, phrase d’ouverture, suggestions de questions.

Right persona panel :

- Avatar/visuel persona.
- Nom + rôle.
- Description courte.
- Niveau de difficulté.
- Thèmes de la grille.
- Bouton “Voir la grille”.
- Bouton “Générer / Voir analyse” si messages existants.
- Export PDF / Google Docs si disponible.

Important :

- Ne pas faire disparaître l’analyse pédagogique.
- La rendre moins intrusive dans le chat : soit dans le right panel, soit en drawer/collapsible plus propre.
- Garder l’historique et les stats, mais pas sous forme trop dashboard.

Critère de succès : le prof doit pouvoir tester un entretien et ressentir une vraie expérience de persona, tout en voyant la valeur pédagogique Mimesis.

## 11. Phase 5 — Home page

Objectif : ne pas passer trop de temps sur la home, mais la rendre cohérente avec la nouvelle app.

Fichier :

```txt
src/app/page.tsx
```

Décision : la home ne doit pas devenir plus importante que l’app.

À faire :

- Garder l’identité Mimesis et l’explication pédagogique.
- Réduire les effets trop “landing page IA” si nécessaire.
- Mettre plus haut un aperçu de cartes/personas type Character.ai.
- Garder 1 ou 2 sections pédagogiques maximum avant CTA.
- Ne pas refaire tout le contenu.

Critère de succès : la home explique Mimesis, mais l’utilisateur comprend vite qu’il doit choisir une persona et commencer un entretien.

## 12. Phase 6 — QA visuel + responsive

Tester manuellement :

- `/`
- `/login`
- `/personnas`
- `/personnas/[id]`
- `/personnas/[id]/edit`
- `/personnas/[id]/grille`
- `/interview?...`
- `/interviews`
- `/guide-entretien`
- `/profile`

Vérifier :

- Desktop 1440px.
- Laptop 1280px.
- Mobile 390px.
- Pas de scroll horizontal.
- Input chat visible.
- Sidebar utilisable.
- Cards pas cassées.
- Aucun texte blanc sur fond clair.
- Les actions importantes restent visibles.

Commandes :

```bash
npm run typecheck
npm run lint
npm run build
```

## 13. Phase 7 — Préparation mise en ligne

Ne pas commencer le déploiement avant que `npm run build` passe localement.

### Frontend

- Vercel recommandé.
- Branch `main` = production.
- Push sur GitHub = redéploiement automatique.

Variables Vercel à prévoir :

```env
NEXT_PUBLIC_SITE_URL=https://URL-VERCEL
NEXT_PUBLIC_SUPABASE_URL=https://SUPABASE-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADK_BASE_URL=https://URL-BACKEND-ADK
BFF_SHARED_SECRET=...
GOOGLE_OAUTH_STATE_SECRET=...
```

### Supabase Cloud

- Créer un projet Supabase Cloud.
- Appliquer migrations/schema.
- Appliquer seed minimal si nécessaire.
- Configurer Auth redirect URLs :
  - URL Vercel
  - URL preview si utilisée
  - localhost pour continuer le dev local

### Backend ADK

- Render ou Railway.
- Déployer l’agent Python séparément.
- Activer CORS pour l’URL Vercel.
- Configurer le même `BFF_SHARED_SECRET` côté frontend/Vercel et backend.
- Vérifier `/health`, `/run`, `/run_sse` selon les endpoints disponibles.

## 14. Ce que Claude Code doit demander avant de faire

Demander validation avant :

- Supprimer une page.
- Renommer une route.
- Changer le schéma Supabase.
- Modifier les API routes métier.
- Ajouter une grosse dépendance.
- Introduire react-three-fiber dans plusieurs composants.
- Modifier les fichiers Docker ou déploiement.

## 15. Prompt de départ à donner à Claude Code

Copier-coller ceci dans Claude Code :

```txt
Lis d’abord AGENTS.md, CLAUDE.md, README.md, docs/recovery/MASTER_RECOVERY_PLAN.md et ce fichier CLAUDE_CODE_PLAN_MIMESIS.md.

Objectif : améliorer fortement l’UI/UX de Mimesis pour se rapprocher de l’expérience Character.ai, sans plagiat et sans perdre la finalité du projet : simulation d’entretien en sciences sociales.

Commence uniquement par la Phase 0 : stabilisation technique. Corrige les erreurs TypeScript actuelles sans changer le comportement métier. Ensuite lance npm run typecheck et npm run lint. Arrête-toi après cette phase et résume précisément les fichiers modifiés. Ne pousse rien sur GitHub.
```

Après validation Phase 0, utiliser :

```txt
Exécute uniquement la Phase 1 et la Phase 2 du plan. Pose une base visuelle Mimesis x Character.ai et crée/adapte une sidebar app. Ne refais pas encore les cartes et le chat. Arrête-toi après cette phase et résume les fichiers modifiés.
```

Puis :

```txt
Exécute uniquement la Phase 3 : refonte de /personnas en discovery feed inspiré Character.ai. Refonds surtout AgentCard visuellement, garde les actions et la logique existantes. Ajoute un hover 3D léger avec framer-motion/CSS, pas de 3D lourde. Arrête-toi après cette phase.
```

Puis :

```txt
Exécute uniquement la Phase 4 : refonte visuelle de l’écran d’entretien. Objectif : chat central immersif + sidebar historique + panneau persona droit. Garde les fonctions existantes : historique, grille, analyse, export, messages, streaming. Arrête-toi après cette phase.
```

## 16. Définition du résultat acceptable

Le résultat est acceptable quand :

- Le site ne ressemble plus à une app admin classique.
- Les personas ont une vraie présence visuelle.
- Le chat donne l’impression de parler à un personnage/enquêté.
- L’identité Mimesis reste claire : entretien, SHS, grille, analyse.
- Les fonctionnalités existantes ne sont pas cassées.
- `npm run typecheck`, `npm run lint`, `npm run build` passent.
- Le projet peut être déployé sur Vercel + Supabase Cloud + backend ADK.

