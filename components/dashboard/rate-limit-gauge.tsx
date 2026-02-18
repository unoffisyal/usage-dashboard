export function RateLimitGauge({
  label,
  used,
  total,
  reset,
  color = "var(--color-gemini)",
}: {
  label: string;
  used: number;
  total: number;
  reset?: string;
  color?: string;
}) {
  const remaining = total - used;
  const percent = total > 0 ? Math.round((remaining / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className="text-text-muted tabular-nums">
          {formatNumber(remaining)} / {formatNumber(total)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      {reset && (
        <p className="text-[10px] text-text-muted">
          Resets {formatResetTime(reset)}
        </p>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatResetTime(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return "now";
    if (diff < 60000) return `in ${Math.ceil(diff / 1000)}s`;
    if (diff < 3600000) return `in ${Math.ceil(diff / 60000)}m`;
    return `at ${date.toLocaleTimeString()}`;
  } catch {
    return iso;
  }
}
