-- Add voice_profile column to agents table.
--
-- Stores per-persona voice configuration as JSONB.
-- NULL means "no voice configured yet" (UI shows "Voix bientôt").
--
-- Expected JSON shape:
-- {
--   "provider": "elevenlabs",
--   "voiceId": "<elevenlabs voice id>",
--   "displayName": "Jeune femme calme - parisienne",
--   "language": "fr",
--   "settings": { "stability": 0.5, "similarity_boost": 0.75, "speed": 1.0 },
--   "previewAudioPath": "previews/jade.mp3"
-- }
--
-- See docs/specs and project_voice_phase1 memory for design rationale.

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS voice_profile jsonb;

COMMENT ON COLUMN public.agents.voice_profile IS
'Per-persona voice configuration (provider, voiceId, settings, preview path). NULL = no voice yet.';
