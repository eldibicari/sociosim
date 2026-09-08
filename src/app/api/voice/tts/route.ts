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
  DEFAULT_ELEVENLABS_MODEL_ID,
  MAX_TTS_TEXT_LENGTH,
  type TTSRequestBody,
  type TTSResponseBody,
  type VoiceProfile,
} from "@/lib/voice/types";

const KNOWN_MODELS = new Set([
  "eleven_multilingual_v2",
  "eleven_flash_v2_5",
  "eleven_turbo_v2_5",
  "eleven_multilingual_v1",
]);

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
    const directVoiceId = body?.voiceId?.trim();
    const text = body?.text?.trim();
    const requestedModelId = body?.modelId?.trim();
    // Reject unknown model ids to avoid forwarding garbage to ElevenLabs.
    const overrideModelId =
      requestedModelId && KNOWN_MODELS.has(requestedModelId)
        ? requestedModelId
        : undefined;

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    if (!agentId && !directVoiceId) {
      return NextResponse.json(
        { error: "Provide either agentId or voiceId" },
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

    // Resolve voiceId + voice settings.
    let voiceId: string;
    let modelId: string | undefined;
    let settings: VoiceProfile["settings"] | undefined;

    if (agentId) {
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
      voiceId = voiceProfile.voiceId;
      modelId = voiceProfile.modelId;
      settings = voiceProfile.settings;
    } else {
      // Audition mode — voiceId provided directly, no persisted agent.
      voiceId = directVoiceId as string;
      modelId = DEFAULT_ELEVENLABS_MODEL_ID;
      settings = {
        stability: 0.5,
        similarity_boost: 0.75,
      };
    }

    // Caller can override the model (e.g. flash for the conversation overlay).
    if (overrideModelId) modelId = overrideModelId;

    // Cache key isolates models so flash and multilingual outputs do not
    // collide. We omit the suffix when using the default model, keeping
    // pre-existing cache entries valid.
    const effectiveModel = modelId ?? DEFAULT_ELEVENLABS_MODEL_ID;
    const cacheModelSuffix =
      effectiveModel === DEFAULT_ELEVENLABS_MODEL_ID
        ? undefined
        : effectiveModel;
    const hash = computeCacheKey(voiceId, text, cacheModelSuffix);
    const cachePath = buildTtsCachePath(voiceId, hash);

    const cachedUrl = await getCachedAudioUrl(supabase, cachePath);
    if (cachedUrl) {
      const response: TTSResponseBody = { audioUrl: cachedUrl, cached: true };
      return NextResponse.json(response, { status: 200 });
    }

    const audio = await generateSpeech({
      apiKey,
      voiceId,
      text,
      modelId,
      voiceSettings: settings,
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
