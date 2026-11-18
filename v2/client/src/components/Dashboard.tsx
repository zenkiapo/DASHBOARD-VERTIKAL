import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Clock3,
  FileDown,
  GraduationCap,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { fetchDashboardSummary } from "../lib/api";
import { fetchCurrentSession, logoutCurrentSession } from "../lib/policyNotesApi";
import type { DashboardFilters, DashboardSummary } from "../types/dashboard";
import type { AuthSession } from "../types/policyNotes";
import { FilterBar } from "./FilterBar";
import { KpiCards } from "./KpiCards";
import { PolicyNotesPanel } from "./PolicyNotesPanel";
import { DemographicsDonutChart } from "./charts/DemographicsDonutChart";
import { GradeComparisonBarChart } from "./charts/GradeComparisonBarChart";
import { HabitPriorityBarChart } from "./charts/HabitPriorityBarChart";
import { HabitRadarChart } from "./charts/HabitRadarChart";
import { HabitTrendLineChart } from "./charts/HabitTrendLineChart";
import { LikertDistributionChart } from "./charts/LikertDistributionChart";

const emptyFilters: DashboardFilters = {
  kelas: "",
  rombel: "",
  jenisKelamin: "",
  periode: "",
};

function formatUpdatedAt(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface DashboardProps {
  onBack: () => void;
}

export function Dashboard({ onBack }: DashboardProps) {
  const [filters, setFilters] = useState(emptyFilters);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const sessionUserId = session?.user.id;
  const lockedClass =
    session?.user.role === "WALI_KELAS" ? session.user.assignedClass : null;
  const isStudent = session?.user.role === "SISWA";

  useEffect(() => {
    let active = true;
    fetchCurrentSession()
      .then((currentSession) => {
        if (!active) return;
        setSession(currentSession);
        if (
          currentSession?.user.role === "WALI_KELAS" &&
          currentSession.user.assignedClass
        ) {
          const assignedClass = currentSession.user.assignedClass;
          setFilters({
            ...emptyFilters,
            kelas: assignedClass.split("-")[0] ?? "",
            rombel: assignedClass,
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setAuthError(
            cause instanceof Error ? cause.message : "Sesi tidak dapat diperiksa.",
          );
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      setLoading(false);
      setSummary(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const timeout = window.setTimeout(() => {
      fetchDashboardSummary(filters, controller.signal)
        .then((result) => {
          setSummary(result);
          setUpdatedAt(new Date());
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(
            cause instanceof Error
              ? cause.message
              : "Data dashboard tidak dapat dimuat.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, sessionUserId]);

  const changeSession = (nextSession: AuthSession | null) => {
    setSession(nextSession);
    if (nextSession?.user.role === "WALI_KELAS" && nextSession.user.assignedClass) {
      const assignedClass = nextSession.user.assignedClass;
      const grade = assignedClass.split("-")[0] ?? "";
      setFilters({
        ...emptyFilters,
        kelas: grade,
        rombel: assignedClass,
      });
    } else {
      setFilters({ ...emptyFilters });
    }
  };
  const signOut = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logoutCurrentSession();
      changeSession(null);
    } catch (cause) {
      setLogoutError(
        cause instanceof Error ? cause.message : "Tidak dapat keluar dari akun.",
      );
    } finally {
      setLoggingOut(false);
    }
  };
  const resetFilters = () =>
    setFilters({
      ...emptyFilters,
      ...(lockedClass
        ? { kelas: lockedClass.split("-")[0] ?? "", rombel: lockedClass }
        : {}),
    });
  const expectedClass = filters.rombel.trim() || filters.kelas || null;
  const canExport =
    !isStudent &&
    summary !== null &&
    !summary.isStale &&
    !loading &&
    summary.dataSource === "google-sheets" &&
    summary.appliedFilters.kelas === expectedClass &&
    summary.appliedFilters.jenisKelamin === (filters.jenisKelamin || null) &&
    String(summary.appliedFilters.periode ?? "") === filters.periode;
  const exportReport = async () => {
    if (!summary || !canExport) return;
    try {
      const { exportDashboardReport } = await import("../lib/exportReport");
      exportDashboardReport(summary);
      setExportError(null);
    } catch (cause) {
      setExportError(
        cause instanceof Error ? cause.message : "PDF gagal dibuat.",
      );
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <button className="brand" onClick={onBack} type="button" aria-label="Kembali ke beranda">
          <span className="back-home-icon"><ArrowLeft size={15} /></span>
          <span className="brand-mark"><img src="https://sman2cibinong.sch.id/images/logo.png" alt="" /></span>
          <span>
            <strong>SMAN 2 CIBINONG</strong>
            <small>Kembali ke beranda</small>
          </span>
        </button>
        <div className="topbar-meta">
          <span className="live-dot" />
          <span>{summary ? "Google Sheets" : "Menunggu data"}</span>
          <span className="meta-divider" />
          <span>VERTIKAL SMA 2026</span>
          {!isStudent && (
            <button
              className="export-button"
              disabled={!canExport}
              onClick={exportReport}
              type="button"
            >
              <FileDown size={15} />
              Ekspor PDF
            </button>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {logoutError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={19} />
            <div>
              <strong>Gagal keluar</strong>
              <span>{logoutError}</span>
            </div>
            <button type="button" onClick={() => setLogoutError(null)}>Tutup</button>
          </div>
        )}
        {session && (
          <section
            className={`dashboard-account-banner${isStudent ? " is-student" : ""}`}
            aria-label="Informasi akun aktif"
          >
            <span className="dashboard-account-avatar" aria-hidden="true">
              <GraduationCap size={21} />
            </span>
            <div className="dashboard-account-details">
              <span className="dashboard-account-kicker">AKUN AKTIF</span>
              <strong>{isStudent ? "Siswa" : session.user.name}</strong>
              <span className="dashboard-account-role">
                {isStudent ? "Akses dashboard siswa" : session.user.role.replaceAll("_", " ")}
                {!isStudent && session.user.assignedClass
                  ? ` · ${session.user.assignedClass}`
                  : ""}
              </span>
            </div>
            <button
              aria-label="Keluar dari akun"
              className="dashboard-logout-button"
              disabled={loggingOut}
              onClick={signOut}
              type="button"
            >
              <LogOut size={15} />
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </section>
        )}
        <section className="page-heading">
          <div>
            <span className="eyebrow">DECISION SUPPORT SYSTEM · SMAVO</span>
            <h1>Monitoring 7 Kebiasaan Anak Indonesia Hebat</h1>
            <p>
              Pantau kebiasaan siswa, temukan area prioritas, dan ikuti perubahan
              pada setiap pengukuran.
            </p>
          </div>
          <div className="period-badge">
            <span className="period-badge-icon"><BarChart3 size={17} /></span>
            <span><strong>4 checkpoint</strong><small>Periode pemantauan</small></span>
          </div>
        </section>

        {authLoading ? (
          <section className="loading-panel panel" aria-live="polite">
            <span className="loading-spinner" />
            <span>Memeriksa sesi...</span>
          </section>
        ) : session ? (
          <FilterBar
            classFilterLocked={Boolean(lockedClass)}
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
          />
        ) : (
          <>
            {authError && (
              <div className="error-banner" role="alert">
                <AlertCircle size={19} />
                <div>
                  <strong>Sesi tidak dapat diperiksa</strong>
                  <span>{authError}</span>
                </div>
                <button type="button" onClick={() => window.location.reload()}>
                  <RefreshCw size={15} /> Coba lagi
                </button>
              </div>
            )}
            <div className="policy-login-entry">
              <PolicyNotesPanel onSessionChange={changeSession} session={session} />
            </div>
          </>
        )}

        {exportError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={19} />
            <div>
              <strong>PDF gagal dibuat</strong>
              <span>{exportError}</span>
            </div>
            <button type="button" onClick={() => setExportError(null)}>Tutup</button>
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={19} />
            <div>
              <strong>Data belum dapat ditampilkan</strong>
              <span>{error}. Pastikan API berjalan di port 4000.</span>
            </div>
            <button type="button" onClick={() => setFilters({ ...filters })}>
              <RefreshCw size={15} /> Coba lagi
            </button>
          </div>
        )}

        {summary?.isStale && (
          <div className="stale-data-banner" role="status">
            <Clock3 size={17} />
            <span>
              Google Sheets sedang tidak dapat diperbarui. Data tervalidasi terakhir
              ditampilkan sementara.
            </span>
          </div>
        )}

        {session && loading && !summary ? (
          <section className="loading-panel panel" aria-live="polite">
            <span className="loading-spinner" />
            <span>Mengambil ringkasan survei…</span>
          </section>
        ) : session && summary ? (
          <>
            <div className="section-caption">
              <div>
                <span className="eyebrow">RINGKASAN EKSEKUTIF</span>
                <h2>Gambaran umum</h2>
              </div>
              <span className="update-label">
                {loading ? "Memperbarui…" : updatedAt ? `Diperbarui ${formatUpdatedAt(updatedAt)}` : ""}
              </span>
            </div>
            <KpiCards summary={summary} />

            {loading && <div className="refresh-strip">Memperbarui data sesuai filter…</div>}

            <div className="chart-grid chart-grid-overview">
              <DemographicsDonutChart
                data={summary.demographics.kelas}
                total={summary.totalRespondents}
              />
              <HabitRadarChart data={summary.habits} />
              <HabitPriorityBarChart data={summary.habits} />
            </div>
            <div className="chart-grid chart-grid-analysis">
              <LikertDistributionChart data={summary.distribution} />
              <GradeComparisonBarChart data={summary.gradeComparison} />
            </div>
            <div className={`chart-grid chart-grid-trends${isStudent ? " chart-grid-student" : ""}`}>
              <HabitTrendLineChart data={summary.trends} />
              {!isStudent && (
                <PolicyNotesPanel onSessionChange={changeSession} session={session} />
              )}
            </div>
          </>
        ) : session ? (
          !error && <div className="loading-panel panel">Menyiapkan dashboard…</div>
        ) : null}
        {session && session.user.role !== "SISWA" && !summary && (
          <div className="policy-notes-fallback">
            <PolicyNotesPanel onSessionChange={changeSession} session={session} />
          </div>
        )}
      </div>
      <footer className="footer">
        <span>SMAVO · 7 Kebiasaan Anak Indonesia Hebat</span>
        <span>VERTIKAL SMA 2026</span>
      </footer>
    </main>
  );
}
