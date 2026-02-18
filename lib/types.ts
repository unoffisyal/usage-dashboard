export type Provider = "openai" | "anthropic" | "gemini";

export interface TokenInfo {
  provider: Provider;
  connected: boolean;
  keyHint: string;
  hasAdminKey?: boolean;
  hasSessionKey?: boolean;
  updatedAt: string;
}

export interface TokenStore {
  openai?: { apiKey: string; updatedAt: string };
  anthropic?: { apiKey: string; adminKey?: string; sessionKey?: string; updatedAt: string };
  gemini?: { apiKey: string; tier?: "free" | "paid"; updatedAt: string };
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  cost?: number;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost?: number;
  requests: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

export interface RateLimits {
  requests?: RateLimitInfo;
  inputTokens?: RateLimitInfo;
  outputTokens?: RateLimitInfo;
  tokens?: RateLimitInfo;
}

export interface UsageData {
  provider: Provider;
  period: { start: string; end: string };
  totalCost?: number;
  dailyUsage: DailyUsage[];
  modelBreakdown: ModelUsage[];
  rateLimits?: RateLimits;
  note?: string;
  hasAdminKey?: boolean;
  sessionUsage?: ClaudeSessionUsage;
}

// claude.ai session-based usage data
export interface ClaudeSessionUsage {
  currentPlan: string;
  usageLevel: string; // e.g., "normal", "elevated", "high"
  resetAt?: string;
  dailyUsage?: { date: string; count: number }[];
  organizationName?: string;
}

export interface GeminiModelRateLimit {
  model: string;
  rpm: number;
  tpm: number;
  rpd: number;
}

export interface GeminiUsageData {
  provider: "gemini";
  availableModels: string[];
  rateLimits: GeminiModelRateLimit[];
  tier: "free" | "paid";
  note: string;
}
