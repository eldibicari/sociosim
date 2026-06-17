import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { VOICE_CACHE_BUCKET, type VoiceProfile } from "@/lib/voice/types";

const FEATURED_NAMES = ["jade", "oriane", "theo"] as const;

type FeaturedPersona = {
  id: string;
  agent_name: string;
  description: string | null;
  preview_audio_url: string | null;
};

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("agents")
      .select("id, agent_name, description, voice_profile")
      .in("agent_name", FEATURED_NAMES)
      .eq("active", true);

    if (error) {
      console.error("[/api/home/featured]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ordered: FeaturedPersona[] = FEATURED_NAMES.map((name) => {
      const row = data?.find((a) => a.agent_name === name);
      if (!row) return null;
      const voiceProfile = row.voice_profile as VoiceProfile | null;
      const previewPath = voiceProfile?.previewAudioPath ?? null;
      const previewAudioUrl = previewPath
        ? supabase.storage.from(VOICE_CACHE_BUCKET).getPublicUrl(previewPath).data.publicUrl
        : null;
      return {
        id: row.id,
        agent_name: row.agent_name,
        description: row.description,
        preview_audio_url: previewAudioUrl,
      };
    }).filter((p): p is FeaturedPersona => p !== null);

    return NextResponse.json({ personas: ordered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
