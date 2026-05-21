/**
 * Get all messages for an interview
 * GET /api/interviews/[id]/messages
 *
 * Returns all messages for an interview across all sessions,
 * ordered chronologically.
 */

import { NextRequest, NextResponse } from "next/server";
import { interviews, messages } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: interviewId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user.id;

    // Enforce that user can only request their own messages
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: user mismatch" }, { status: 403 });
    }

    if (!interviewId) {
      return NextResponse.json(
        { error: "Missing interview ID" },
        { status: 400 }
      );
    }

    const interview = await interviews.getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Load all messages
    const interviewMessages = await messages.getInterviewMessages(interviewId, userId);

    return NextResponse.json(
      {
        success: true,
        messages: interviewMessages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/interviews/[id]/messages GET] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load messages: ${errorMessage}` },
      { status: 500 }
    );
  }
}
