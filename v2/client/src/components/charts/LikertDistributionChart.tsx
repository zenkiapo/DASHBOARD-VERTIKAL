import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { DistributionPoint } from "../../types/dashboard";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

const config: ChartConfig = {
  tidakPernah: { label: "Tidak Pernah", color: "#e35d68" },
  jarang: { label: "Jarang", color: "#f3a53b" },
  sering: { label: "Sering", color: "#4c6fff" },
  selalu: { label: "Selalu", color: "#17a98c" },
};

export function LikertDistributionChart({
  data,
}: {
  data: DistributionPoint[];
}) {
  return (
    <ChartCard
      eyebrow="Distribusi jawaban"
      title="Komposisi skala Likert"
      description="Proporsi jawaban untuk setiap kategori kebiasaan"
    >
      <ChartContainer config={config} className="standard-chart distribution-chart">
        <BarChart
          data={data}
          layout="vertical"
          stackOffset="expand"
          margin={{ left: 10, right: 18, top: 4, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#edf0f5" />
          <XAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
          />
          <YAxis
            type="category"
            dataKey="habit"
            width={148}
            tick={{ fill: "#526076", fontSize: 11 }}
          />
          <Tooltip
            content={
              <ChartTooltipContent formatter={(value) => `${value.toFixed(2)}%`} />
            }
          />
          <Bar dataKey="tidakPernah" name="Tidak Pernah" stackId="likert" fill="var(--color-tidakPernah)" />
          <Bar dataKey="jarang" name="Jarang" stackId="likert" fill="var(--color-jarang)" />
          <Bar dataKey="sering" name="Sering" stackId="likert" fill="var(--color-sering)" />
          <Bar dataKey="selalu" name="Selalu" stackId="likert" fill="var(--color-selalu)" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ChartContainer>
      <ChartLegend config={config} />
    </ChartCard>
  );
}
