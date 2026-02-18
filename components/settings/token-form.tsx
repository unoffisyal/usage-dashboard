"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import type { Provider } from "@/lib/types";

export function TokenForm({
  provider,
  onSaved,
  onCancel,
}: {
  provider: Provider;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("free");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showSessionHelp, setShowSessionHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    try {
      const body: Record<string, string> = { provider, apiKey };
      if (provider === "anthropic" && adminKey) body.adminKey = adminKey;
      if (provider === "anthropic" && sessionKey) body.sessionKey = sessionKey;
      if (provider === "gemini") body.tier = tier;

      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        let msg = "Connected successfully!";
        if (data.sessionKeyValid === false) {
          msg = "API key saved. Session key could not be validated (may be expired).";
        } else if (data.sessionKeyValid === true) {
          msg = "Connected with session key!";
        }
        setResult({ ok: true, message: msg });
        setTimeout(onSaved, 1200);
      } else {
        setResult({ ok: false, message: data.error || "Failed to connect" });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* API Key */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === "openai"
                ? "sk-..."
                : provider === "anthropic"
                ? "sk-ant-..."
                : "AIza..."
            }
            required
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/40"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Anthropic Admin Key */}
      {provider === "anthropic" && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Admin API Key <span className="text-text-muted">(optional, for usage data)</span>
          </label>
          <input
            type={showKey ? "text" : "password"}
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="sk-ant-admin-..."
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/40"
          />
          <p className="text-[11px] text-text-muted mt-1">
            Generate at console.anthropic.com &gt; Settings &gt; Admin API Keys
          </p>
        </div>
      )}

      {/* Anthropic Session Key */}
      {provider === "anthropic" && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Session Key <span className="text-text-muted">(optional, for claude.ai usage)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSessionHelp(!showSessionHelp)}
              className="text-text-muted hover:text-text-secondary"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type={showKey ? "text" : "password"}
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            placeholder="sk-ant-sid01-..."
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/40"
          />
          {showSessionHelp && (
            <div className="mt-2 p-3 rounded-lg bg-surface-hover text-[11px] text-text-secondary space-y-1.5">
              <p className="font-medium text-text-primary">How to get your Session Key:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <span className="font-mono text-anthropic">claude.ai</span> and log in</li>
                <li>Open Developer Tools (F12 or Cmd+Opt+I)</li>
                <li>Go to <span className="font-medium">Application</span> &gt; <span className="font-medium">Cookies</span></li>
                <li>Find the <span className="font-mono">sessionKey</span> cookie</li>
                <li>Copy its value (starts with <span className="font-mono">sk-ant-sid01-</span>)</li>
              </ol>
              <p className="text-text-muted">This enables viewing your Pro/Max plan usage and session limits from claude.ai. The session key expires periodically and will need to be updated.</p>
            </div>
          )}
        </div>
      )}

      {/* OpenAI note */}
      {provider === "openai" && (
        <p className="text-[11px] text-text-muted">
          An Admin API key from platform.openai.com &gt; Organization &gt; Admin Keys is recommended for full usage data.
        </p>
      )}

      {/* Gemini Tier */}
      {provider === "gemini" && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Billing Tier
          </label>
          <div className="flex gap-2">
            {(["free", "paid"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  tier === t
                    ? "bg-gemini/10 text-gemini border border-gemini/30"
                    : "bg-background border border-border text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {t === "free" ? "Free" : "Pay-as-you-go"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result message */}
      {result && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
            result.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {result.message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !apiKey}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-text-primary text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Test & Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
