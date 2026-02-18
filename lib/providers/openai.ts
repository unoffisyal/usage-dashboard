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

async function openaiGetAllPages(
  path: string,
  apiKey: string,
  params: Record<string, string>
): Promise<unknown[]> {
  const results: unknown[] = [];
  let page: string | undefined;
  for (let i = 0; i < 20; i++) {
    const p = page ? { ...params, page } : params;
    const json = await openaiGet(path, apiKey, p);
    if (Array.isArray(json?.data)) results.push(...json.data);
    if (!json?.has_more) break;
    page = json.next_page;
    if (!page) break;
  }
  return results;
}

export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    if (apiKey.startsWith("sk-admin-")) {
      // Admin keys can't access /v1/models; validate via organization endpoint
      const now = Math.floor(Date.now() / 1000);
      await openaiGet("/v1/organization/costs", apiKey, {
        start_time: (now - 86400).toString(),
        bucket_width: "1d",
      });
    } else {
      await openaiGet("/v1/models", apiKey);
    }
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
    const [completionsBuckets, costsBuckets] = await Promise.all([
      openaiGetAllPages("/v1/organization/usage/completions", apiKey, {
        start_time: startTime.toString(),
        bucket_width: "1d",
        group_by: "model",
      }).catch(() => null),
      openaiGetAllPages("/v1/organization/costs", apiKey, {
        start_time: startTime.toString(),
        bucket_width: "1d",
      }).catch(() => null),
    ]);

    const dailyUsage: DailyUsage[] = [];
    const modelMap = new Map<string, ModelUsage>();
    let totalCost = 0;

    if (completionsBuckets) {
      const dayMap = new Map<string, DailyUsage>();

      for (const bucket of completionsBuckets as Array<{ start_time: number; results?: Array<{ input_tokens?: number; output_tokens?: number; num_model_requests?: number; model?: string }> }>) {
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

    if (costsBuckets) {
      for (const bucket of costsBuckets as Array<{ results?: Array<{ amount?: { value?: number } }> }>) {
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
      note: !completionsBuckets && !costsBuckets
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
