import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { participantId, name } = await request.json();
    const cleanName = String(name ?? "").trim().replace(/\s+/g, " ");

    if (!participantId || cleanName.length < 2 || cleanName.length > 60) {
      return NextResponse.json({ error: "Ongeldige bestemming." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: game } = await supabase
      .from("games")
      .select("status")
      .eq("slug", "holiday")
      .single();

    if (game?.status !== "open") {
      return NextResponse.json({ error: "De poll is gesloten." }, { status: 409 });
    }

    const { data: participant } = await supabase
      .from("participants")
      .select("id,finalized_at")
      .eq("browser_id", participantId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Vul eerst je naam in." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("destinations")
      .insert({
        name: cleanName,
        normalized_name: cleanName.toLocaleLowerCase("nl-BE"),
        created_by: participant.id,
      })
      .select("id,name")
      .single();

    if (error?.code === "23505") {
      const existing = await supabase
        .from("destinations")
        .select("id,name")
        .eq("normalized_name", cleanName.toLocaleLowerCase("nl-BE"))
        .single();

      return NextResponse.json({ destination: existing.data });
    }

    if (error) throw error;
    return NextResponse.json({ destination: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
