import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function validSecret(value: unknown) {
  const expected = process.env.ADMIN_SECRET ?? "";
  const received = String(value ?? "");

  if (!expected || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: Request) {
  try {
    const { secret, action, winningDestinationId } = await request.json();

    if (!validSecret(secret)) {
      return NextResponse.json({ error: "Verkeerd wachtwoord." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (action === "close" || action === "reopen") {
      const status = action === "close" ? "closed" : "open";
      const { error } = await supabase
        .from("games")
        .update({
          status,
          winning_destination_id: status === "open" ? null : undefined,
        })
        .eq("slug", "holiday");

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "reveal") {
      if (!winningDestinationId) {
        return NextResponse.json(
          { error: "Kies de echte bestemming." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("games")
        .update({
          status: "revealed",
          winning_destination_id: winningDestinationId,
        })
        .eq("slug", "holiday");

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Onbekende actie." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
