import type { CSSProperties, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

interface ChartContainerProps {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}

export function ChartContainer({
  config,
  className,
  children,
}: ChartContainerProps) {
  const variables = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color]),
  ) as CSSProperties;

  return (
    <div className={`chart-container ${className ?? ""}`} style={variables}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      {label !== undefined && <p className="chart-tooltip-title">{label}</p>}
      {payload.map((entry, index) => {
        const name = String(entry.name ?? entry.dataKey ?? "Nilai");
        const value = Number(entry.value ?? 0);
        return (
          <div className="chart-tooltip-row" key={`${name}-${index}`}>
            <span className="tooltip-dot" style={{ background: entry.color }} />
            <span>{name}</span>
            <strong>{formatter ? formatter(value, name) : value.toFixed(2)}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function ChartLegend({ config }: { config: ChartConfig }) {
  return (
    <div className="chart-legend">
      {Object.entries(config).map(([key, item]) => (
        <span className="chart-legend-item" key={key}>
          <i style={{ background: `var(--color-${key})` }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
