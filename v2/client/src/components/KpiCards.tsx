import { Activity, ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import type { DashboardSummary } from "../types/dashboard";

interface KpiCardsProps {
  summary: DashboardSummary;
}

function scoreText(score: number | null): string {
  return score === null ? "—" : score.toFixed(2);
}

export function KpiCards({ summary }: KpiCardsProps) {
  const gradeCoverage = summary.demographics.kelas
    .filter((item) => item.label.startsWith("Kelas "))
    .map((item) => item.label.replace("Kelas ", ""))
    .join(" · ");

  const cards = [
    {
      label: "Total responden",
      value: summary.totalRespondents.toLocaleString("id-ID"),
      note: `Cakupan kelas ${gradeCoverage || "X · XI · XII"}`,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Indeks keseluruhan",
      value: scoreText(summary.overallIndex),
      note: "Rata-rata setara 7 kebiasaan · skala 1–4",
      icon: Activity,
      tone: "violet",
    },
    {
      label: "Kebiasaan tertinggi",
      value: summary.highestHabit?.score === null || !summary.highestHabit
        ? "—"
        : summary.highestHabit.score.toFixed(2),
      note: summary.highestHabit?.habit ?? "Belum ada data",
      icon: ArrowUpRight,
      tone: "green",
    },
    {
      label: "Prioritas penguatan",
      value: summary.priorityHabit?.score === null || !summary.priorityHabit
        ? "—"
        : summary.priorityHabit.score.toFixed(2),
      note: summary.priorityHabit?.habit ?? "Belum ada data",
      icon: ArrowDownRight,
      tone: "amber",
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <article className={`panel kpi-card kpi-${tone}`} key={label}>
          <div className="kpi-top">
            <span>{label}</span>
            <span className="kpi-icon">
              <Icon size={18} />
            </span>
          </div>
          <strong className="kpi-value">{value}</strong>
          <p>{note}</p>
        </article>
      ))}
    </div>
  );
}
