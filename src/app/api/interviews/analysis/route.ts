import { NextRequest, NextResponse } from "next/server";
import { interviews, messages } from "@/lib/data";
import { analyzeInterviewMessages } from "@/lib/interviewAnalysis";

/**
 * GET /api/interviews/analysis?interviewId=...
 * Returns a simple pedagogical analysis of the interview material.
 */
export async function GET(request: NextRequest) {
  try {
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

    const analysis = analyzeInterviewMessages(interviewMessages, {
      totalInputTokens: interviewWithUsage.usage?.total_input_tokens ?? 0,
      totalOutputTokens: interviewWithUsage.usage?.total_output_tokens ?? 0,
    });

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
