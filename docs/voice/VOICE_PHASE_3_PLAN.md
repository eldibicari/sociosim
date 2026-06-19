# VOICE_PHASE_3_PLAN.md

> Plan détaillé de la Phase 3 du système de voix Mimesis : **conversation vocale temps réel** (l'étudiant parle au micro, le persona répond à voix haute).
> Lire en premier : [VOICE_OVERVIEW.md](VOICE_OVERVIEW.md).
> Date de création : 2026-06-18.

---

## 1. Contexte

Les Phases 1, 2 et 2b sont en prod. L'étudiant peut écouter la voix de Jade/Théo/Oriane sur leurs cartes, entendre leurs réponses dans le chat (TTS), et créer ses propres personas avec sélection de voix par audition.

**Ce qui manque** : l'étudiant doit encore **taper au clavier** pour parler au persona. C'est une rupture avec l'expérience d'entretien réel. La Phase 3 résout ça.

**Objectif** : permettre à l'étudiant de **parler dans le micro** comme dans un vrai entretien, et que le persona réponde **à voix haute**, avec une latence acceptable.

---

## 2. Décision d'architecture : Option C (hybride)

### Pourquoi pas Option A (pipeline simple)
- Latence 3-5s par tour de parole
- Trop lent, casse la fluidité conversationnelle
- L'étudiant attend, le persona attend, ça ne ressemble plus à un entretien

### Pourquoi pas Option B (OpenAI Realtime API)
- Imposerait d'utiliser les voix d'OpenAI
- On perdrait Victoria/Hugo/Adina et toute la diversité ElevenLabs
- Investissement sur ElevenLabs (plan Creator 22€/mois) gaspillé
- L'identité vocale unique des personas est le cœur de Mimesis
- **Sera mentionnée dans la doc finale comme alternative considérée** (pour montrer la réflexion architecturale au tuteur)

### Pourquoi Option C (hybride)
- **STT** : Gemini Audio Input (free tier + free credit) — transcription rapide
- **LLM (réponse persona)** : ADK Agent Service existant (Gemini) — aucune modif
- **TTS** : ElevenLabs en mode streaming — voix préservées
- **File audio côté client** : on joue les morceaux dès qu'ils arrivent → latence ~1-1,5s

### Diagramme du flux

```
┌──────────────┐
│ Micro user   │
│ (Web Audio)  │
└──────┬───────┘
       │ blob audio (~2-5s)
       ▼
┌──────────────────────┐
│ POST /api/voice/stt  │
│ (envoie à Gemini)    │
└──────┬───────────────┘
       │ texte transcrit
       ▼
┌──────────────────────────┐
│ POST /api/interviews/... │ (route existante)
│ ADK → Gemini → réponse   │
└──────┬───────────────────┘
       │ stream texte phrase par phrase
       ▼
┌──────────────────────────┐
│ POST /api/voice/tts-stream│
│ (ElevenLabs streaming)   │
└──────┬───────────────────┘
       │ stream audio (chunks mp3)
       ▼
┌──────────────────────┐
│ Client AudioQueue    │
│ (joue chunks dès     │
│  qu'ils arrivent)    │
└──────────────────────┘
```

---

## 3. Stratégie de livraison incrémentale

On découpe en **6 morceaux**, chacun donne un état stable et testable. Si le 5 (streaming) s'avère trop tricky, on s'arrête au 4 et on a déjà une conversation vocale fonctionnelle.

### Morceau 1 — Capture micro + UI minimal
**Quoi** : un bouton micro dans `/interview`. Appuyé → enregistre l'audio. Relâché → s'arrête.
**Comment** : `MediaRecorder` API (intégré au navigateur, pas de lib).
**Fichiers nouveaux** :
- `src/components/MicCapture.tsx` — composant React avec état (idle / recording / stopped)
**Fichiers modifiés** :
- `src/app/components/InterviewLayout.tsx` — ajoute le bouton micro dans le header
**Test à la fin** : tu appuies, tu parles, tu vois un indicateur "🎤 enregistrement…", tu relâches, l'audio est dans le state local.
**Pas de backend, pas de TTS, juste la capture.**
**Durée estimée** : ~2h
**Risque** : bas (API standard navigateur)

### Morceau 2 — Route STT côté serveur
**Quoi** : nouvelle route qui reçoit l'audio enregistré et renvoie la transcription.
**Comment** : appel à Gemini Audio Input avec `inlineData` (audio en base64) + prompt simple "transcris cet audio en français".
**Fichiers nouveaux** :
- `src/lib/voice/gemini.ts` — client minimal Gemini (juste pour l'audio)
- `src/app/api/voice/stt/route.ts` — route POST
**Fichiers modifiés** :
- `src/lib/voice/types.ts` — types STT
- `.env.local.example` — documenter `GOOGLE_API_KEY`
**Test à la fin** : on envoie un blob audio via curl ou via le bouton micro du morceau 1, on récupère du texte français.
**Durée estimée** : ~1h
**Risque** : bas (API REST simple Gemini)

### Morceau 3 — Brancher la transcription dans le chat
**Quoi** : quand on relâche le micro, on transcrit, on injecte le texte transcrit dans le chat comme si l'étudiant l'avait tapé.
**Comment** : l'`MicCapture` appelle `/api/voice/stt`, récupère le texte, déclenche `onSendMessage` (handler existant de `InterviewLayout`).
**Fichiers modifiés** :
- `src/components/MicCapture.tsx` — onSendTranscription callback
- `src/app/components/InterviewLayout.tsx` — connecter le callback
- `src/app/interview/[id]/page.tsx` et `src/app/interview/page.tsx` — vérifier que ça marche
**Test à la fin** : tu cliques micro, tu parles, tu relâches, le texte apparaît dans le chat, Jade répond en texte normal.
**Durée estimée** : ~1h
**Risque** : bas (juste plomberie)

### Morceau 4 — Lecture automatique de la réponse en mode conversation
**Quoi** : quand le persona répond après une transcription micro, lecture audio automatique (TTS non-streamé pour l'instant).
**Comment** : ajouter un état `conversationMode` dans `InterviewLayout`. Quand actif et qu'une réponse arrive, on déclenche `autoplay` sur le dernier message.
**Fichiers modifiés** :
- `src/app/components/InterviewLayout.tsx` — mode conversation (différent du toggle autoplay)
- éventuellement `src/components/MicCapture.tsx` — désactiver le bouton micro pendant que Jade parle
**Test à la fin** : tu parles, tu relâches, Jade répond, sa réponse se joue automatiquement (latence 3-5s = Option A déguisée).
**Durée estimée** : ~1h
**Risque** : bas
**À ce stade** : c'est déjà fonctionnel. La conversation vocale marche, juste pas optimisée. **Point de stabilité.**

### Morceau 5 — Streaming TTS (le gros morceau)
**Quoi** : au lieu d'attendre la fin de la réponse complète, on stream phrase par phrase pour réduire la latence à ~1-1,5s.
**Comment** :
- Backend : modifier la route TTS pour utiliser l'endpoint streaming ElevenLabs (`/v1/text-to-speech/{voice_id}/stream`) qui retourne des chunks audio en SSE ou chunked transfer
- Frontend : `AudioContext` + `AudioBufferSourceNode` pour jouer les chunks au fur et à mesure, file d'attente pour le séquencement
- Découper la réponse en phrases (regex sur `.!?`) avant d'envoyer au TTS, pour optimiser le délai du premier son
**Fichiers nouveaux** :
- `src/lib/voice/audioQueue.ts` — gestion de la file de chunks audio côté client
- `src/app/api/voice/tts-stream/route.ts` — version streaming de TTS
**Fichiers modifiés** :
- `src/components/VoicePlayer.tsx` — éventuellement nouveau mode `stream`
- `src/app/components/InterviewLayout.tsx` — utiliser le streaming en mode conversation
**Test à la fin** : Jade commence à parler ~1s après ta fin de phrase, et continue à parler pendant que les phrases suivantes sont synthétisées.
**Durée estimée** : ~3-4h
**Risque** : moyen-haut (le streaming audio côté client est tricky, l'AudioContext a des subtilités)
**Fallback** : si trop tricky, on garde le morceau 4 (non-streamé), on a quand même une conversation vocale fonctionnelle.

### Morceau 6 — Polish + erreurs + animations
**Quoi** : 
- États visuels clairs : "🎤 J'écoute…" / "🤔 Jade réfléchit…" / "🗣️ Jade parle…" / "🟢 À toi"
- Gestion des permissions micro refusées
- Bouton "interrompre Jade" si elle parle trop longtemps
- Indicateur waveform basique pendant l'enregistrement
- Animations subtiles entre les états
**Fichiers modifiés** :
- `src/components/MicCapture.tsx` — états visuels
- `src/app/components/InterviewLayout.tsx` — orchestration des états
- `src/app/globals.css` — animations
**Durée estimée** : ~2h
**Risque** : bas

---

## 4. Récap durée totale et stratégie

| Morceau | Durée | Cumul |
|---|---|---|
| 1. Capture micro + UI | 2h | 2h |
| 2. Route STT | 1h | 3h |
| 3. Transcription dans le chat | 1h | 4h |
| 4. Autoplay en mode conversation | 1h | 5h |
| 5. Streaming TTS | 3-4h | 8-9h |
| 6. Polish | 2h | 10-11h |

**Total : ~10-11h** = 2-3 sessions de demi-journée, ou 1 grosse journée si on enchaîne.

**Stratégie** : on fait morceau par morceau, je commit après chaque morceau réussi, on teste sur preview Vercel à chaque fois. Si le morceau 5 (streaming) galère, on s'arrête au 4 et la conversation vocale fonctionne quand même (juste avec 3-5s de latence).

---

## 5. Décisions techniques précises

### 5.1 Capture micro
- Format audio : **WebM/Opus** par défaut (supporté navigateurs modernes, bonne compression, accepté par Gemini)
- Échantillonnage : **16 kHz** suffisant pour la voix (Whisper et Gemini optimisés pour ça)
- Push-to-talk au début : on garde simple. Plus tard on pourra ajouter détection de silence automatique.

### 5.2 Gemini STT
- **Modèle** : `gemini-2.0-flash` (rapide, gratuit en quota dev, supporte audio)
- **Input** : audio inline base64 (la blob enregistrée)
- **Prompt** : *"Transcris cet enregistrement audio en français. Ne réponds que par la transcription, sans introduction ni commentaire."*
- **Coût** : ~0,01-0,02 $ par minute audio sur paid tier. Free tier généreux pour le dev.

### 5.3 ElevenLabs streaming
- Endpoint : `POST /v1/text-to-speech/{voice_id}/stream`
- Réponse : audio/mpeg en chunked transfer encoding
- Côté client : on consomme le ReadableStream, on fait des AudioBuffer
- **À vérifier en live** : la doc ElevenLabs streaming via WebFetch pour confirmer les paramètres exacts

### 5.4 Sécurité
- Permissions micro demandées au navigateur (HTTPS requis — déjà OK sur Vercel)
- Limite de durée d'enregistrement : 60 secondes max (sinon Gemini bouffe trop de tokens)
- Limite de taille du blob : 5 MB max
- Toutes les routes restent **auth requise** (utilisateur Supabase connecté)

### 5.5 Coûts estimés
Pour une session d'entretien typique de 30 min avec ~20 échanges :
- STT Gemini : 30 min × 0,015 $/min = 0,45 $
- TTS ElevenLabs : ~20 réponses × 500 chars = 10 000 chars (déjà dans le quota Creator)
- **Total : ~0,50 $ par entretien complet**

Pour une classe de 20 étudiants × 1 entretien chacun = ~10 $/mois sur Gemini en plus du plan ElevenLabs. **Confortable.**

---

## 6. Risques et mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Audio mal capté (bruit ambiant) | Moyenne | Pas de gestion sophistiquée en Phase 3 — l'utilisateur s'adapte. Phase 4 peut ajouter noise gate. |
| Gemini transcrit en anglais par erreur | Faible | Prompt explicite "en français" + langue détectée par Gemini |
| ElevenLabs streaming hang | Moyenne | Timeout client 30s, fallback à TTS non-streamé |
| Permissions micro refusées | Élevée (1ère fois) | UI claire qui explique pourquoi et comment réactiver |
| Conflit avec le streaming text du chat existant | Faible | Garder les deux flux séparés, le mode conversation est opt-in |
| Audio queue glitches (chunks dans le désordre) | Moyenne | Numérotation des chunks, validation de l'ordre côté client |
| Quota Gemini dépassé | Faible (dev) / Moyenne (prod classe) | Surveiller en début de prod, passer en paid si besoin |

---

## 7. Variables d'environnement à ajouter

`.env.local` (dev) ET Vercel (Production + Preview) :

```
GOOGLE_API_KEY=...
```

On va aussi mettre à jour `.env.local.example` pour documenter cette nouvelle var.

---

## 8. Ce qui ne sera PAS fait en Phase 3

À garder pour Phase 4 :
- Détection automatique de fin de parole (silence detection)
- Interruption naturelle (parler par dessus Jade)
- Animation waveform pendant que le persona parle
- Avatar animé synchro lèvres
- Multi-langue (on reste 100% français)
- Mode "appel téléphonique" avec UI fullscreen

---

## 9. Documents liés

- [VOICE_OVERVIEW.md](VOICE_OVERVIEW.md) — résumé complet phases livrées
- [VOICE_PHASE_1_PLAN.md](VOICE_PHASE_1_PLAN.md) — plan historique Phase 1
- [JADE_VOICE_DECISION.md](JADE_VOICE_DECISION.md) — choix éditorial de Jade
- [ELEVENLABS_API_KEY_REFERENCE.md](ELEVENLABS_API_KEY_REFERENCE.md) — catalogue API

---

## 10. État courant

**Au 2026-06-18 (création de ce document) :**

- Branche active : `feat/voice-phase-3`
- Aucun code voix Phase 3 encore écrit
- Aucune clé Gemini configurée
- Plan validé (Option C confirmée par l'utilisateur)
- Prochaine action utilisateur : récupérer une clé Gemini sur https://aistudio.google.com/apikey

**À la reprise** : on attaque le morceau 1 (capture micro). Le reste suit dans l'ordre, un morceau par session courte si besoin.

---

## 11. Pour Codex ou tout autre agent qui reprend

1. **Lis CE document en premier**, puis `VOICE_OVERVIEW.md`, puis `CLAUDE.md`.
2. **Ne saute pas les morceaux** — on construit incrémental pour pouvoir s'arrêter sans casser ce qui marche.
3. **Ne lance jamais** d'action qui consomme beaucoup de quota Gemini sans validation utilisateur.
4. **Travaille par petites sessions** (PC à RAM limitée — cf. mémoire `feedback-method`).
5. **Teste sur preview Vercel** entre chaque morceau, ne merge dans `main` qu'à la fin de Phase 3 complète (ou au morceau 4 si on s'arrête là).
6. **Ne push pas** vers `main` sans demande explicite de l'utilisateur.
