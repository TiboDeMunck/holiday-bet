import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json({ error: "Deelnemer ontbreekt." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id,finalized_at")
      .eq("browser_id", participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: "Deelnemer niet gevonden." }, { status: 404 });
    }

    if (participant.finalized_at) {
      return NextResponse.json({ ok: true, alreadyFinalized: true });
    }

    const { count, error: betError } = await supabase
      .from("bets")
      .select("id", { count: "exact", head: true })
      .eq("participant_id", participant.id);

    if (betError) throw betError;
    if (!count) {
      return NextResponse.json(
        { error: "Plaats minstens één inzet voor je opslaat." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("participants")
      .update({ finalized_at: new Date().toISOString() })
      .eq("id", participant.id)
      .is("finalized_at", null);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
