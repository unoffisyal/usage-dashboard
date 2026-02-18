"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderRow } from "@/components/settings/provider-row";
import type { Provider, TokenInfo } from "@/lib/types";

const ALL_PROVIDERS: Provider[] = ["openai", "anthropic", "gemini"];

export default function SettingsPage() {
  const [providers, setProviders] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      const data = await res.json();
      setProviders(data.providers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-border rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const tokenMap = new Map(providers.map((p) => [p.provider, p]));

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your API provider connections
        </p>
      </div>

      <div className="space-y-4">
        {ALL_PROVIDERS.map((provider) => (
          <ProviderRow
            key={provider}
            provider={provider}
            tokenInfo={tokenMap.get(provider)}
            onUpdate={fetchProviders}
          />
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-surface border border-border">
        <h3 className="text-sm font-medium mb-2">About API Keys</h3>
        <ul className="text-xs text-text-secondary space-y-1.5">
          <li>API keys are encrypted and stored locally on this server.</li>
          <li>Keys are validated against the provider API before being saved.</li>
          <li>For full usage data, OpenAI and Anthropic require Admin API keys.</li>
          <li>For Anthropic, a Session Key from claude.ai enables Pro/Max plan usage and limit tracking.</li>
          <li>Gemini usage history is not available via API; only rate limits are shown.</li>
        </ul>
      </div>
    </div>
  );
}
