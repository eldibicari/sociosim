import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";
import { getVoiceCatalog } from "@/lib/voice/catalog";
import { rankVoices } from "@/lib/voice/matcher";
import type {
  PersonaVoiceAttributes,
  RecommendRequestBody,
  RecommendResponseBody,
  VoiceCandidate,
} from "@/lib/voice/types";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("[/api/voice/recommend] ELEVENLABS_API_KEY missing");
      return NextResponse.json(
        { error: "Voice provider is not configured" },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as RecommendRequestBody | null;
    const attrs: PersonaVoiceAttributes = body?.attributes ?? {};
    const limit = Math.max(1, Math.min(body?.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
    const offset = Math.max(0, body?.offset ?? 0);

    const language = attrs.language ?? "fr";
    const catalog = await getVoiceCatalog(apiKey, language);
    const ranked = rankVoices(catalog, attrs);

    const slice: VoiceCandidate[] = ranked.slice(offset, offset + limit);
    const response: RecommendResponseBody = {
      candidates: slice,
      totalMatching: ranked.filter((v) => v.score > 0).length,
      hasMore: offset + limit < ranked.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/voice/recommend] Error:", message);
    return NextResponse.json(
      { error: `Failed to recommend voices: ${message}` },
      { status: 500 }
    );
  }
}
