import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";
import type { HabitScore } from "../../types/dashboard";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

const config: ChartConfig = {
  score: { label: "Skor kebiasaan", color: "#4c6fff" },
  target: { label: "Target sekolah", color: "#ee9d35" },
};

export function HabitRadarChart({ data }: { data: HabitScore[] }) {
  const chartData = data.map((item) => ({
    habit: item.habit,
    score: item.score,
    target: 3.5,
  }));

  return (
    <ChartCard
      eyebrow="Profil kebiasaan"
      title="Keseimbangan 7 KAIH"
      description="Rata-rata skor dibanding target sekolah 3,50"
    >
      <ChartContainer config={config} className="standard-chart radar-chart">
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#e8edf5" />
          <PolarAngleAxis dataKey="habit" tick={{ fill: "#718096", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 4]} tickCount={5} axisLine={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Radar
            name="Skor kebiasaan"
            dataKey="score"
            stroke="var(--color-score)"
            fill="var(--color-score)"
            fillOpacity={0.22}
            strokeWidth={2}
            connectNulls={false}
          />
        </RadarChart>
      </ChartContainer>
      <ChartLegend config={config} />
    </ChartCard>
  );
}
