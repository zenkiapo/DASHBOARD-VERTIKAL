import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HABIT_KEYS, type HabitKey, type TrendPoint } from "../../types/dashboard";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

const config: ChartConfig = {
  bangunPagi: { label: "Bangun Pagi", color: "#4c6fff" },
  beribadah: { label: "Beribadah", color: "#17a98c" },
  berolahraga: { label: "Berolahraga", color: "#e35d68" },
  makanSehat: { label: "Makan Sehat dan Bergizi", color: "#f3a53b" },
  gemarBelajar: { label: "Gemar Belajar", color: "#8b69d6" },
  bermasyarakat: { label: "Bermasyarakat", color: "#36a6c8" },
  tidurCepat: { label: "Tidur Cepat", color: "#b2754c" },
};

export function HabitTrendLineChart({ data }: { data: TrendPoint[] }) {
  const [visible, setVisible] = useState<HabitKey[]>([...HABIT_KEYS]);
  const chartData = data.map((point) => ({ periode: point.label, ...point.scores }));

  const toggle = (key: HabitKey) =>
    setVisible((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  return (
    <ChartCard
      eyebrow="Pemantauan longitudinal"
      title="Tren empat pengukuran"
      description="Perubahan rata-rata skor pada setiap checkpoint"
      className="trend-card"
    >
      <ChartContainer config={config} className="standard-chart trend-chart">
        <LineChart data={chartData} margin={{ left: -10, right: 12, top: 12, bottom: 4 }}>
          <CartesianGrid stroke="#edf0f5" />
          <XAxis dataKey="periode" tick={{ fill: "#718096", fontSize: 11 }} />
          <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} width={34} />
          <Tooltip content={<ChartTooltipContent />} />
          {HABIT_KEYS.filter((key) => visible.includes(key)).map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={config[key].label}
              stroke={`var(--color-${key})`}
              strokeWidth={2.2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
      <div className="habit-toggles" aria-label="Pilih kebiasaan untuk ditampilkan">
        {HABIT_KEYS.map((key) => (
          <button
            aria-pressed={visible.includes(key)}
            className={visible.includes(key) ? "habit-toggle active" : "habit-toggle"}
            key={key}
            onClick={() => toggle(key)}
            type="button"
          >
            <i style={{ background: `var(--color-${key})` }} />
            {config[key].label}
          </button>
        ))}
      </div>
    </ChartCard>
  );
}
