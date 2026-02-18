"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, DollarSign, Clock, User } from "lucide-react";
import { PROVIDER_META } from "@/lib/constants";
import type { Provider, UsageData, GeminiUsageData, ClaudeSessionUsage } from "@/lib/types";
import { UsageChart } from "./usage-chart";
import { ModelBreakdown } from "./model-breakdown";
import { RateLimitGauge } from "./rate-limit-gauge";

type AnyUsageData = UsageData | GeminiUsageData;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const dataCache = new Map<string, { data: AnyUsageData; ts: number }>();

function fillDailyGaps(data: UsageData["dailyUsage"], days: number): UsageData["dailyUsage"] {
  const map = new Map(data.map((d) => [d.date, d]));
  const result: UsageData["dailyUsage"] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const date = d.toISOString().split("T")[0];
    result.push(map.get(date) ?? { date, inputTokens: 0, outputTokens: 0, requests: 0 });
  }
  return result;
}

export function ProviderCard({
  provider,
  days,
}: {
  provider: Provider;
  days: number;
}) {
  const [data, setData] = useState<AnyUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const fetchData = useCallback(async (force = false) => {
    const key = `${provider}-${days}`;
    const cached = dataCache.get(key);
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setCachedAt(cached.ts);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = provider === "gemini" ? "" : `?days=${days}`;
      const res = await fetch(`/api/usage/${provider}${params}`);
      if (!res.ok) throw new Error(`Failed to fetch`);
      const json = await res.json();
      const ts = Date.now();
      dataCache.set(key, { data: json, ts });
      setData(json);
      setCachedAt(ts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [provider, days]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const meta = PROVIDER_META[provider];

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: meta.color }}
          >
            {meta.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{meta.name}</h3>
            <p className="text-xs text-text-muted">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cachedAt && !loading && (
            <span className="text-[10px] text-text-muted" title="Last updated">
              {formatAge(cachedAt)}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
            title="Force refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {loading && !data ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : data ? (
          <ProviderContent provider={provider} data={data} days={days} />
        ) : null}
      </div>
    </div>
  );
}

function ProviderContent({
  provider,
  data,
  days,
}: {
  provider: Provider;
  data: AnyUsageData;
  days: number;
}) {
  if (provider === "gemini") {
    const gemini = data as GeminiUsageData;
    return <GeminiContent data={gemini} />;
  }

  const usage = data as UsageData;
  const meta = PROVIDER_META[provider];
  const filledDaily = fillDailyGaps(usage.dailyUsage, days);

  return (
    <>
      {/* Cost Summary */}
      {usage.totalCost !== undefined && usage.totalCost > 0 && (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-text-muted" />
          <span className="text-2xl font-bold tabular-nums">${usage.totalCost.toFixed(2)}</span>
          <span className="text-xs text-text-muted">this period</span>
        </div>
      )}

      {/* Claude.ai Session Usage */}
      {usage.sessionUsage && (
        <SessionUsageCard session={usage.sessionUsage} />
      )}

      {/* Usage Chart */}
      {usage.dailyUsage.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary mb-2">Daily Token Usage</h4>
          <UsageChart data={filledDaily} color={meta.color} />
        </div>
      )}

      {/* Rate Limits */}
      {usage.rateLimits && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-text-secondary">Rate Limits</h4>
          {usage.rateLimits.requests && (
            <RateLimitGauge
              label="Requests"
              used={usage.rateLimits.requests.limit - usage.rateLimits.requests.remaining}
              total={usage.rateLimits.requests.limit}
              reset={usage.rateLimits.requests.reset}
              color={meta.color}
            />
          )}
          {usage.rateLimits.inputTokens && (
            <RateLimitGauge
              label="Input Tokens"
              used={usage.rateLimits.inputTokens.limit - usage.rateLimits.inputTokens.remaining}
              total={usage.rateLimits.inputTokens.limit}
              reset={usage.rateLimits.inputTokens.reset}
              color={meta.color}
            />
          )}
          {usage.rateLimits.outputTokens && (
            <RateLimitGauge
              label="Output Tokens"
              used={usage.rateLimits.outputTokens.limit - usage.rateLimits.outputTokens.remaining}
              total={usage.rateLimits.outputTokens.limit}
              reset={usage.rateLimits.outputTokens.reset}
              color={meta.color}
            />
          )}
          {usage.rateLimits.tokens && !usage.rateLimits.inputTokens && (
            <RateLimitGauge
              label="Tokens"
              used={usage.rateLimits.tokens.limit - usage.rateLimits.tokens.remaining}
              total={usage.rateLimits.tokens.limit}
              reset={usage.rateLimits.tokens.reset}
              color={meta.color}
            />
          )}
        </div>
      )}

      {/* Model Breakdown */}
      {usage.modelBreakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary mb-2">Model Breakdown</h4>
          <ModelBreakdown models={usage.modelBreakdown} />
        </div>
      )}

      {/* Note */}
      {usage.note && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 text-warning text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{usage.note}</p>
        </div>
      )}
    </>
  );
}

