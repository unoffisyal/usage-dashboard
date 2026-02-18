import { NextRequest, NextResponse } from "next/server";
import { getConnectedProviders, saveToken, removeToken, getTokens } from "@/lib/token-store";
import { validateKey as validateOpenAI } from "@/lib/providers/openai";
import { validateKey as validateAnthropic } from "@/lib/providers/anthropic";
import { validateKey as validateGemini } from "@/lib/providers/gemini";
import { validateSessionKey } from "@/lib/providers/claude-session";
import type { Provider } from "@/lib/types";

export async function GET() {
  const providers = getConnectedProviders();
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { provider, apiKey, adminKey, sessionKey, tier } = body as {
    provider: Provider;
    apiKey: string;
    adminKey?: string;
    sessionKey?: string;
    tier?: "free" | "paid";
  };

  if (!provider || !apiKey) {
    return NextResponse.json({ success: false, error: "Missing provider or apiKey" }, { status: 400 });
  }

  let valid = false;
  try {
    if (provider === "openai") valid = await validateOpenAI(apiKey);
    else if (provider === "anthropic") valid = await validateAnthropic(apiKey);
    else if (provider === "gemini") valid = await validateGemini(apiKey);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to validate API key" }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 400 });
  }

  // Validate session key if provided (non-blocking - save even if invalid)
  let sessionKeyValid = false;
  if (provider === "anthropic" && sessionKey) {
    try {
      sessionKeyValid = await validateSessionKey(sessionKey);
    } catch {
      // Session key validation failed, but we still save the API key
    }
  }

  saveToken(provider, {
    apiKey,
    adminKey,
    sessionKey: sessionKeyValid ? sessionKey : undefined,
    tier,
  });

  return NextResponse.json({
    success: true,
    sessionKeyValid: sessionKey ? sessionKeyValid : undefined,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { provider } = body as { provider: Provider };

  if (!provider) {
    return NextResponse.json({ success: false, error: "Missing provider" }, { status: 400 });
  }

  removeToken(provider);
  return NextResponse.json({ success: true });
}
