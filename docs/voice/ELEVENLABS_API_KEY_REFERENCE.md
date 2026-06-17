# ELEVENLABS_API_KEY_REFERENCE.md

> Référence complète des permissions disponibles pour une clé API ElevenLabs, telles que vues sur l'interface au 2026-06-16.
> Document à consulter si on veut :
> - **Activer un nouveau service** (modifier la clé existante ou en créer une nouvelle)
> - **Comprendre les risques** de chaque permission
> - **Documenter l'usage Mimesis** pour la traçabilité

---

## 1. Notre clé Mimesis actuelle — permissions activées

Configuration utilisée en Phase 1 (2026-06-16) :

| Endpoint | Permission | Pourquoi |
|---|---|---|
| **Text to Speech** | ✅ Access | Cœur du système : générer la voix des personas |
| **Voices** | ✅ Read | Lister les voix disponibles dans le catalogue |
| **Models** | ✅ Access | Choisir le modèle TTS (eleven_multilingual_v2, etc.) |
| **Tout le reste** | ❌ No Access | Principe de moindre privilège |

**Limite d'usage** : 30 000 crédits/mois max sur cette clé (configurable dans l'interface).

---

## 2. Catalogue complet des endpoints disponibles

### Section "Endpoints" (services principaux)

| Endpoint | Options | Usage | Mimesis utilise ? | Risque si actif |
|---|---|---|---|---|
| **Text to Speech** | No Access / Access | Générer un audio à partir d'un texte (le cœur du TTS) | ✅ Oui — Phase 1 | Consommation crédits si la clé leak |
| **Speech to Speech** | No Access / Access | Transformer une voix existante en une autre voix (voice conversion) | ❌ Non | Consommation crédits |
| **Speech to Text** | No Access / Access | Transcrire de l'audio en texte (STT, l'inverse de TTS) | ❌ Non (Phase 3 si on fait du micro utilisateur) | Consommation crédits |
| **Sound Effects** | No Access / Access | Générer des effets sonores à partir d'un prompt textuel | ❌ Non | Consommation crédits |
| **Audio Isolation** | No Access / Access | Isoler la voix d'un audio (enlever bruit de fond, musique, etc.) | ❌ Non | Consommation crédits |
| **Music Generation** | No Access / Access | Générer de la musique à partir d'un prompt | ❌ Non | Consommation crédits (cher) |
| **Dubbing** | No Access / Read / Write | Doublage audio multi-langue | ❌ Non | Read : voir doublages existants. Write : créer/modifier |
| **ElevenAgents** | No Access / Read / Write | Agents conversationnels ElevenLabs (concurrent de notre architecture) | ❌ Non (on a notre propre stack ADK) | Write : créer des agents qui consomment des crédits |
| **Projects** | No Access / Read / Write | Studio projects (livres audio, longs contenus) | ❌ Non | Write : créer des projets, consommer crédits |
| **Audio Native** | No Access / Read / Write | Lecteur audio embarquable pour sites web (équivalent d'un widget) | ❌ Non | Write : créer des players |
| **Voices** | No Access / Read / Write | Catalogue des voix : Read = lister/écouter, Write = ajouter/supprimer | ✅ Read uniquement | Read : aucun. Write : supprimer des voix |
| **Voice Generation** | No Access / Access | Générer/cloner une voix (Voice Cloning) | ❌ Non | Cher en crédits + voix clonée = données sensibles |
| **Forced Alignment** | No Access / Access | Aligner un texte sur un audio (timing mot-à-mot, sous-titres précis) | ❌ Non (utile si on fait des sous-titres synchros plus tard) | Consommation crédits |

### Section "Administration" (gestion compte / workspace)

| Endpoint | Options | Usage | Mimesis utilise ? | Risque si actif |
|---|---|---|---|---|
| **History** | No Access / Read / Write | Historique des générations TTS faites avec cette clé | ❌ Non (notre cache Supabase suffit) | Read : lire historique. Write : effacer historique (couvrir des traces) |
| **Models** | No Access / Access | Lister les modèles TTS disponibles | ✅ Access | Lecture seule, faible |
| **Pronunciation Dictionaries** | No Access / Read / Write | Dictionnaires de prononciation custom (ex: noms propres) | ❌ Non (utile plus tard si Jade prononce mal un nom) | Write : modifier dico = altérer toutes les générations |
| **User** | No Access / Read | Lire les infos du compte (email, plan, etc.) | ❌ Non | Read : exposer infos de compte |
| **Workspace** | No Access / Read / Write | Gestion du workspace (settings d'équipe) | ❌ Non | Write : modifier le workspace |
| **Workspace Analytics** | No Access / Access | Voir les statistiques d'usage du workspace | ❌ Non | Read : visibilité sur l'usage |
| **Webhooks** | No Access / Access | Configurer des webhooks (notifications HTTP) | ❌ Non | Write : rediriger les events vers un attaquant |
| **Service Accounts** | No Access / Access | Créer des comptes de service (clés persistantes) | ❌ Non | 🚨 Critique : créer des backdoors |
| **Group Members** | No Access / Access | Gérer les membres d'un groupe | ❌ Non | Modification d'appartenance |
| **Workspace Members Read** | No Access / Access | Lister les membres du workspace | ❌ Non | Exposer la liste des membres |
| **Workspace Members Invite** | No Access / Access | Inviter de nouveaux membres dans le workspace | ❌ Non | 🚨 Critique : un attaquant s'invite lui-même |
| **Workspace Members Remove** | No Access / Access | Retirer des membres du workspace | ❌ Non | 🚨 Critique : un attaquant te vire de ton propre workspace |
| **Terms of Service Accept** | No Access / Access | Accepter les CGU programmatiquement | ❌ Non | Peu sensible mais inutile |
| **Audit Log Read** | No Access / Access | Lire les logs d'audit | ❌ Non | Lire les logs = info sur l'activité |

---

## 3. Scénarios futurs — quoi activer si on veut faire X

### Si on veut faire **Phase 3 : conversation vocale (micro utilisateur)**
- Activer **Speech to Text** (Access) → pour transcrire la voix de l'étudiant
- Garder **Text to Speech** + **Voices** + **Models** ✅
- Ne PAS activer ElevenAgents (on garde notre propre architecture ADK + LLM)

### Si on veut **cloner notre propre voix** (par ex. clonage de la voix de l'utilisateur ou d'un chercheur réel)
- Activer **Voice Generation** (Access) → ⚠️ cher et données sensibles, à éviter
- Garder **Voices** en Write (pour ajouter la voix clonée au catalogue)
- Considération éthique : consentement explicite obligatoire

### Si on veut **ajouter des sous-titres synchronisés** au moment où Jade parle
- Activer **Forced Alignment** (Access)
- Utile pour accessibilité

### Si on veut **améliorer la prononciation** (par ex. Jade prononce mal "Bourdieu")
- Activer **Pronunciation Dictionaries** (Read + Write) → définir un dico custom

### Si on veut **suivre l'usage en temps réel** depuis l'app Mimesis (dashboard admin)
- Activer **History** (Read) → afficher les dernières générations
- Activer **Workspace Analytics** (Access) → consommation totale

### Si on veut **passer en équipe** (plusieurs chercheurs / profs sur le même compte)
- Activer **Workspace Members Read** (pour lister)
- **NE PAS activer Invite/Remove via API** → faire ça à la main dans l'interface ElevenLabs pour la sécurité

---

## 4. Comment modifier une clé existante

1. Va sur https://elevenlabs.io/app/api/api-keys (ou via menu Profile → API Keys)
2. Trouve ta clé "Mimesis SocioSim — dev local" dans la liste
3. Clique sur les **`...`** (trois points) à droite → **Edit**
4. Modifie les permissions que tu veux
5. Sauvegarde
6. ✅ La clé reste la même (pas besoin de la changer dans `.env.local`)

---

## 5. Comment créer une nouvelle clé (recommandé pour prod)

Si tu déploies Mimesis pour les M2 :
1. Garde ta clé "dev local" pour ton ordi
2. Crée une **2ème clé "Mimesis SocioSim — prod"** avec les mêmes permissions
3. Mets-la dans les variables d'environnement de Vercel (interface web Vercel → Settings → Environment Variables)
4. Avantage : tu peux **révoquer la clé prod** sans casser ton dev local, et vice-versa
5. Tu peux mettre une limite de crédits différente pour la prod (plus haute)

---

## 6. Sécurité — règles d'or

- 🔒 **Jamais commit `.env.local`** dans Git
- 🔒 **Jamais coller la clé** dans un chat, un screenshot, un email, Slack, Discord
- 🔒 **Jamais hardcoder la clé** dans le code source
- 🔒 **Toujours la lire depuis `process.env.ELEVENLABS_API_KEY`** côté serveur uniquement
- 🔒 **Jamais l'exposer côté client** (pas de `NEXT_PUBLIC_ELEVENLABS_API_KEY`)
- 🚨 **Si tu suspectes une fuite** : va sur ElevenLabs → API Keys → révoque immédiatement la clé compromise → crée-en une nouvelle → mets-la à jour dans `.env.local` et Vercel

---

## 7. Comment révoquer une clé

1. Va sur https://elevenlabs.io/app/api/api-keys
2. Trouve la clé compromise
3. Clique sur les `...` → **Delete** ou **Revoke**
4. Confirme
5. ⚠️ Toute application utilisant cette clé arrêtera de fonctionner immédiatement
6. Crée une nouvelle clé et mets-la dans `.env.local` + Vercel

---

## 8. Documents liés

- [VOICE_PHASE_1_PLAN.md](VOICE_PHASE_1_PLAN.md) — Plan général de la fonctionnalité voix
- [.env.local.example](../../.env.local.example) — Template des variables d'environnement
- [CLAUDE.md](../../CLAUDE.md) — Règles du repo (notamment section Secrets)

---

## 9. Notes

- Cette interface ElevenLabs peut évoluer dans le temps. Si tu vois de nouveaux endpoints qui ne sont pas listés ici, mets à jour ce doc.
- Les noms d'endpoints peuvent légèrement changer selon la langue/région ElevenLabs.
- Les prix par endpoint sont consultables sur https://elevenlabs.io/pricing
