import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_SCRIBE_MODEL_ID,
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

// ─── Speech-to-Text (Scribe) ───────────────────────────────────────────

export interface TranscribeAudioParams {
  apiKey: string;
  audio: Blob | File;
  modelId?: string;
  /** Optional ISO 639-1 / 639-3 language hint (e.g. "fra", "fr"). */
  languageCode?: string;
  /** Optional filename hint (default "audio.webm"). */
  filename?: string;
}

export interface TranscribeAudioResult {
  text: string;
  languageCode?: string;
}

/**
 * Call ElevenLabs Scribe Speech-to-Text and return the transcribed text.
 * Throws with a descriptive message on any non-2xx response.
 */
export async function transcribeAudio({
  apiKey,
  audio,
  modelId,
  languageCode,
  filename,
}: TranscribeAudioParams): Promise<TranscribeAudioResult> {
  const url = `${ELEVENLABS_API_BASE}/speech-to-text`;
  const form = new FormData();
  form.append("model_id", modelId ?? DEFAULT_SCRIBE_MODEL_ID);
  if (languageCode) form.append("language_code", languageCode);
  form.append("file", audio, filename ?? "audio.webm");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs STT failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as {
    text?: string;
    language_code?: string;
    language_probability?: number;
  };

  return {
    text: (data.text ?? "").trim(),
    languageCode: data.language_code,
  };
}
