import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/token-store";
import { fetchUsage } from "@/lib/providers/anthropic";

export async function GET(req: NextRequest) {
  const tokens = getTokens();
  const entry = tokens.anthropic;
  if (!entry) {
    return NextResponse.json({ error: "Anthropic not connected" }, { status: 404 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "30");
  try {
    const data = await fetchUsage(entry.apiKey, entry.adminKey, entry.sessionKey, days);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
