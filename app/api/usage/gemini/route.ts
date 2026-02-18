import { NextResponse } from "next/server";
import { getTokens } from "@/lib/token-store";
import { fetchUsage } from "@/lib/providers/gemini";

export async function GET() {
  const tokens = getTokens();
  const entry = tokens.gemini;
  if (!entry) {
    return NextResponse.json({ error: "Gemini not connected" }, { status: 404 });
  }

  try {
    const data = await fetchUsage(entry.apiKey, entry.tier || "free");
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
