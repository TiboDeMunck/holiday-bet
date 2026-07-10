import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { participantId, destinationId, amount } = await request.json();
    const numericAmount = Number(amount);

    if (
      !participantId ||
      !destinationId ||
      !Number.isInteger(numericAmount) ||
      numericAmount < 1 ||
      numericAmount > 20
    ) {
      return NextResponse.json({ error: "Ongeldige inzet." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: game } = await supabase
      .from("games")
      .select("status")
      .eq("slug", "holiday")
      .single();

    if (game?.status !== "open") {
      return NextResponse.json({ error: "De inzetten zijn gesloten." }, { status: 409 });
    }

    const { data: participant } = await supabase
      .from("participants")
      .select("id,finalized_at")
      .eq("browser_id", participantId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Vul eerst je naam in." }, { status: 401 });
    }

    const { data: existingBet, error: existingBetError } = await supabase
      .from("bets")
      .select("id,amount")
      .eq("participant_id", participant.id)
      .eq("destination_id", destinationId)
      .maybeSingle();

    if (existingBetError) throw existingBetError;

    if (existingBet && numericAmount <= existingBet.amount) {
      return NextResponse.json(
        {
          error: `Je vorige inzet was ${existingBet.amount}. Je kan die alleen verhogen.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("bets")
      .upsert(
        {
          participant_id: participant.id,
          destination_id: destinationId,
          amount: numericAmount,
        },
        { onConflict: "participant_id,destination_id" }
      )
      .select("id,amount")
      .single();

    if (error) throw error;

    if (participant.finalized_at) {
      const { error: resetError } = await supabase
        .from("participants")
        .update({ finalized_at: null })
        .eq("id", participant.id);
      if (resetError) throw resetError;
    }

    return NextResponse.json({ bet: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
