import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartCard } from "../ChartCard";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";
import type { DashboardSummary } from "../../types/dashboard";

const colors = ["#4c6fff", "#17a98c", "#f3a53b", "#a3adbd"];
const config: ChartConfig = {
  kelasX: { label: "Kelas X", color: colors[0] },
  kelasXI: { label: "Kelas XI", color: colors[1] },
  kelasXII: { label: "Kelas XII", color: colors[2] },
  unknown: { label: "Anonim / tidak diketahui", color: colors[3] },
};

interface Props {
  data: DashboardSummary["demographics"]["kelas"];
  total: number;
}

function colorForLabel(label: string): string {
  if (label === "Kelas X") return colors[0]!;
  if (label === "Kelas XI") return colors[1]!;
  if (label === "Kelas XII") return colors[2]!;
  return colors[3]!;
}

export function DemographicsDonutChart({ data, total }: Props) {
  return (
    <ChartCard
      eyebrow="Cakupan responden"
      title="Sebaran jenjang"
      description="Komposisi siswa menurut kelas"
    >
      <div className="donut-wrap">
        <ChartContainer config={config} className="donut-chart">
          <PieChart>
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value.toLocaleString("id-ID")} siswa`}
                />
              }
            />
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={colorForLabel(entry.label)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="donut-center">
          <strong>{total.toLocaleString("id-ID")}</strong>
          <span>responden</span>
        </div>
      </div>
      <ChartLegend config={config} />
    </ChartCard>
  );
}
