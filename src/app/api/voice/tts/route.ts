import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";
import { generateSpeech } from "@/lib/voice/elevenlabs";
import {
  buildTtsCachePath,
  computeCacheKey,
  getCachedAudioUrl,
  uploadAudioToCache,
} from "@/lib/voice/cache";
import {
  MAX_TTS_TEXT_LENGTH,
  type TTSRequestBody,
  type TTSResponseBody,
  type VoiceProfile,
} from "@/lib/voice/types";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[/api/voice/tts] ELEVENLABS_API_KEY is not configured");
      return NextResponse.json(
        { error: "Voice provider is not configured" },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as TTSRequestBody | null;
    const agentId = body?.agentId?.trim();
    const text = body?.text?.trim();

    if (!agentId || !text) {
      return NextResponse.json(
        { error: "Missing agentId or text" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TTS_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text exceeds maximum length of ${MAX_TTS_TEXT_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, voice_profile")
      .eq("id", agentId)
      .maybeSingle();

    if (agentError) {
      console.error("[/api/voice/tts] Agent lookup failed:", agentError.message);
      return NextResponse.json(
        { error: "Failed to load agent" },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const voiceProfile = agent.voice_profile as VoiceProfile | null;
    if (!voiceProfile?.voiceId) {
      return NextResponse.json(
        { error: "No voice configured for this agent" },
        { status: 404 }
      );
    }

    const hash = computeCacheKey(voiceProfile.voiceId, text);
    const cachePath = buildTtsCachePath(voiceProfile.voiceId, hash);

    const cachedUrl = await getCachedAudioUrl(supabase, cachePath);
    if (cachedUrl) {
      const response: TTSResponseBody = { audioUrl: cachedUrl, cached: true };
      return NextResponse.json(response, { status: 200 });
    }

    const audio = await generateSpeech({
      apiKey,
      voiceId: voiceProfile.voiceId,
      text,
      modelId: voiceProfile.modelId,
      voiceSettings: voiceProfile.settings,
    });

    const audioUrl = await uploadAudioToCache(supabase, cachePath, audio);

    const response: TTSResponseBody = { audioUrl, cached: false };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/voice/tts] Error:", message);
    return NextResponse.json(
      { error: `Failed to generate speech: ${message}` },
      { status: 500 }
    );
  }
}
