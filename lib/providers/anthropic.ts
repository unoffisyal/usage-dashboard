import { ANTHROPIC_API_BASE } from "../constants";
import type { UsageData, DailyUsage, ModelUsage, RateLimits } from "../types";
import { fetchSessionUsage } from "./claude-session";

const rateLimitCache = new Map<string, { data: RateLimits; expiry: number }>();

async function anthropicFetch(
  path: string,
  apiKey: string,
  options: { method?: string; body?: string; params?: Record<string, string> } = {}
) {
  const url = new URL(path, ANTHROPIC_API_BASE);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: options.body,
  });
  return res;
}

export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    const res = await anthropicFetch("/v1/messages", apiKey, {
      method: "POST",
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function fetchRateLimits(apiKey: string): Promise<RateLimits> {
  const cached = rateLimitCache.get(apiKey);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const res = await anthropicFetch("/v1/messages", apiKey, {
    method: "POST",
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1,
      messages: [{ role: "user", content: "." }],
    }),
  });

  const limits: RateLimits = {};

  const reqLimit = res.headers.get("anthropic-ratelimit-requests-limit");
  const reqRemaining = res.headers.get("anthropic-ratelimit-requests-remaining");
  const reqReset = res.headers.get("anthropic-ratelimit-requests-reset");
  if (reqLimit) {
    limits.requests = {
      limit: parseInt(reqLimit),
      remaining: parseInt(reqRemaining || "0"),
      reset: reqReset || "",
    };
  }

  const inputLimit = res.headers.get("anthropic-ratelimit-input-tokens-limit");
  const inputRemaining = res.headers.get("anthropic-ratelimit-input-tokens-remaining");
  const inputReset = res.headers.get("anthropic-ratelimit-input-tokens-reset");
  if (inputLimit) {
    limits.inputTokens = {
      limit: parseInt(inputLimit),
      remaining: parseInt(inputRemaining || "0"),
      reset: inputReset || "",
    };
  }

  const outputLimit = res.headers.get("anthropic-ratelimit-output-tokens-limit");
  const outputRemaining = res.headers.get("anthropic-ratelimit-output-tokens-remaining");
  const outputReset = res.headers.get("anthropic-ratelimit-output-tokens-reset");
  if (outputLimit) {
    limits.outputTokens = {
      limit: parseInt(outputLimit),
      remaining: parseInt(outputRemaining || "0"),
      reset: outputReset || "",
    };
  }

  const tokLimit = res.headers.get("anthropic-ratelimit-tokens-limit");
  const tokRemaining = res.headers.get("anthropic-ratelimit-tokens-remaining");
  const tokReset = res.headers.get("anthropic-ratelimit-tokens-reset");
  if (tokLimit) {
    limits.tokens = {
      limit: parseInt(tokLimit),
      remaining: parseInt(tokRemaining || "0"),
      reset: tokReset || "",
    };
  }

  rateLimitCache.set(apiKey, { data: limits, expiry: Date.now() + 60000 });
  return limits;
}

export async function fetchCostReport(
  adminKey: string,
  days: number
): Promise<{ dailyUsage: DailyUsage[]; modelBreakdown: ModelUsage[]; totalCost: number }> {
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400 * 1000);

  const res = await anthropicFetch("/v1/organizations/cost_report", adminKey, {
    params: {
      starting_at: start.toISOString(),
      ending_at: now.toISOString(),
      bucket_width: "1d",
      group_by: "description",
    },
  });

  if (!res.ok) {
    throw new Error(`Anthropic cost report error ${res.status}`);
  }

  const data = await res.json();
  const dayMap = new Map<string, DailyUsage>();
  const modelMap = new Map<string, ModelUsage>();
  let totalCost = 0;

  for (const bucket of data.data || []) {
    const date = bucket.started_at?.split("T")[0] || "";

    if (!dayMap.has(date)) {
      dayMap.set(date, { date, inputTokens: 0, outputTokens: 0, requests: 0, cost: 0 });
    }
    const day = dayMap.get(date)!;

    for (const line of bucket.results || []) {
      const costVal = parseFloat(line.amount?.value || "0") / 100;
      totalCost += costVal;
      day.cost = (day.cost || 0) + costVal;

      const model = line.description || "unknown";
      if (!modelMap.has(model)) {
        modelMap.set(model, { model, inputTokens: 0, outputTokens: 0, requests: 0, cost: 0 });
      }
      const m = modelMap.get(model)!;
      m.cost = (m.cost || 0) + costVal;
    }
  }

  return {
    dailyUsage: Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    modelBreakdown: Array.from(modelMap.values()).sort((a, b) => (b.cost || 0) - (a.cost || 0)),
    totalCost,
  };
}

export async function fetchUsage(
  apiKey: string,
  adminKey: string | undefined,
  sessionKey: string | undefined,
  days: number
): Promise<UsageData> {
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400 * 1000);

  const results: Partial<UsageData> = {
    provider: "anthropic",
    period: { start: start.toISOString(), end: now.toISOString() },
    dailyUsage: [],
    modelBreakdown: [],
    hasAdminKey: !!adminKey,
  };

  try {
    const [rateLimits, costData, sessionUsage] = await Promise.all([
      fetchRateLimits(apiKey).catch(() => undefined),
      adminKey
        ? fetchCostReport(adminKey, days).catch(() => null)
        : Promise.resolve(null),
      sessionKey
        ? fetchSessionUsage(sessionKey).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (rateLimits) results.rateLimits = rateLimits;

    if (costData) {
      results.dailyUsage = costData.dailyUsage;
      results.modelBreakdown = costData.modelBreakdown;
      results.totalCost = costData.totalCost;
    } else if (!adminKey) {
      results.note = "Add an Admin API key (sk-ant-admin-*) in Settings for usage and cost data.";
    }

    if (sessionUsage) {
      results.sessionUsage = sessionUsage;
    }
  } catch {
    results.note = "Failed to fetch some usage data.";
  }

  return results as UsageData;
}
