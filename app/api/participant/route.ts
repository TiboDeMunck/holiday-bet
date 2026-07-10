import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { participantId, name } = await request.json();
    const cleanName = String(name ?? "").trim().replace(/\s+/g, " ");
    const normalizedName = cleanName.toLocaleLowerCase("nl-BE");

    if (!participantId || cleanName.length < 2 || cleanName.length > 40) {
      return NextResponse.json({ error: "Ongeldige naam." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingName, error: lookupError } = await supabase
      .from("participants")
      .select("browser_id")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingName && existingName.browser_id !== participantId) {
      return NextResponse.json(
        { error: "Deze naam is al in gebruik. Kies een andere naam." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("participants")
      .upsert(
        {
          browser_id: participantId,
          name: cleanName,
          normalized_name: normalizedName,
        },
        { onConflict: "browser_id" }
      )
      .select("id,name,finalized_at")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Deze naam is al in gebruik. Kies een andere naam." },
        { status: 409 }
      );
    }

    if (error) throw error;
    return NextResponse.json({ participant: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
