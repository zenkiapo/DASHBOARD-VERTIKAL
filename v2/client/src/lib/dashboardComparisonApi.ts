import type {
  DashboardFilters,
  PeriodComparison,
} from "../types/dashboard";
import { apiUrl } from "./apiBase";

export async function fetchPeriodComparison(
  filters: DashboardFilters,
  fromPeriod: number,
  toPeriod: number,
  signal: AbortSignal,
): Promise<PeriodComparison> {
  const params = new URLSearchParams({
    from: String(fromPeriod),
    to: String(toPeriod),
  });
  const kelas = filters.rombel.trim() || filters.kelas;
  if (kelas) params.set("kelas", kelas);
  if (filters.jenisKelamin) params.set("jenis_kelamin", filters.jenisKelamin);

  const response = await fetch(
    apiUrl(`/api/dashboard/comparison?${params.toString()}`),
    {
      signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Permintaan gagal (${response.status}).`;
    throw new Error(message);
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("dataSource" in payload) ||
    payload.dataSource !== "google-sheets"
  ) {
    throw new Error("Komparasi hanya tersedia untuk data Google Sheets.");
  }
  return payload as PeriodComparison;
}
