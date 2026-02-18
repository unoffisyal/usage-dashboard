import type { ClaudeSessionUsage } from "../types";

const CLAUDE_BASE = "https://claude.ai";

async function claudeFetch(path: string, sessionKey: string) {
  const res = await fetch(`${CLAUDE_BASE}${path}`, {
    headers: {
      cookie: `sessionKey=${sessionKey}`,
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`claude.ai API error ${res.status}`);
  }
  return res.json();
}

export async function validateSessionKey(sessionKey: string): Promise<boolean> {
  try {
    const orgs = await claudeFetch("/api/organizations", sessionKey);
    return Array.isArray(orgs) && orgs.length > 0;
  } catch {
    return false;
  }
}

async function getOrganizationId(sessionKey: string): Promise<string> {
  const orgs = await claudeFetch("/api/organizations", sessionKey);
  if (!Array.isArray(orgs) || orgs.length === 0) {
    throw new Error("No organizations found");
  }
  return orgs[0].uuid;
}

export async function fetchSessionUsage(sessionKey: string): Promise<ClaudeSessionUsage> {
  const orgId = await getOrganizationId(sessionKey);

  // Fetch organization info and usage data in parallel
  const [orgInfo, usageData] = await Promise.all([
    claudeFetch(`/api/organizations/${orgId}`, sessionKey).catch(() => null),
    claudeFetch(`/api/organizations/${orgId}/usage`, sessionKey).catch(() => null),
  ]);

  const result: ClaudeSessionUsage = {
    currentPlan: "unknown",
    usageLevel: "unknown",
  };

  // Extract organization/plan info
  if (orgInfo) {
    result.organizationName = orgInfo.name || orgInfo.display_name;
    if (orgInfo.billing?.plan) {
      result.currentPlan = orgInfo.billing.plan;
    } else if (orgInfo.active_flags?.includes("max_plan")) {
      result.currentPlan = "Max";
    } else if (orgInfo.active_flags?.includes("pro_plan") || orgInfo.capabilities?.includes("pro")) {
      result.currentPlan = "Pro";
    } else if (orgInfo.plan_display_name) {
      result.currentPlan = orgInfo.plan_display_name;
    }
  }

  // Extract usage data
  if (usageData) {
    // The usage endpoint may return different structures depending on the version
    // Common patterns: { daily_usage: [...], usage_level: "...", reset_at: "..." }
    if (usageData.usage_level) {
      result.usageLevel = usageData.usage_level;
    } else if (usageData.status) {
      result.usageLevel = usageData.status;
    }

    if (usageData.reset_at || usageData.expires_at) {
      result.resetAt = usageData.reset_at || usageData.expires_at;
    }

    // Daily usage breakdown if available
    if (Array.isArray(usageData.daily_usage)) {
      result.dailyUsage = usageData.daily_usage.map(
        (d: { date: string; count?: number; num_messages?: number }) => ({
          date: d.date,
          count: d.count ?? d.num_messages ?? 0,
        })
      );
    }
  }

  return result;
}
