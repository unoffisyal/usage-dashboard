"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyUsage } from "@/lib/types";

export function UsageChart({
  data,
  color,
}: {
  data: DailyUsage[];
  color: string;
}) {
  if (!data.length) {
    return (
      <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
        No usage data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    input: d.inputTokens,
    output: d.outputTokens,
    cost: d.cost,
  }));

  return (
    <div className="h-[200px] md:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={shortNum}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [shortNum(value), ""]}
          />
          <Area
            type="monotone"
            dataKey="input"
            name="Input tokens"
            stackId="1"
            stroke={color}
            fill={`url(#grad-${color.replace("#", "")})`}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="output"
            name="Output tokens"
            stackId="1"
            stroke={color}
            strokeOpacity={0.5}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
