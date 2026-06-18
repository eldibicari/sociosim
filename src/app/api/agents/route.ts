import { after, NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAgentsWithPromptStatus, getPublishedAgents } from "@/lib/data/agents";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";
import { canViewAgent } from "@/lib/agentPolicy";
import { generateSpeech } from "@/lib/voice/elevenlabs";
import { VOICE_CACHE_BUCKET, type VoiceProfile } from "@/lib/voice/types";

function slugifyName(name: string): string {
  // Strip diacritics (accents), keep ASCII letters/digits, replace others with -
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return slug || "persona";
}

/**
 * Generate and store the persona's preview audio. Runs in the background
 * after the agent has been created so the client response is not blocked.
 * Never throws — failures are logged but invisible to the user.
 */
async function generateAndStorePersonaPreview(opts: {
  supabase: SupabaseClient;
  agentId: string;
  agentName: string;
  voiceProfile: VoiceProfile;
  apiKey: string;
}): Promise<void> {
  const { supabase, agentId, agentName, voiceProfile, apiKey } = opts;
  try {
    const slug = slugifyName(agentName);
    const previewPath = `previews/${slug}.mp3`;
    const previewText = `Bonjour, je m'appelle ${agentName}.`;
    const audioBuffer = await generateSpeech({
      apiKey,
      voiceId: voiceProfile.voiceId,
      text: previewText,
      modelId: voiceProfile.modelId,
      voiceSettings: voiceProfile.settings,
    });
    const { error: uploadError } = await supabase.storage
      .from(VOICE_CACHE_BUCKET)
      .upload(previewPath, Buffer.from(audioBuffer), {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (uploadError) {
      console.error(
        "[/api/agents POST] preview upload failed:",
        uploadError.message
      );
      return;
    }
    const updatedVoiceProfile = {
      ...voiceProfile,
      previewAudioPath: previewPath,
    };
    const { error: updateError } = await supabase
      .from("agents")
      .update({ voice_profile: updatedVoiceProfile })
      .eq("id", agentId);
    if (updateError) {
      console.error(
        "[/api/agents POST] preview path update failed:",
        updateError.message
      );
    }
  } catch (previewError) {
    const msg =
      previewError instanceof Error ? previewError.message : "unknown";
    console.error("[/api/agents POST] preview generation failed:", msg);
  }
}

function sanitizeVoiceProfile(input: unknown): VoiceProfile | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const voiceId = typeof raw.voiceId === "string" ? raw.voiceId.trim() : "";
  if (!voiceId) return null;
  const provider = raw.provider === "elevenlabs" ? "elevenlabs" : "elevenlabs";
  const displayName =
    typeof raw.displayName === "string" && raw.displayName.trim()
      ? raw.displayName.trim()
      : "Voix";
  const language =
    typeof raw.language === "string" && raw.language.trim()
      ? raw.language.trim()
      : "fr";
  const modelId =
    typeof raw.modelId === "string" && raw.modelId.trim()
      ? raw.modelId.trim()
      : undefined;
  const settingsRaw =
    raw.settings && typeof raw.settings === "object"
      ? (raw.settings as Record<string, unknown>)
      : {};
  const settings = {
    stability: typeof settingsRaw.stability === "number" ? settingsRaw.stability : 0.5,
    similarity_boost:
      typeof settingsRaw.similarity_boost === "number"
        ? settingsRaw.similarity_boost
        : 0.75,
    style: typeof settingsRaw.style === "number" ? settingsRaw.style : undefined,
    use_speaker_boost:
      typeof settingsRaw.use_speaker_boost === "boolean"
        ? settingsRaw.use_speaker_boost
        : undefined,
    speed: typeof settingsRaw.speed === "number" ? settingsRaw.speed : undefined,
  };
  const previewAudioPath =
    typeof raw.previewAudioPath === "string" && raw.previewAudioPath.trim()
      ? raw.previewAudioPath.trim()
      : undefined;
  return {
    provider,
    voiceId,
    displayName,
    language,
    modelId,
    settings,
    previewAudioPath,
  };
}

/**
 * GET /api/agents?published=true&template=false
 * Returns all agents, optionally filtered to published-only and/or template filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") === "true";
    const templateParam = searchParams.get("template");
    const templateFilter =
      templateParam === "true" ? "only" : templateParam === "false" ? "exclude" : undefined;

    const supabase = createServiceSupabaseClient();
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      const message = userError.message ?? "Failed to load user role";
      console.error("[/api/agents GET] Role error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const role = userRecord?.role ?? null;

    const agents = publishedOnly
      ? (await getPublishedAgents(templateFilter)).map((agent) => ({
          ...agent,
          has_published_prompt: true,
        }))
      : await getAgentsWithPromptStatus(templateFilter);

    const visibleAgents = agents.filter((agent) => canViewAgent(role, user.id, agent));

    return NextResponse.json({ success: true, agents: visibleAgents }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/agents GET] Error:", message);

    return NextResponse.json(
      { error: `Failed to load agents: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents
 * Creates an agent and its initial prompt.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const agentName = body?.agent_name?.trim();
    const description = body?.description?.trim();
    const interviewGuide =
      typeof body?.interview_guide === "string" ? body.interview_guide.trim() : "";
    const systemPrompt = body?.system_prompt?.trim();
    const voiceProfile = sanitizeVoiceProfile(body?.voice_profile);

    if (!agentName || !description || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        agent_name: agentName,
        description,
        interview_guide: interviewGuide || null,
        created_by: user.id,
        voice_profile: voiceProfile,
      })
      .select("id")
      .single();

    if (agentError || !agentData?.id) {
      const message = agentError?.message ?? "Failed to create agent";
      console.error("[/api/agents POST] Error:", message);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    const { error: promptError } = await supabase
      .from("agent_prompts")
      .insert({
        agent_id: agentData.id,
        system_prompt: systemPrompt,
        edited_by: user.id,
        version: 1,
        published: true,
      });

    if (promptError) {
      const message = promptError.message || "Failed to create agent prompt";
      console.error("[/api/agents POST] Error:", message);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // ─── Generate the persona's preview audio in the background ───
    // We defer this with after() so the client gets its response as soon
    // as the agent + prompt are saved. The preview will be available a
    // few seconds later when the user lands on /personnas (a refresh may
    // be needed if the user is very quick).
    if (voiceProfile) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (apiKey) {
        after(() =>
          generateAndStorePersonaPreview({
            supabase,
            agentId: agentData.id,
            agentName,
            voiceProfile,
            apiKey,
          })
        );
      } else {
        console.warn(
          "[/api/agents POST] ELEVENLABS_API_KEY missing — skipping preview generation"
        );
      }
    }

    return NextResponse.json({ id: agentData.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/agents POST] Error:", message);
    return NextResponse.json(
      { error: `Failed to create agent: ${message}` },
      { status: 500 }
    );
  }
}
