import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: agentId } = await params;
    if (!agentId) {
      return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const agentName = body?.agent_name?.trim();
    const description = body?.description?.trim();

    if (!agentName || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // N'écrase la grille que si elle est explicitement envoyée dans le body
    const updatePayload: Record<string, unknown> = { agent_name: agentName, description };
    if ("interview_guide" in (body ?? {})) {
      const guide = typeof body.interview_guide === "string" ? body.interview_guide.trim() : "";
      updatePayload.interview_guide = guide || null;
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", agentId);

    if (error) {
      const message = error.message ?? "Failed to update agent";
      console.error("[/api/agents/:id PATCH] Error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/agents/:id PATCH] Error:", message);
    return NextResponse.json(
      { error: `Failed to update agent: ${message}` },
      { status: 500 }
    );
  }
}
