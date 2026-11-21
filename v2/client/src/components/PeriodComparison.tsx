import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from "lucide-react";
import { fetchPeriodComparison } from "../lib/dashboardComparisonApi";
import type {
  DashboardFilters,
  PeriodComparison as PeriodComparisonData,
} from "../types/dashboard";
import { ChartCard } from "./ChartCard";

interface PeriodComparisonProps {
  filters: DashboardFilters;
  enabled: boolean;
  onComparisonChange?: (comparison: PeriodComparisonData | null) => void;
}

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

export function PeriodComparison({
  filters,
  enabled,
  onComparisonChange,
}: PeriodComparisonProps) {
  const [fromPeriod, setFromPeriod] = useState(1);
  const [toPeriod, setToPeriod] = useState(4);
  const [comparison, setComparison] = useState<PeriodComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setComparison(null);
      onComparisonChange?.(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setComparison(null);
    onComparisonChange?.(null);
    fetchPeriodComparison(filters, fromPeriod, toPeriod, controller.signal)
      .then((result) => {
        setComparison(result);
        onComparisonChange?.(result);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setComparison(null);
        onComparisonChange?.(null);
        setError(
          cause instanceof Error ? cause.message : "Komparasi gagal dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [enabled, filters, fromPeriod, toPeriod, onComparisonChange]);

  const updateFrom = (value: number) => {
    setFromPeriod(value);
    if (value === toPeriod) setToPeriod(value === 4 ? 3 : value + 1);
  };
  const updateTo = (value: number) => {
    setToPeriod(value);
    if (value === fromPeriod) setFromPeriod(value === 1 ? 2 : value - 1);
  };

  return (
    <ChartCard
      className="comparison-card"
      description="Delta skor rata-rata tiap kebiasaan dari respons Google Sheets pada filter jenjang/rombel dan jenis kelamin aktif."
      eyebrow="HEAD-TO-HEAD CHECKPOINT"
      title="Komparasi antar periode"
    >
      <div className="comparison-controls">
        <label className="filter-field">
          <span>Dari</span>
          <select
            value={fromPeriod}
            onChange={(event) => updateFrom(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((period) => (
              <option key={period} value={period}>Pengukuran {period}</option>
            ))}
          </select>
        </label>
        <span className="comparison-separator">dibandingkan dengan</span>
        <label className="filter-field">
          <span>Ke</span>
          <select
            value={toPeriod}
            onChange={(event) => updateTo(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((period) => (
              <option key={period} value={period}>Pengukuran {period}</option>
            ))}
          </select>
        </label>
        {loading && <span className="comparison-loading"><RefreshCw size={13} /> Memuat</span>}
      </div>
      {error ? (
        <p className="comparison-empty" role="alert">{error}</p>
      ) : comparison ? (
        <>
          {comparison.isStale && (
            <p className="comparison-stale" role="status">
              Menampilkan data Google Sheets tervalidasi terakhir.
            </p>
          )}
          <div className="comparison-respondents">
            <span>Responden Pengukuran {comparison.fromPeriod}: <strong>{comparison.fromRespondents.toLocaleString("id-ID")}</strong></span>
            <span>Responden Pengukuran {comparison.toPeriod}: <strong>{comparison.toRespondents.toLocaleString("id-ID")}</strong></span>
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Kebiasaan</th>
                  <th>Awal</th>
                  <th>Terkini</th>
                  <th>Delta</th>
                  <th>Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {comparison.habits.map((habit) => (
                  <tr key={habit.key}>
                    <th scope="row">{habit.habit}</th>
                    <td>{score(habit.fromScore)}</td>
                    <td>{score(habit.toScore)}</td>
                    <td className={`comparison-delta comparison-${habit.direction}`}>
                      {habit.direction === "up" ? <ArrowUpRight size={14} /> : null}
                      {habit.direction === "down" ? <ArrowDownRight size={14} /> : null}
                      {habit.direction === "stable" ? <Minus size={13} /> : null}
                      {habit.delta === null ? "—" : `${habit.delta > 0 ? "+" : ""}${habit.delta.toFixed(2)}`}
                    </td>
                    <td>
                      {habit.changePercent === null
                        ? "—"
                        : `${habit.changePercent > 0 ? "+" : ""}${habit.changePercent.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="comparison-footnote">
            Skor berada pada skala 1,00–4,00. Persentase adalah perubahan relatif terhadap skor awal; perbandingan mengabaikan filter periode dashboard.
          </p>
        </>
      ) : (
        <p className="comparison-empty">
          {enabled ? "Menyiapkan komparasi…" : "Masuk untuk melihat perbandingan data."}
        </p>
      )}
    </ChartCard>
  );
}
