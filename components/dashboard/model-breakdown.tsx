import type { ModelUsage } from "@/lib/types";

export function ModelBreakdown({ models }: { models: ModelUsage[] }) {
  if (!models.length) return null;

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted border-b border-border">
            <th className="text-left py-2 font-medium">Model</th>
            <th className="text-right py-2 font-medium">Input</th>
            <th className="text-right py-2 font-medium">Output</th>
            <th className="text-right py-2 font-medium">Requests</th>
            {models.some((m) => m.cost !== undefined) && (
              <th className="text-right py-2 font-medium">Cost</th>
            )}
          </tr>
        </thead>
        <tbody>
          {models.slice(0, 10).map((m) => (
            <tr key={m.model} className="border-b border-border/50">
              <td className="py-2 font-mono text-text-secondary truncate max-w-[150px]">
                {m.model}
              </td>
              <td className="text-right py-2 text-text-secondary tabular-nums">
                {fmt(m.inputTokens)}
              </td>
              <td className="text-right py-2 text-text-secondary tabular-nums">
                {fmt(m.outputTokens)}
              </td>
              <td className="text-right py-2 text-text-secondary tabular-nums">
                {fmt(m.requests)}
              </td>
              {m.cost !== undefined && (
                <td className="text-right py-2 text-text-secondary tabular-nums">
                  ${m.cost.toFixed(2)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
