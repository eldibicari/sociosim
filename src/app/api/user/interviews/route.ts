import { NextRequest, NextResponse } from "next/server";
import { interviews } from "@/lib/data";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

/**
 * GET /api/user/interviews?userId=...
 * Returns interviews for the authenticated user, or another user only if admin.
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    console.log("[/api/user/interviews GET] Received userId:", requestedUserId);

    const supabase = createServiceSupabaseClient();
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      const message = userError.message ?? "Failed to load user role";
      console.error("[/api/user/interviews GET] User role error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const isAdmin = userRecord?.role === "admin";
    const targetUserId = isAdmin && requestedUserId ? requestedUserId : user.id;
    console.log(
      "[/api/user/interviews GET] Fetching interviews for:",
      isAdmin ? "admin" : "user",
      targetUserId
    );

    const userInterviews = isAdmin
      ? await interviews.getAllInterviewsWithMessages()
      : await interviews.getUserInterviewsWithMessages(targetUserId);

    console.log(
      "[/api/user/interviews GET] Successfully loaded",
      userInterviews.length,
      "interviews"
    );

    return NextResponse.json(
      { success: true, interviews: userInterviews },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/user/interviews GET] Error:", message);

    return NextResponse.json(
      { error: `Failed to load interviews: ${message}` },
      { status: 500 }
    );
  }
}