function SessionUsageCard({ session }: { session: ClaudeSessionUsage }) {
  const usageLevelColors: Record<string, string> = {
    normal: "text-success bg-success/10",
    low: "text-success bg-success/10",
    standard: "text-success bg-success/10",
    elevated: "text-warning bg-warning/10",
    high: "text-danger bg-danger/10",
    very_high: "text-danger bg-danger/10",
    limit: "text-danger bg-danger/10",
  };
  const levelStyle = usageLevelColors[session.usageLevel] || "text-text-secondary bg-surface-hover";

  const formatResetTime = (reset: string) => {
    const date = new Date(reset);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return "now";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="p-4 rounded-xl bg-anthropic/5 border border-anthropic/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-anthropic" />
          <span className="text-xs font-medium">claude.ai</span>
        </div>
        {session.currentPlan && session.currentPlan !== "unknown" && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-anthropic/10 text-anthropic font-medium">
            {session.currentPlan}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-text-muted mb-1">Usage Level</p>
          <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${levelStyle}`}>
            {session.usageLevel.replace(/_/g, " ")}
          </span>
        </div>
        {session.resetAt && (
          <div className="flex-1">
            <p className="text-[11px] text-text-muted mb-1">Resets in</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium">{formatResetTime(session.resetAt)}</span>
            </div>
          </div>
        )}
      </div>

      {session.dailyUsage && session.dailyUsage.length > 0 && (
        <div>
          <p className="text-[11px] text-text-muted mb-1.5">Recent Activity</p>
          <div className="flex gap-0.5">
            {session.dailyUsage.slice(-14).map((d) => {
              const max = Math.max(...session.dailyUsage!.map((x) => x.count), 1);
              const intensity = d.count / max;
              return (
                <div
                  key={d.date}
                  className="flex-1 rounded-sm"
                  style={{
                    height: 24,
                    backgroundColor: `color-mix(in srgb, #d97757 ${Math.max(intensity * 100, 5)}%, transparent)`,
                  }}
                  title={`${d.date}: ${d.count} messages`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GeminiContent({ data }: { data: GeminiUsageData }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-gemini/10 text-gemini font-medium capitalize">
          {data.tier} tier
        </span>
        <span className="text-xs text-text-muted">
          {data.availableModels.length} models available
        </span>
      </div>

      {data.rateLimits.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-text-secondary">Rate Limits by Model</h4>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  <th className="text-left py-2 font-medium">Model</th>
                  <th className="text-right py-2 font-medium">RPM</th>
                  <th className="text-right py-2 font-medium">TPM</th>
                  {data.tier === "free" && <th className="text-right py-2 font-medium">RPD</th>}
                </tr>
              </thead>
              <tbody>
                {data.rateLimits.map((rl) => (
                  <tr key={rl.model} className="border-b border-border/50">
                    <td className="py-2 font-mono text-text-secondary truncate max-w-[150px]">
                      {rl.model}
                    </td>
                    <td className="text-right py-2 text-text-secondary tabular-nums">
                      {rl.rpm.toLocaleString()}
                    </td>
                    <td className="text-right py-2 text-text-secondary tabular-nums">
                      {fmtNum(rl.tpm)}
                    </td>
                    {data.tier === "free" && (
                      <td className="text-right py-2 text-text-secondary tabular-nums">
                        {rl.rpd.toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.note && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-gemini/5 text-text-secondary text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gemini" />
          <p>{data.note}</p>
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-border rounded w-24" />
      <div className="h-[200px] bg-border rounded" />
      <div className="space-y-2">
        <div className="h-4 bg-border rounded w-full" />
        <div className="h-4 bg-border rounded w-3/4" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/5 text-danger text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function formatAge(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}
