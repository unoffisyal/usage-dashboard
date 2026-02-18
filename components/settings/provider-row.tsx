"use client";

import { useState } from "react";
import { Link2, Unlink, ChevronDown, ChevronUp } from "lucide-react";
import { PROVIDER_META } from "@/lib/constants";
import type { Provider, TokenInfo } from "@/lib/types";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TokenForm } from "./token-form";

export function ProviderRow({
  provider,
  tokenInfo,
  onUpdate,
}: {
  provider: Provider;
  tokenInfo?: TokenInfo;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const meta = PROVIDER_META[provider];
  const connected = tokenInfo?.connected ?? false;

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      onUpdate();
    } finally {
      setDisconnecting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: meta.color }}
          >
            {meta.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{meta.name}</h3>
            {connected && tokenInfo ? (
              <p className="text-xs text-text-muted font-mono">{tokenInfo.keyHint}</p>
            ) : (
              <p className="text-xs text-text-muted">{meta.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge connected={connected} />
          {connected ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
                title="Update key"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={disconnecting}
                className="p-2 rounded-lg hover:bg-danger/10 transition-colors text-text-muted hover:text-danger"
                title="Disconnect"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: meta.color }}
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Key Info Badges */}
      {connected && provider === "anthropic" && (tokenInfo?.hasAdminKey || tokenInfo?.hasSessionKey) && (
        <div className="px-5 pb-3 flex gap-2 flex-wrap">
          {tokenInfo.hasAdminKey && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-anthropic/10 text-anthropic font-medium">
              Admin key
            </span>
          )}
          {tokenInfo.hasSessionKey && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-anthropic/10 text-anthropic font-medium">
              Session key
            </span>
          )}
        </div>
      )}

      {/* Expanded Form */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border">
          <TokenForm
            provider={provider}
            onSaved={() => {
              setExpanded(false);
              onUpdate();
            }}
            onCancel={() => setExpanded(false)}
          />
        </div>
      )}

      {/* Disconnect Confirmation */}
      {showConfirm && (
        <div className="px-5 py-4 border-t border-border bg-danger/5">
          <p className="text-sm text-text-primary mb-3">
            Disconnect {meta.name}? This will remove the stored API key.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 rounded-lg bg-danger text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
