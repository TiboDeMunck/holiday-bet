import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
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
        { browser_id: participantId, name: cleanName },
        { onConflict: "browser_id" }
      )
      .select("id,name")
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
