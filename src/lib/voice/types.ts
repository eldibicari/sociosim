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
  /**
   * Override the model used for generation. Useful for the conversation
   * overlay which prefers eleven_flash_v2_5 (low-latency) over the default
   * eleven_multilingual_v2 (higher quality, higher latency).
   */
  modelId?: string;
}

export interface TTSResponseBody {
  audioUrl: string;
  cached: boolean;
}

// ─── Speech-to-Text (Phase 3) ──────────────────────────────────────────

/**
 * STT request body is multipart/form-data with at least a `file` field.
 * We keep this as a documented shape rather than a JSON type since fetch
 * sends FormData directly.
 */
export interface STTResponseBody {
  text: string;
  languageCode?: string;
}

/** Server-side cap for any audio uploaded to /api/voice/stt. */
export const MAX_STT_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

/** Default Scribe model used for transcription. */
export const DEFAULT_SCRIBE_MODEL_ID = "scribe_v2";

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

/** Ultra-low-latency model used in real-time conversation mode. */
export const FAST_ELEVENLABS_MODEL_ID = "eleven_flash_v2_5";
