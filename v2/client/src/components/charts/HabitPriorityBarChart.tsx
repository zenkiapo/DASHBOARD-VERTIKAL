import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { HabitScore } from "../../types/dashboard";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

const config: ChartConfig = {
  score: { label: "Rata-rata skor", color: "#4c6fff" },
};

export function HabitPriorityBarChart({ data }: { data: HabitScore[] }) {
  const ranked = [...data].sort((a, b) => {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return a.score - b.score;
  });
  const lowestKeys = new Set(
    ranked.filter((item) => item.score !== null).slice(0, 2).map((item) => item.key),
  );

  return (
    <ChartCard
      eyebrow="Urutan prioritas"
      title="Skor per kebiasaan"
      description="Skor terendah ditandai sebagai prioritas penguatan"
    >
      <ChartContainer config={config} className="standard-chart priority-chart">
        <BarChart
          data={ranked}
          layout="vertical"
          margin={{ left: 10, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#edf0f5" />
          <XAxis type="number" domain={[0, 4]} tickCount={5} />
          <YAxis
            type="category"
            dataKey="habit"
            width={148}
            tick={{ fill: "#526076", fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="score"
            name="Rata-rata skor"
            radius={[0, 6, 6, 0]}
            barSize={18}
            fill="var(--color-score)"
            shape={(props) => {
              const { x, y, width, height, payload } = props as typeof props & {
                payload: HabitScore;
              };
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={5}
                  fill={lowestKeys.has(payload.key) ? "#e35d68" : "#4c6fff"}
                />
              );
            }}
          />
        </BarChart>
      </ChartContainer>
      <div className="chart-footnote">
        <span className="priority-dot" /> Dua skor terendah
      </div>
    </ChartCard>
  );
}
