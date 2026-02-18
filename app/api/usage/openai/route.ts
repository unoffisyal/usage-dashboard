import { NextRequest, NextResponse } from "next/server";
import { getProviderKey } from "@/lib/token-store";
import { fetchUsage } from "@/lib/providers/openai";

export async function GET(req: NextRequest) {
  const apiKey = getProviderKey("openai");
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not connected" }, { status: 404 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "30");
  try {
    const data = await fetchUsage(apiKey, days);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
