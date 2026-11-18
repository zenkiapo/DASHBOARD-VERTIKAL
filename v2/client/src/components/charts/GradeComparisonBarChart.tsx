import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { GradeComparisonPoint } from "../../types/dashboard";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

const config: ChartConfig = {
  kelasX: { label: "Kelas X", color: "#4c6fff" },
  kelasXI: { label: "Kelas XI", color: "#17a98c" },
  kelasXII: { label: "Kelas XII", color: "#f3a53b" },
};

export function GradeComparisonBarChart({
  data,
}: {
  data: GradeComparisonPoint[];
}) {
  return (
    <ChartCard
      eyebrow="Analisis per jenjang"
      title="Perbandingan kelas"
      description="Rata-rata skor tiap kebiasaan · skala 1–4"
    >
      <ChartContainer config={config} className="standard-chart grade-chart">
        <BarChart
          data={data}
          margin={{ left: -12, right: 12, top: 10, bottom: 55 }}
          barGap={2}
        >
          <CartesianGrid vertical={false} stroke="#edf0f5" />
          <XAxis
            dataKey="habit"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={68}
            tick={{ fill: "#718096", fontSize: 10 }}
          />
          <YAxis domain={[0, 4]} tickCount={5} width={34} />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="kelasX" name="Kelas X" fill="var(--color-kelasX)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="kelasXI" name="Kelas XI" fill="var(--color-kelasXI)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="kelasXII" name="Kelas XII" fill="var(--color-kelasXII)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
      <ChartLegend config={config} />
    </ChartCard>
  );
}
