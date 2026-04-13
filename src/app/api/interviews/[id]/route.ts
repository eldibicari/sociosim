import { NextRequest, NextResponse } from "next/server";
import { interviews } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

/**
 * DELETE /api/interviews/[id]
 * Deletes an interview owned by the authenticated user.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: interviewId } = await params;
    if (!interviewId) {
      return NextResponse.json({ error: "Missing interview ID" }, { status: 400 });
    }

    const deleted = await interviews.deleteInterviewForUser(interviewId, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Entretien introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[/api/interviews/[id] DELETE] Error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete interview: ${message}` },
      { status: 500 }
    );
  }
}
