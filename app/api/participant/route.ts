import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const { participantId, name } = await request.json();
    const cleanName = String(name ?? "").trim();

    if (!participantId || cleanName.length < 2 || cleanName.length > 40) {
      return NextResponse.json({ error: "Ongeldige naam." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("participants")
      .upsert(
        {
          browser_id: participantId,
          name: cleanName,
          ip_address: getClientIp(request),
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "browser_id" }
      )
      .select("id,name,finalized_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ participant: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
