import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { encrypt, decrypt } from "./crypto";
import type { TokenStore, TokenInfo, Provider } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const TOKEN_FILE = join(DATA_DIR, "tokens.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getTokens(): TokenStore {
  if (!existsSync(TOKEN_FILE)) return {};
  try {
    const raw = readFileSync(TOKEN_FILE, "utf-8");
    const { encrypted } = JSON.parse(raw);
    return JSON.parse(decrypt(encrypted));
  } catch {
    return {};
  }
}

function saveTokens(store: TokenStore) {
  ensureDataDir();
  const encrypted = encrypt(JSON.stringify(store));
  writeFileSync(TOKEN_FILE, JSON.stringify({ encrypted }), { mode: 0o600 });
}

export function saveToken(
  provider: Provider,
  keys: { apiKey: string; adminKey?: string; sessionKey?: string; tier?: "free" | "paid" }
) {
  const store = getTokens();
  const updatedAt = new Date().toISOString();

  if (provider === "openai") {
    store.openai = { apiKey: keys.apiKey, updatedAt };
  } else if (provider === "anthropic") {
    store.anthropic = {
      apiKey: keys.apiKey,
      adminKey: keys.adminKey,
      sessionKey: keys.sessionKey,
      updatedAt,
    };
  } else if (provider === "gemini") {
    store.gemini = { apiKey: keys.apiKey, tier: keys.tier || "free", updatedAt };
  }

  saveTokens(store);
}

export function removeToken(provider: Provider) {
  const store = getTokens();
  delete store[provider];
  saveTokens(store);
}

export function getProviderKey(provider: Provider): string | null {
  const store = getTokens();
  return store[provider]?.apiKey ?? null;
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 5) + "..." + key.slice(-4);
}

export function getConnectedProviders(): TokenInfo[] {
  const store = getTokens();
  const providers: TokenInfo[] = [];

  for (const p of ["openai", "anthropic", "gemini"] as Provider[]) {
    const entry = store[p];
    if (entry) {
      providers.push({
        provider: p,
        connected: true,
        keyHint: maskKey(entry.apiKey),
        hasAdminKey: p === "anthropic" ? !!(entry as { adminKey?: string }).adminKey : undefined,
        hasSessionKey: p === "anthropic" ? !!(entry as { sessionKey?: string }).sessionKey : undefined,
        updatedAt: entry.updatedAt,
      });
    }
  }

  return providers;
}
