import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabaseServiceClient";

const FEATURED_NAMES = ["jade", "oriane", "theo"] as const;

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("agents")
      .select("id, agent_name, description")
      .in("agent_name", FEATURED_NAMES)
      .eq("active", true);

    if (error) {
      console.error("[/api/home/featured]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Tri dans l'ordre souhaité : jade, oriane, theo
    const ordered = FEATURED_NAMES
      .map((name) => data?.find((a) => a.agent_name === name))
      .filter(Boolean);

    return NextResponse.json({ personas: ordered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
