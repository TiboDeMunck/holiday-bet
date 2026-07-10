import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const participantId = request.nextUrl.searchParams.get("participantId");
    const supabase = getSupabaseAdmin();

    const [{ data: game, error: gameError }, { data: destinations, error: destinationError }] =
      await Promise.all([
        supabase.from("games").select("*").eq("slug", "holiday").single(),
        supabase
          .from("destination_totals")
          .select("id,name,total_stake")
          .order("name"),
      ]);

    if (gameError) throw gameError;
    if (destinationError) throw destinationError;

    let participant = null;
    let bets: unknown[] = [];

    const [{ data: matrixParticipants, error: matrixParticipantsError }, { data: matrixBets, error: matrixBetsError }] =
      await Promise.all([
        supabase
          .from("participants")
          .select("id,name,finalized_at")
          .order("created_at"),
        supabase
          .from("bets")
          .select("participant_id,destination_id,amount"),
      ]);

    if (matrixParticipantsError) throw matrixParticipantsError;
    if (matrixBetsError) throw matrixBetsError;

    if (participantId && participantId !== "admin") {
      const participantResult = await supabase
        .from("participants")
        .select("id,name,finalized_at")
        .eq("browser_id", participantId)
        .maybeSingle();

      if (participantResult.error) throw participantResult.error;
      participant = participantResult.data;

      if (participant) {
        const betsResult = await supabase
          .from("bets")
          .select("id,destination_id,amount,destination:destinations(name)")
          .eq("participant_id", participant.id)
          .order("created_at");

        if (betsResult.error) throw betsResult.error;
        bets = betsResult.data ?? [];
      }
    }

    let winningDestinationName = null;
    if (game.winning_destination_id) {
      const winnerResult = await supabase
        .from("destinations")
        .select("name")
        .eq("id", game.winning_destination_id)
        .single();
      winningDestinationName = winnerResult.data?.name ?? null;
    }

    return NextResponse.json({
      participant,
      bets,
      destinations: destinations ?? [],
      matrix: {
        participants: matrixParticipants ?? [],
        bets: matrixBets ?? [],
      },
      game: {
        status: game.status,
        winning_destination_id: game.winning_destination_id,
        winning_destination_name: winningDestinationName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
