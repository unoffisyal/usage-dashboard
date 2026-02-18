import { OPENAI_API_BASE } from "../constants";
import type { UsageData, DailyUsage, ModelUsage } from "../types";

async function openaiGet(path: string, apiKey: string, params?: Record<string, string>) {
  const url = new URL(path, OPENAI_API_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    await openaiGet("/v1/models", apiKey);
    return true;
  } catch {
    return false;
  }
}

export async function fetchUsage(apiKey: string, days: number): Promise<UsageData> {
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400 * 1000);
  const startTime = Math.floor(start.getTime() / 1000);

  try {
    const [completionsData, costsData] = await Promise.all([
      openaiGet("/v1/organization/usage/completions", apiKey, {
        start_time: startTime.toString(),
        bucket_width: "1d",
        group_by: "model",
      }).catch(() => null),
      openaiGet("/v1/organization/costs", apiKey, {
        start_time: startTime.toString(),
        bucket_width: "1d",
      }).catch(() => null),
    ]);

    const dailyUsage: DailyUsage[] = [];
    const modelMap = new Map<string, ModelUsage>();
    let totalCost = 0;

    if (completionsData?.data) {
      const dayMap = new Map<string, DailyUsage>();

      for (const bucket of completionsData.data) {
        const date = new Date(bucket.start_time * 1000).toISOString().split("T")[0];

        if (!dayMap.has(date)) {
          dayMap.set(date, { date, inputTokens: 0, outputTokens: 0, requests: 0 });
        }
        const day = dayMap.get(date)!;

        for (const result of bucket.results || []) {
          const input = result.input_tokens || 0;
          const output = result.output_tokens || 0;
          const reqs = result.num_model_requests || 0;
          const model = result.model || "unknown";

          day.inputTokens += input;
          day.outputTokens += output;
          day.requests += reqs;

          if (!modelMap.has(model)) {
            modelMap.set(model, { model, inputTokens: 0, outputTokens: 0, requests: 0 });
          }
          const m = modelMap.get(model)!;
          m.inputTokens += input;
          m.outputTokens += output;
          m.requests += reqs;
        }
      }

      dailyUsage.push(...Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    }

    if (costsData?.data) {
      for (const bucket of costsData.data) {
        for (const result of bucket.results || []) {
          totalCost += (result.amount?.value || 0) / 100;
        }
      }
    }

    return {
      provider: "openai",
      period: { start: start.toISOString(), end: now.toISOString() },
      totalCost,
      dailyUsage,
      modelBreakdown: Array.from(modelMap.values()).sort(
        (a, b) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens)
      ),
      note: !completionsData && !costsData
        ? "Admin API key required for usage data. Go to platform.openai.com > Organization > Admin Keys."
        : undefined,
    };
  } catch {
    return {
      provider: "openai",
      period: { start: start.toISOString(), end: now.toISOString() },
      dailyUsage: [],
      modelBreakdown: [],
      note: "Failed to fetch usage data. An Admin API key may be required.",
    };
  }
}
