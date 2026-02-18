"use client";

import { useState, useEffect } from "react";
import { Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProviderCard } from "@/components/dashboard/provider-card";
import type { Provider, TokenInfo } from "@/lib/types";

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function DashboardPage() {
  const [providers, setProviders] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers || []))
      .finally(() => setLoading(false));
  }, []);

  const connected = providers.filter((p) => p.connected);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-border rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (connected.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-text-primary/5 flex items-center justify-center mb-6">
            <Settings className="w-8 h-8 text-text-muted" />
          </div>
          <h1 className="text-xl font-semibold mb-2">No API providers connected</h1>
          <p className="text-text-secondary text-sm mb-6 max-w-md">
            Connect your OpenAI, Anthropic, or Google Gemini API keys in Settings to start monitoring usage.
          </p>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-text-primary text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Settings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold md:hidden">Dashboard</h1>
          <h1 className="text-xl font-semibold hidden md:block">API Usage Dashboard</h1>
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === d
                  ? "bg-text-primary text-background"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {connected.map((p) => (
          <ProviderCard key={p.provider} provider={p.provider as Provider} days={days} />
        ))}
      </div>
    </div>
  );
}
