import { NextRequest, NextResponse } from "next/server";
import { interviews, messages } from "@/lib/data";
import { analyzeInterviewMessages } from "@/lib/interviewAnalysis";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { parseInterviewGrid } from "@/lib/interviewGridParser";
import type { GridTheme } from "@/lib/personaConfig";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

/**
 * GET /api/interviews/analysis?interviewId=...
 * Returns a simple pedagogical analysis of the interview material.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json(
        { error: "Missing 'interviewId' query parameter" },
        { status: 400 }
      );
    }

    const interview = await interviews.getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const [interviewMessages, interviewWithUsage] = await Promise.all([
      messages.getInterviewMessages(interviewId),
      interviews.getInterviewWithUsage(interviewId),
    ]);

    // Charger la grille du persona si disponible
    let gridThemes: GridTheme[] | undefined;
    if (interview.agent_id) {
      const supabase = createServiceSupabaseClient();
      const { data: agent } = await supabase
        .from("agents")
        .select("interview_guide")
        .eq("id", interview.agent_id)
        .single();
      const parsed = parseInterviewGrid(agent?.interview_guide ?? "");
      if (parsed && parsed.themes.length > 0) {
        gridThemes = parsed.themes;
      }
    }

    const analysis = analyzeInterviewMessages(
      interviewMessages,
      {
        totalInputTokens: interviewWithUsage.usage?.total_input_tokens ?? 0,
        totalOutputTokens: interviewWithUsage.usage?.total_output_tokens ?? 0,
      },
      gridThemes
    );

    return NextResponse.json(
      {
        interview: {
          id: interview.id,
          status: interview.status,
        },
        analysis,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/interviews/analysis GET] Error:", message);
    return NextResponse.json(
      { error: `Failed to load interview analysis: ${message}` },
      { status: 500 }
    );
  }
}
