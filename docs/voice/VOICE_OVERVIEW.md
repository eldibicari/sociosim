# VOICE_OVERVIEW.md

> Vue d'ensemble de la fonctionnalité voix dans Mimesis.
> Récapitule ce qui a été livré (Phases 1, 2, 2b) et ce qui reste à faire (Phase 3, 4).
> Dernière mise à jour : 2026-06-18.

---

## 1. Statut global

| Phase | Description | Statut |
|---|---|---|
| **Phase 1** | Voix de Jade + TTS dans le chat + toggle autoplay | ✅ Livré en prod |
| **Phase 2** | Voix de Théo et Oriane (personas vitrine) | ✅ Livré en prod |
| **Phase 2b** | Audition de voix lors de la création d'un persona utilisateur | ✅ Livré en prod |
| **Phase 3** | Conversation vocale temps réel (micro utilisateur) | ⏳ À démarrer |
| **Phase 4** | Polish Character.ai (waveform, états visuels, avatars animés) | 🔜 Plus tard |

Tout est sur `https://sociosim.vercel.app` (branche `main`).

---

## 2. Phase 1 — Voix de Jade + chat + autoplay

**Livré le 2026-06-17.**

### Décisions
- Provider unique : **ElevenLabs** (plan Creator ~22€/mois, modèle `eleven_multilingual_v2`)
- Voix de Jade : **Victoria — Content Creator** (`O31r762Gb3WFygrEOGh0`)
- Cache audio dans **Supabase Storage** bucket `voice-cache`
- Limite TTS : **2000 caractères** par requête
- Autoplay : **OFF par défaut**, toggle persisté en localStorage

### Architecture
- Colonne `voice_profile` (jsonb) sur la table `agents`
- Route `POST /api/voice/tts` (auth requise, génère + cache + renvoie URL publique)
- Composant `<VoicePlayer />` réutilisable (modes `preview` et `tts`)
- Composant `<ChatMessage />` étendu avec bouton ▶️ sur les messages assistant
- Toggle 🔊/🔇 dans le header de `/interview` (mémorisé)

### Détails opérationnels
- Voir [VOICE_PHASE_1_PLAN.md](VOICE_PHASE_1_PLAN.md) pour le plan complet
- Voir [JADE_VOICE_DECISION.md](JADE_VOICE_DECISION.md) pour le choix éditorial de la voix
- Voir [ELEVENLABS_API_KEY_REFERENCE.md](ELEVENLABS_API_KEY_REFERENCE.md) pour le catalogue des permissions API

---

## 3. Phase 2 — Voix de Théo et Oriane

**Livré le 2026-06-17.**

### Choix de voix
- **Théo** : **Hugo — Warm and Grounded** (`IbbR6Av0dWuQJS0b8JVT`)
- **Oriane** : **Adina** (`FvmvwvObRqIHojkEGh5N`)

### Découverte importante
Lors de cette phase, on a découvert une **incohérence du profil d'Oriane** :
- **Janvier 2026** : Alexis Perrier (commit `7bfa559`) avait défini Oriane comme **étudiante M1 EOS, 22 ans, ENS Paris-Saclay** (prompt en base avec posture nuancée et introspective)
- **Avril 2026** : eldibicari (commit `3924ebe`, avec Claude Sonnet 4.6) avait redéfini son profil-vitrine sur la home page comme **Chargée de mission RH, 34 ans** — sans mettre à jour le prompt système en parallèle
- **Résultat** : l'IA répondait comme une étudiante M1 mais la carte affichait "RH 34 ans"

**Correction appliquée** : on a réaligné le showcase sur la version d'Alexis (étudiante M1 sciences sociales, 22 ans), pour que l'UI et le prompt soient cohérents. La voix d'Adina reste (un peu mature mais acceptable). Cette histoire mérite d'être mentionnée à son tuteur.

### Outils
- Nouveau script générique **`scripts/generate-persona-preview.mjs`** qui remplace l'ancien `generate-jade-preview.mjs` (prend le nom du persona en argument)

---

## 4. Phase 2b — Audition de voix pour les personas utilisateurs

**Livré le 2026-06-18.**

### Objectif
Quand un M2 crée son propre persona via le formulaire `/personnas/new`, il peut **choisir une voix** parmi des candidates intelligentes filtrées selon les attributs sociologiques de son persona.

### Workflow utilisateur
1. M2 remplit le formulaire de création (nom, description, prompt)
2. Une section **"Voix du persona"** apparaît dès que le nom est rempli
3. Le système **auto-détecte** :
   - Le **genre** depuis le prénom (~500 prénoms FR dans une base interne)
   - Le **genre** depuis le prompt (mots-clés "femme", "homme", "il est", "elle est"…)
   - L'**âge** depuis le prompt (regex sur "X ans")
