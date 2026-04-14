import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";
import { getAuthenticatedUser } from "@/lib/supabaseAuthServer";

/**
 * GET /api/user/role
 * Returns the role for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[/api/user/role GET] Error:", error.message);
      return NextResponse.json(
        { error: `Failed to load role: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ role: data?.role ?? null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/user/role GET] Error:", message);

    return NextResponse.json(
      { error: `Failed to load role: ${message}` },
      { status: 500 }
    );
  }
}
