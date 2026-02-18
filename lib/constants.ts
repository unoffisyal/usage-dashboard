export const OPENAI_API_BASE = "https://api.openai.com";
export const ANTHROPIC_API_BASE = "https://api.anthropic.com";
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

export const PROVIDER_META = {
  openai: {
    name: "OpenAI",
    color: "#10a37f",
    description: "GPT-4o, GPT-4, GPT-3.5 and more",
  },
  anthropic: {
    name: "Anthropic",
    color: "#d97757",
    description: "Claude Opus, Sonnet, Haiku",
  },
  gemini: {
    name: "Google Gemini",
    color: "#4285f4",
    description: "Gemini 2.5 Pro, Flash and more",
  },
} as const;

export const GEMINI_FREE_LIMITS: Record<string, { rpm: number; tpm: number; rpd: number }> = {
  "gemini-2.5-pro": { rpm: 5, tpm: 250000, rpd: 25 },
  "gemini-2.5-flash": { rpm: 10, tpm: 250000, rpd: 250 },
  "gemini-2.0-flash": { rpm: 15, tpm: 1000000, rpd: 1500 },
  "gemini-2.0-flash-lite": { rpm: 30, tpm: 1000000, rpd: 1500 },
  "gemini-1.5-pro": { rpm: 2, tpm: 32000, rpd: 50 },
  "gemini-1.5-flash": { rpm: 15, tpm: 1000000, rpd: 1500 },
  "gemini-1.5-flash-8b": { rpm: 15, tpm: 1000000, rpd: 1500 },
};

export const GEMINI_PAID_LIMITS: Record<string, { rpm: number; tpm: number; rpd: number }> = {
  "gemini-2.5-pro": { rpm: 1000, tpm: 4000000, rpd: 0 },
  "gemini-2.5-flash": { rpm: 2000, tpm: 4000000, rpd: 0 },
  "gemini-2.0-flash": { rpm: 2000, tpm: 4000000, rpd: 0 },
  "gemini-2.0-flash-lite": { rpm: 4000, tpm: 4000000, rpd: 0 },
  "gemini-1.5-pro": { rpm: 1000, tpm: 4000000, rpd: 0 },
  "gemini-1.5-flash": { rpm: 2000, tpm: 4000000, rpd: 0 },
  "gemini-1.5-flash-8b": { rpm: 4000, tpm: 4000000, rpd: 0 },
};