4. Le système affiche un encadré gris listant ce qui a été déduit et pourquoi
5. L'utilisateur peut **override** via deux menus déroulants (Genre + Tranche d'âge)
6. **5 voix candidates** apparaissent automatiquement, triées par score de correspondance
7. Chaque carte voix a un bouton **▶️ instantané** (joue le preview CDN ElevenLabs)
8. L'utilisateur clique **"Choisir cette voix"** → badge "Voix retenue" en haut
9. À la création du persona, la voix est sauvegardée
10. Le **mp3 preview personnalisé** ("Bonjour, je m'appelle [Nom]") est généré en arrière-plan via Next.js `after()` et apparaît sur la carte du persona en 1-3 secondes

### Architecture backend
- **`src/lib/voice/catalog.ts`** : fetch + cache 24h du catalogue ElevenLabs (`/v1/shared-voices`, filtré par langue, max 500 voix)
- **`src/lib/voice/matcher.ts`** : score chaque voix (genre 30pts, âge 18pts, langue 15pts, accent 12pts, ton 8pts)
- **`src/lib/voice/personaInference.ts`** : auto-détection genre/âge depuis prénom et prompt
- **`/api/voice/recommend`** : POST, renvoie top N candidates triées
- **`/api/voice/tts`** étendu : accepte aussi un `voiceId` direct (mode audition sans persona créé)
- **`/api/agents`** étendu : POST sanitize et stocke le `voice_profile`, génère le preview en background

### Architecture frontend
- **`src/components/VoiceAudition.tsx`** : composant à cartes, "Voir 5 autres", audition via `preview_url` CDN
- **`src/components/VoicePlayer.tsx`** : mode `tts` étendu pour supporter `voiceId` direct
- **`src/app/personnas/new/NewPersonnaForm.tsx`** : section voix intégrée, hint des champs requis

### Performances
- **Audition** : instantanée (joue le sample CDN ElevenLabs directement, 0€)
- **Création de persona** : ~5-8s (vs 9-21s avant la déférée), n'inclut plus la génération du preview dans la requête
- **Preview du persona** : apparaît avec 1-3s de délai après création (background `after()`)

---

## 5. Coûts ElevenLabs

Sur le plan Creator (~22€/mois, 100k caractères/mois) :

| Action | Coût en caractères |
|---|---|
| Preview voix sur carte (vitrine, déjà généré) | 0 (joué depuis Supabase Storage) |
| Lecture d'un message dans le chat (1ère fois) | ~200-500 chars |
| Re-lecture du même message | 0 (cache hash) |
| Audition d'une voix candidate (création persona) | 0 (preview CDN ElevenLabs) |
| Génération du preview d'un nouveau persona | ~30 chars (1 phrase) |

**Estimation pour une classe de M2** (20 étudiants × 2-3 personas créés × 5 réponses TTS écoutées) :
- Création des personas : 20×3×30 = 1 800 chars
- TTS du chat : 20×5×500 = 50 000 chars (sans cache)
- Avec cache : probablement 15 000-20 000 chars réels
- **Total : ~20-25% du quota mensuel** → confortable

---

## 6. Fichiers de référence

- [VOICE_PHASE_1_PLAN.md](VOICE_PHASE_1_PLAN.md) — plan détaillé Phase 1
- [JADE_VOICE_DECISION.md](JADE_VOICE_DECISION.md) — choix de Jade
- [ELEVENLABS_API_KEY_REFERENCE.md](ELEVENLABS_API_KEY_REFERENCE.md) — catalogue API
- [VOICE_PHASE_3_PLAN.md](VOICE_PHASE_3_PLAN.md) — plan Phase 3 (à venir)

---

## 7. Limitations connues (à fixer plus tard si besoin)

- **Prononciation noms propres** : Victoria mispronouns "Jade" → activer "Pronunciation Dictionaries" sur la clé API (permission actuellement désactivée). Workaround : preview Jade dit "Jad".
- **Délai preview après création** : 1-3s à cause d'`after()`. Si l'utilisateur va très vite sur `/personnas`, Ctrl+R nécessaire.
- **Build local OOM** : `npm run build` plante sur le PC Windows de l'utilisateur (RAM limitée). Vercel build OK.
- **Profil d'Oriane** : prompt en base = étudiante M1 (Alexis original). Voix Adina = mature. Cohérent mais perfectible (on pourrait re-auditionner une voix plus jeune en Phase 3+).

---

## 8. Prochaines phases

### Phase 3 — Conversation vocale temps réel
Permettre à l'étudiant de **parler au micro** et d'entendre le persona répondre, comme un vrai entretien.
Voir [VOICE_PHASE_3_PLAN.md](VOICE_PHASE_3_PLAN.md) (à venir).

### Phase 4 — Polish Character.ai
Animations waveform, états visuels "écoute/réflexion/parle", éventuellement avatars animés.
À chiffrer plus tard.
