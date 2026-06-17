import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  type VoiceSettings,
} from "./types";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export interface GenerateSpeechParams {
  apiKey: string;
  voiceId: string;
  text: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
}

/**
 * Call ElevenLabs Text-to-Speech API and return raw MP3 bytes.
 * Throws with a descriptive message on any non-2xx response.
 */
export async function generateSpeech({
  apiKey,
  voiceId,
  text,
  modelId,
  voiceSettings,
}: GenerateSpeechParams): Promise<ArrayBuffer> {
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`;

  const body: Record<string, unknown> = {
    text,
    model_id: modelId ?? DEFAULT_ELEVENLABS_MODEL_ID,
  };
  if (voiceSettings) {
    body.voice_settings = voiceSettings;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`
    );
  }

  return response.arrayBuffer();
}
