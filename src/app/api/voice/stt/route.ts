import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";
import { transcribeAudio } from "@/lib/voice/elevenlabs";
import {
  MAX_STT_AUDIO_BYTES,
  type STTResponseBody,
} from "@/lib/voice/types";

/**
 * POST /api/voice/stt
 *
 * Accepts multipart/form-data with a `file` field containing the recorded
 * audio (webm/opus, mp3, m4a, wav, ogg...). Forwards to ElevenLabs Scribe
 * (`/v1/speech-to-text`) and returns the French transcription text.
 *
 * Why a fixed `language_code: "fra"`: Mimesis is a French-language project,
 * the personas speak French, and even student attempts in another language
 * should be normalized to French for the chat. Scribe auto-detect works,
 * but pinning the language gives more reliable output for short utterances.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[/api/voice/stt] ELEVENLABS_API_KEY is not configured");
      return NextResponse.json(
        { error: "Voice provider is not configured" },
        { status: 503 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : "Invalid form body";
      return NextResponse.json(
        { error: `Could not parse multipart body: ${message}` },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing audio file under 'file' field" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 }
      );
    }

    if (file.size > MAX_STT_AUDIO_BYTES) {
      const mb = Math.round(file.size / 1024 / 1024);
      const capMb = Math.round(MAX_STT_AUDIO_BYTES / 1024 / 1024);
      return NextResponse.json(
        { error: `Audio file too large (${mb}MB > ${capMb}MB)` },
        { status: 400 }
      );
    }

    const result = await transcribeAudio({
      apiKey,
      audio: file,
      languageCode: "fra",
      filename: (file as File).name || "audio.webm",
    });

    const response: STTResponseBody = {
      text: result.text,
      languageCode: result.languageCode ?? "fra",
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/voice/stt] Error:", message);
    return NextResponse.json(
      { error: `Failed to transcribe audio: ${message}` },
      { status: 500 }
    );
  }
}
