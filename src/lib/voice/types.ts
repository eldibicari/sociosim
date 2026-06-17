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
  agentId: string;
  text: string;
}

export interface TTSResponseBody {
  audioUrl: string;
  cached: boolean;
}

export const VOICE_CACHE_BUCKET = "voice-cache";

export const MAX_TTS_TEXT_LENGTH = 600;

export const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";
