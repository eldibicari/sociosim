# JADE_VOICE_DECISION.md

> Documentation du processus de choix de la voix de Jade pour Mimesis.
> Créé le 2026-06-17 dans le cadre de la Phase 1 voix.

---

## 1. Pourquoi cette doc existe

La voix de Jade n'est pas un détail technique — c'est un **choix éditorial et sociologique**. Elle fait partie de l'identité de Jade au même titre que son âge, son milieu social ou son parcours.

Ce document trace :
- Les **critères** qu'on a utilisés pour la sélection
- Les **voix candidates** auditionnées
- Le **processus d'audition** (script reproductible)
- La **décision finale** + justification
- L'**historique** des changements éventuels

---

## 2. Le profil sociologique de Jade

Rappel rapide (depuis [src/app/page.tsx](../../src/app/page.tsx) et données existantes) :

- **Nom** : Jade
- **Âge** : 26 ans
- **Profil** : étudiante en master de droit
- **Posture** : utilisatrice critique de l'IA
- **Difficulté** : exigeante (échange poussé attendu)
- **Style** : posé, lucide, légèrement méfiant, exigeant intellectuellement
- **Greeting actuel** : *"Je lis tout ce qui sort sur ces outils. Le vrai problème ? Personne ne réfléchit vraiment à ce qu'il fait avec."*

---

## 3. Critères de sélection de la voix

| Critère | Pourquoi |
|---|---|
| **Genre : féminin** | Jade est une femme |
| **Tranche d'âge : young adult (20-30)** | Cohérence avec ses 26 ans |
| **Langue : français natif ou multilingue fluide** | Mimesis est en français, accent étranger serait incongru |
| **Ton : posé, naturel, conversationnel** | Pas une voix de narration épique ni de speakerine |
| **Expressivité : modérée** | Pas trop neutre (sinon robotique), pas trop expressive (Jade est réservée et critique) |
| **Qualité technique : voix premium si possible** | Plan Creator donne accès aux voix premium ElevenLabs |

---

## 4. Voix candidates auditionnées

Trois voix d'ElevenLabs ont été pré-sélectionnées pour l'audition :

| Nom | Voice ID | Description ElevenLabs |
|---|---|---|
| **Charlotte** | `XB0fDUnXU5powFXDhCwa` | Young female, calm, multilingual, conversational |
| **Sarah** | `EXAVITQu4vr4xnSDxMaL` | Young soft female, warm, narration-friendly |
| **Lily** | `pFZP5JQG7iQjIQuC4Bku` | Young female, expressive, warm |

Ces 3 voix sont des **voix par défaut** d'ElevenLabs (disponibles sur tous les plans). Elles fonctionnent bien en français avec le modèle `eleven_multilingual_v2`.

### Pourquoi ces 3 et pas d'autres ?
- ElevenLabs propose des centaines de voix → impossible de toutes les auditionner
- Ces 3 sont des défauts éprouvés en français
- Elles couvrent un spectre : Charlotte (calme/posée), Sarah (douce/chaleureuse), Lily (expressive)
- Si aucune ne convient → l'utilisateur peut explorer la Voice Library d'ElevenLabs et proposer d'autres candidats

---

## 5. Texte d'audition

La même phrase est générée pour chaque voix candidate. Le texte représente **ce que Jade pourrait dire dès le début d'un entretien** :

> *"Bonjour, je m'appelle Jade. J'ai vingt-six ans, je suis en master de droit. Je lis tout ce qui sort sur ces outils. Le vrai problème, c'est que personne ne réfléchit vraiment à ce qu'il fait avec."*

**Longueur** : ~190 caractères × 3 voix = ~570 caractères au total (≈ 0,5% du quota mensuel Creator).

---

## 6. Processus d'audition (reproductible)

### Script utilisé
[scripts/audition-jade-voices.mjs](../../scripts/audition-jade-voices.mjs)

Le script :
1. Lit la clé `ELEVENLABS_API_KEY` depuis `.env.local`
2. Pour chaque voix candidate, appelle l'API ElevenLabs TTS avec le texte d'audition
3. Sauvegarde les MP3 dans `tmp/voice-auditions/` (dossier git-ignored)
4. Affiche les fichiers générés

### Comment l'exécuter
```bash
node scripts/audition-jade-voices.mjs
```

### Comment écouter
- Ouvrir le dossier `tmp/voice-auditions/` dans l'explorateur Windows
- Double-cliquer sur chaque `.mp3` pour le jouer dans Windows Media Player / Groove
- Ou utiliser VLC, Firefox, etc.

---

## 7. Décision finale

**Statut** : ✅ Décidée le 2026-06-17

**Voix retenue** : **Victoria — Content Creator** (depuis le ElevenLabs Voice Library, hors candidates initiales du script d'audition)

**Voice ID** : `O31r762Gb3WFygrEOGh0`

**Nom complet dans le Voice Library** : Victoria - Content Creator

**Justification du choix** :
L'utilisateur a exploré le ElevenLabs Voice Library en parallèle des 3 candidates initiales (Charlotte, Sarah, Lily) et a sélectionné Victoria, jugée plus adaptée au profil de Jade (jeune femme, française, posée, posture critique d'étudiante en master).

**Paramètres ElevenLabs choisis** :
```json
{
  "stability": 0.5,
  "similarity_boost": 0.75,
  "style": 0,
  "use_speaker_boost": true
}
```

**Modèle** : `eleven_multilingual_v2`

---

## 8. Comment changer la voix de Jade plus tard

Si tu veux changer la voix de Jade après cette première décision :

### Étape 1 — Choisir une nouvelle voix
- Soit en relançant le script d'audition avec d'autres `voiceId`
- Soit en explorant la Voice Library sur https://elevenlabs.io/app/voice-lab
- Soit en clonant une voix réelle (Phase ultérieure, hors scope Phase 1)

### Étape 2 — Mettre à jour la DB
Dans le SQL Editor Supabase :
```sql
UPDATE public.agents
SET voice_profile = jsonb_set(
  COALESCE(voice_profile, '{}'::jsonb),
  '{voiceId}',
  to_jsonb('NOUVEAU_VOICE_ID'::text)
)
WHERE agent_name = 'jade';
```

### Étape 3 — Re-générer le preview
Relancer le script de génération du preview (à venir en sous-étape G2).

### Étape 4 — Vider le cache pour les anciennes générations
Soit :
- Supprimer le dossier `tts/{ancien_voiceId}/` dans le bucket Supabase Storage
- Soit le laisser : il ne sera juste plus consulté (le nouveau hash sera différent)

### Étape 5 — Mettre à jour cette doc
Ajouter une entrée dans la section 9 (historique).

---

## 9. Historique des décisions

| Date | Voice ID | Voix | Décision | Note |
|---|---|---|---|---|
| 2026-06-17 | `O31r762Gb3WFygrEOGh0` | Victoria — Content Creator | Initial | Choix Phase 1, depuis Voice Library |

---

## 10. Références

- [VOICE_PHASE_1_PLAN.md](VOICE_PHASE_1_PLAN.md) — Plan général voix
- [ELEVENLABS_API_KEY_REFERENCE.md](ELEVENLABS_API_KEY_REFERENCE.md) — Référence API
- [ElevenLabs Voice Library](https://elevenlabs.io/app/voice-lab) — Catalogue officiel
- [ElevenLabs Default Voices](https://elevenlabs.io/docs/api-reference/voices) — Doc API voices
