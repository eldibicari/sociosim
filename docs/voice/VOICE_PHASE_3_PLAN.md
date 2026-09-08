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
- **STT** : ElevenLabs Scribe (`/v1/speech-to-text`) — réutilise la même clé API, ≤5% WER en français, $0.40/heure
- **LLM (réponse persona)** : ADK Agent Service existant (Gemini) — aucune modif
- **TTS conversation mode** : ElevenLabs streaming avec **`eleven_flash_v2_5`** (~75ms inférence, <500ms end-to-end)
- **TTS chat texte (mode actuel)** : on garde `eleven_multilingual_v2` (meilleure qualité, latence pas critique)
- **File audio côté client** : on joue les chunks dès qu'ils arrivent

### Avantage clé du choix ElevenLabs Scribe
**Une seule clé API** pour tout le pipeline voix (TTS + STT). Pas de nouvelle variable d'env, pas de nouveau fournisseur, architecture cohérente.

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
**Comment** : appel à `POST /v1/speech-to-text` d'ElevenLabs avec `file` (audio binaire) + `model_id: "scribe_v2"`. La même clé `ELEVENLABS_API_KEY` est réutilisée.
**Fichiers nouveaux** :
- `src/app/api/voice/stt/route.ts` — route POST
**Fichiers modifiés** :
- `src/lib/voice/elevenlabs.ts` — ajoute une fonction `transcribeAudio()`
- `src/lib/voice/types.ts` — ajoute les types STT (request/response)
**Test à la fin** : on envoie un blob audio via curl ou via le bouton micro du morceau 1, on récupère du texte français.
**Durée estimée** : ~1h
**Risque** : bas (API REST simple, clé déjà configurée)

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

### 5.2 ElevenLabs Scribe (STT)
- **Endpoint** : `POST https://api.elevenlabs.io/v1/speech-to-text`
- **Modèle** : `scribe_v2` (qualité maximale) — alternative `scribe_v1`
- **Input** : champ `file` (binaire) — formats acceptés : tous les formats audio majeurs (mp3, wav, webm, opus, m4a)
- **Auth** : header `xi-api-key` avec notre `ELEVENLABS_API_KEY` (déjà configurée)
- **Qualité français** : ≤5% WER (excellente précision)
- **Coût** : $0.40 par heure d'audio transcrit (~0,2c par minute)
- **Limites** : audio entre 100ms et 5GB

### 5.3 ElevenLabs streaming TTS (mode conversation)
- **Endpoint** : `POST /v1/text-to-speech/{voice_id}/stream`
- **Modèle critique** : **`eleven_flash_v2_5`** (~75ms inférence, <500ms end-to-end)
- **Pourquoi Flash** : c'est le modèle le plus rapide d'ElevenLabs, conçu pour les use cases temps réel comme la nôtre
- **Réponse** : audio/mpeg en chunked transfer encoding
- **Côté client** : on consomme le ReadableStream, on alimente une file `AudioBuffer` séquencée
- **TTS chat texte normal** : on garde `eleven_multilingual_v2` (meilleure qualité, latence pas critique)

### 5.4 Sécurité
- Permissions micro demandées au navigateur (HTTPS requis — déjà OK sur Vercel)
- Limite de durée d'enregistrement : 60 secondes max (sinon Gemini bouffe trop de tokens)
- Limite de taille du blob : 5 MB max
- Toutes les routes restent **auth requise** (utilisateur Supabase connecté)

### 5.5 Coûts estimés
Pour une session d'entretien typique de 30 min avec ~20 échanges :
- STT ElevenLabs Scribe : 30 min × $0.40/h = **~0,20 $**
- TTS ElevenLabs (Flash en mode conversation) : ~20 réponses × 500 chars = 10 000 chars (dans le quota Creator)
- **Total : ~0,20 $ par entretien complet**

Pour une classe de 20 étudiants × 1 entretien chacun = ~4 $/mois en plus du plan ElevenLabs Creator. **Très confortable.**

**Avantage** : pas de nouveau compte/fournisseur à gérer pour la facturation.

---

## 6. Risques et mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Audio mal capté (bruit ambiant) | Moyenne | Pas de gestion sophistiquée en Phase 3 — l'utilisateur s'adapte. Phase 4 peut activer ElevenLabs Audio Isolation (déjà autorisé sur la clé). |
| Scribe transcrit dans la mauvaise langue | Faible | Modèle `scribe_v2` détecte la langue automatiquement. Si problème, on peut forcer via paramètre `language_code: "fra"`. |
| ElevenLabs streaming hang | Moyenne | Timeout client 30s, fallback à TTS non-streamé |
| Permissions micro refusées | Élevée (1ère fois) | UI claire qui explique pourquoi et comment réactiver |
| Conflit avec le streaming text du chat existant | Faible | Garder les deux flux séparés, le mode conversation est opt-in |
| Audio queue glitches (chunks dans le désordre) | Moyenne | Numérotation des chunks, validation de l'ordre côté client |
| Quota ElevenLabs dépassé | Faible (Scribe = $0.40/h, pas dans le quota chars) | STT facturé séparément, surveillance via dashboard ElevenLabs |

---

## 7. Variables d'environnement

**Aucune nouvelle variable à ajouter** — on réutilise `ELEVENLABS_API_KEY` qui est déjà configurée dans `.env.local` et sur Vercel pour les Phases précédentes.

**Permission à activer côté ElevenLabs** (déjà faite par l'utilisateur le 2026-06-19) :
- **Speech to Text** : Access ✅
- (Bonus activées proactivement par l'utilisateur : Pronunciation Dictionaries, Audio Isolation, Forced Alignment, History — voir `ELEVENLABS_API_KEY_REFERENCE.md`)

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
