/**
 * Voice feature types.
 * See docs/voice/VOICE_PHASE_1_PLAN.md for design rationale.
 */

export type VoiceProvider = "elevenlabs";

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  speed?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface VoiceProfile {
  provider: VoiceProvider;
  voiceId: string;
  displayName: string;
  language: string;
  modelId?: string;
  settings: VoiceSettings;
  previewAudioPath?: string;
}

export interface TTSRequestBody {
  // Either provide an agentId (resolves voiceId from agent.voice_profile)
  // or provide a voiceId directly (audition mode, no persisted agent needed).
  agentId?: string;
  voiceId?: string;
  text: string;
}

export interface TTSResponseBody {
  audioUrl: string;
  cached: boolean;
}

// ─── Voice catalog & audition ──────────────────────────────────────────

export interface CatalogVoice {
  voiceId: string;
  name: string;
  category?: string;
  description?: string;
  previewUrl?: string;
  language?: string;
  gender?: string;
  age?: string;
  accent?: string;
  useCase?: string;
  /** Free-form descriptor labels from ElevenLabs */
  labels?: Record<string, string>;
}

/** Attributes used to recommend candidate voices for a persona. */
export interface PersonaVoiceAttributes {
  /** "M", "F", "NB", "M-leaning", "F-leaning" or free-form */
  gender?: string;
  /** rough age in years */
  age?: number;
  /** ISO-like or free-form: "fr", "fr-CA", "fr-MA", etc. */
  language?: string;
  /** free-form descriptor: "Marseille", "Quebec", "Algerien", "neutre" */
  accent?: string;
  /** "conversational" | "narration" | "casual" | etc. */
  tone?: string;
  /** "soutenu" | "courant" | "familier" | "argotique" */
  register?: string;
}

export interface VoiceCandidate extends CatalogVoice {
  /** Score 0-100, higher = better match */
  score: number;
  /** Human-readable reason summary (in French) */
  matchReasons: string[];
}

export interface RecommendRequestBody {
  attributes: PersonaVoiceAttributes;
  /** Number of top results to return (default 5, max 20) */
  limit?: number;
  /** Skip the first N best results (for "see more" pagination) */
  offset?: number;
}

export interface RecommendResponseBody {
  candidates: VoiceCandidate[];
  totalMatching: number;
  hasMore: boolean;
}

export const VOICE_CACHE_BUCKET = "voice-cache";

export const MAX_TTS_TEXT_LENGTH = 2000;

export const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";
