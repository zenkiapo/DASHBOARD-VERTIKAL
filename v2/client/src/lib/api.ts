import type { DashboardFilters, DashboardSummary } from "../types/dashboard";
import { apiUrl } from "./apiBase";

export async function fetchDashboardSummary(
  filters: DashboardFilters,
  signal: AbortSignal,
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  const kelas = filters.rombel.trim() || filters.kelas;

  if (kelas) params.set("kelas", kelas);
  if (filters.jenisKelamin) params.set("jenis_kelamin", filters.jenisKelamin);
  if (filters.periode) params.set("periode", filters.periode);

  const query = params.toString();
  const response = await fetch(
    apiUrl(`/api/dashboard/summary${query ? `?${query}` : ""}`),
    { signal, credentials: "include", headers: { Accept: "application/json" } },
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
    throw new Error(
      "API tidak mengonfirmasi sumber Google Sheets. Data tidak ditampilkan agar angka simulasi tidak dianggap sebagai data produksi.",
    );
  }

  return payload as DashboardSummary;
}
