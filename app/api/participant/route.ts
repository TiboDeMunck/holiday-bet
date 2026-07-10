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

    const { data: existingByName, error: nameLookupError } = await supabase
      .from("participants")
      .select("id,name,finalized_at,browser_id")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (nameLookupError) throw nameLookupError;

    if (existingByName) {
      const { data, error } = await supabase
        .from("participants")
        .update({ browser_id: participantId })
        .eq("id", existingByName.id)
        .select("id,name,finalized_at")
        .single();

      if (error?.code === "23505") {
        return NextResponse.json(
          { error: "Deze browser is al gekoppeld aan een andere deelnemer." },
          { status: 409 }
        );
      }
      if (error) throw error;

      return NextResponse.json({ participant: data, returning: true });
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

    if (error) throw error;
    return NextResponse.json({ participant: data, returning: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverfout." },
      { status: 500 }
    );
  }
}
