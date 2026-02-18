import { GEMINI_API_BASE, GEMINI_FREE_LIMITS, GEMINI_PAID_LIMITS } from "../constants";
import type { GeminiUsageData, GeminiModelRateLimit } from "../types";

export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${GEMINI_API_BASE}/v1beta/models?key=${apiKey}&pageSize=1`
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${GEMINI_API_BASE}/v1beta/models?key=${apiKey}&pageSize=100`);
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  const data = await res.json();
  const models: string[] = [];

  for (const m of data.models || []) {
    const name: string = m.name?.replace("models/", "") || "";
    if (name.startsWith("gemini-")) {
      models.push(name);
    }
  }

  return models.sort();
}

export async function fetchUsage(
  apiKey: string,
  tier: "free" | "paid" = "free"
): Promise<GeminiUsageData> {
  const models = await fetchModels(apiKey);
  const limitsTable = tier === "free" ? GEMINI_FREE_LIMITS : GEMINI_PAID_LIMITS;

  const rateLimits: GeminiModelRateLimit[] = [];

  for (const model of models) {
    const baseModel = findBaseModel(model);
    const limits = limitsTable[baseModel];
    if (limits) {
      rateLimits.push({ model, ...limits });
    }
  }

  return {
    provider: "gemini",
    availableModels: models,
    rateLimits,
    tier,
    note: "Gemini API does not provide a usage history endpoint. For detailed usage metrics, use Google Cloud Monitoring (serviceruntime metrics) with a GCP project. Showing available models and rate limits.",
  };
}

function findBaseModel(model: string): string {
  const bases = Object.keys(GEMINI_FREE_LIMITS);
  for (const base of bases) {
    if (model.startsWith(base)) return base;
  }
  return model;
}
