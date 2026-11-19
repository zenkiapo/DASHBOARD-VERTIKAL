import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { createRtlPlan, deleteRtlPlan, fetchRtlPlans, updateRtlPlan } from "../lib/rtlApi";
import {
  fetchCurrentSession,
  loginAsDemo,
  loginWithPassword,
  logoutCurrentSession,
} from "../lib/policyNotesApi";
import { recommendationForComparison } from "../data/rtlRecommendations";
import type { DashboardFilters, PeriodComparison } from "../types/dashboard";
import type { AuthSession, NoteStatus, UserRole } from "../types/policyNotes";
import type { RtlPlanDTO, RtlPlanDraft } from "../types/rtl";
import { ChartCard } from "./ChartCard";
import { PeriodComparison as PeriodComparisonPanel } from "./PeriodComparison";

interface RtlPageProps {
  onBack: () => void;
  onOpenDashboard: () => void;
  onOpenTeam: () => void;
}

const emptyFilters: DashboardFilters = {
  kelas: "",
  rombel: "",
  jenisKelamin: "",
  periode: "",
};

const roles: Array<{ value: Exclude<UserRole, "SISWA">; label: string }> = [
  { value: "KEPSEK", label: "Kepala Sekolah" },
  { value: "GURU_BK", label: "Guru BK" },
  { value: "WALI_KELAS", label: "Wali Kelas" },
  { value: "ADMIN", label: "Admin" },
];

const statusLabels: Record<NoteStatus, string> = {
  PENDING: "Rencana",
  IN_PROGRESS: "Proses",
  COMPLETED: "Selesai",
};

const habits = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
];

const demoRoles: Array<{ role: UserRole; label: string }> = [
  { role: "KEPSEK", label: "Kepala Sekolah" },
  { role: "GURU_BK", label: "Guru BK" },
  { role: "WALI_KELAS", label: "Wali Kelas X-1" },
  { role: "ADMIN", label: "Admin" },
];

function emptyDraft(): Omit<RtlPlanDraft, "comparisonFrom" | "comparisonTo"> {
  return {
    habitCategory: habits[0]!,
    targetScope: "Seluruh Siswa",
    planContent: "",
    responsibleRole: "GURU_BK",
    kelas: "",
    jenisKelamin: "",
  };
}

function statusClass(status: NoteStatus): string {
  return `policy-status policy-status-${status.toLowerCase()}`;
}

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

export function RtlPage({ onBack, onOpenDashboard, onOpenTeam }: RtlPageProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plans, setPlans] = useState<RtlPlanDTO[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, NoteStatus>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStudent = session?.user.role === "SISWA";
  const lockedClass =
    session?.user.role === "WALI_KELAS" ? session.user.assignedClass : null;
  const canCreate = session?.user.role === "KEPSEK" || session?.user.role === "ADMIN";
  const activeFilters = useMemo(
    () => ({
      ...filters,
      kelas: lockedClass ? lockedClass.split("-")[0] ?? "" : filters.kelas,
      rombel: lockedClass ?? filters.rombel,
    }),
    [filters, lockedClass],
  );
  const selectedComparisonHabit = comparison?.habits.find(
    (habit) => habit.habit === draft.habitCategory,
  );
  const recommendation = recommendationForComparison(selectedComparisonHabit);

  useEffect(() => {
    let active = true;
    fetchCurrentSession()
      .then((result) => {
        if (active) {
          setSession(result);
          if (result?.user.role === "WALI_KELAS" && result.user.assignedClass) {
            const assignedClass = result.user.assignedClass;
            setFilters({
              ...emptyFilters,
              kelas: assignedClass.split("-")[0] ?? "",
              rombel: assignedClass,
            });
          }
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Sesi tidak dapat diperiksa.");
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
    if (!session || isStudent) {
      setPlans([]);
      setPlansLoading(false);
      return;
    }
    let active = true;
    setPlansLoading(true);
    setError(null);
    fetchRtlPlans()
      .then((result) => {
        if (active) setPlans(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "RTL gagal dimuat.");
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, isStudent]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const next = await loginWithPassword(email.trim(), password);
      setSession(next);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login gagal.");
    } finally {
      setBusy(false);
    }
  };

  const signInDemo = async (role: UserRole) => {
    setBusy(true);
    setError(null);
    try {
      setSession(await loginAsDemo(role));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login demo gagal.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    setError(null);
    try {
      await logoutCurrentSession();
      setSession(null);
      setPlans([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak dapat keluar dari akun.");
    } finally {
      setLoggingOut(false);
    }
  };

  const createPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !comparison ||
      !selectedComparisonHabit ||
      selectedComparisonHabit.fromScore === null ||
      selectedComparisonHabit.toScore === null
    ) return;
    setBusy(true);
    setError(null);
    try {
      const plan = await createRtlPlan({
        ...draft,
        kelas: activeFilters.rombel.trim() || activeFilters.kelas,
        jenisKelamin: activeFilters.jenisKelamin,
        comparisonFrom: comparison.fromPeriod,
        comparisonTo: comparison.toPeriod,
      });
      setPlans((current) => [plan, ...current]);
      setDraft(emptyDraft());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "RTL gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (
    event: FormEvent<HTMLFormElement>,
    plan: RtlPlanDTO,
  ) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const responsibleRole = form.get("responsibleRole");
    if (
      typeof responsibleRole !== "string" ||
      !roles.some((role) => role.value === responsibleRole)
    ) {
      setError("Peran penanggung jawab RTL tidak valid.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRtlPlan(plan.id, {
        habitCategory: String(form.get("habitCategory") ?? ""),
        targetScope: String(form.get("targetScope") ?? ""),
        planContent: String(form.get("planContent") ?? ""),
        responsibleRole: responsibleRole as Exclude<UserRole, "SISWA">,
      });
      setPlans((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "RTL gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (plan: RtlPlanDTO) => {
    const status = statusDrafts[plan.id] ?? plan.status;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRtlPlan(plan.id, { status });
      setPlans((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status RTL gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  const removePlan = async (plan: RtlPlanDTO) => {
    if (!window.confirm(`Hapus RTL ${plan.habitCategory}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteRtlPlan(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "RTL gagal dihapus.");
    } finally {
      setBusy(false);
    }
  };

  const useRecommendation = () =>
    setDraft((current) => ({ ...current, planContent: recommendation }));

  return (
    <main className="rtl-page">
      <header className="topbar">
        <button className="brand" onClick={onBack} type="button" aria-label="Kembali ke beranda">
          <span className="back-home-icon"><ArrowLeft size={15} /></span>
          <span className="brand-mark"><img src="https://sman2cibinong.sch.id/images/logo.png" alt="" /></span>
          <span><strong>SMAN 2 CIBINONG</strong><small>Rencana Tindak Lanjut</small></span>
        </button>
        <nav className="rtl-top-nav" aria-label="Navigasi halaman">
          <button type="button" onClick={onBack}>Beranda</button>
          <button type="button" onClick={onOpenDashboard}>Dashboard</button>
          <button type="button" onClick={onOpenTeam}>Tim Pengembang</button>
        </nav>
      </header>

      <div className="dashboard-content rtl-content">
        <section className="page-heading">
          <div>
            <span className="eyebrow">DECISION SUPPORT · VERTIKAL SMA 2026</span>
            <h1>Rencana Tindak Lanjut 7 KAIH</h1>
            <p>
              Susun rencana berdasarkan perubahan agregat antar checkpoint. Nilai
              perbandingan dihitung di server dari Google Sheets; data siswa
              individual tidak ditampilkan atau disimpan ke dalam RTL.
            </p>
          </div>
          <span className="period-badge">
            <span className="period-badge-icon"><ClipboardList size={17} /></span>
            <span><strong>RTL persistent</strong><small>Disimpan di PostgreSQL</small></span>
          </span>
        </section>

        {authLoading ? (
          <section className="loading-panel panel" aria-live="polite">Memeriksa sesi...</section>
        ) : !session ? (
          <ChartCard
            className="rtl-login-card"
            description="Masuk dengan akun sekolah atau akun demo untuk melihat rencana sesuai peran."
            eyebrow="AKSES BERBASIS PERAN"
            title="Masuk ke workspace RTL"
          >
            <form className="policy-login-form" onSubmit={signIn}>
              <label>Email<input autoComplete="username" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>Kata sandi<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="policy-save-button" disabled={busy} type="submit"><LogIn size={14} /> Masuk</button>
            </form>
            <div className="policy-demo-section">
              <span>Akun demo</span>
              <div className="policy-demo-grid">
                {demoRoles.map(({ role, label }) => (
                  <button disabled={busy} key={role} onClick={() => signInDemo(role)} type="button">{label}</button>
                ))}
              </div>
            </div>
            {error && <p className="policy-error" role="alert">{error}</p>}
          </ChartCard>
        ) : isStudent ? (
          <div className="comparison-empty" role="status">
            Akun siswa tidak memiliki akses ke workspace RTL.
            <button className="dashboard-logout-button" disabled={loggingOut} onClick={signOut} type="button"><LogOut size={14} /> Keluar</button>
          </div>
        ) : (
          <>
            <section className="dashboard-account-banner" aria-label="Informasi akun aktif">
              <span className="dashboard-account-avatar" aria-hidden="true"><Users size={20} /></span>
              <div className="dashboard-account-details">
                <span className="dashboard-account-kicker">AKUN AKTIF</span>
                <strong>{session.user.name}</strong>
                <span className="dashboard-account-role">{session.user.role.replaceAll("_", " ")}{session.user.assignedClass ? ` · ${session.user.assignedClass}` : ""}</span>
              </div>
              <button className="dashboard-logout-button" disabled={loggingOut} onClick={signOut} type="button"><LogOut size={14} /><span>{loggingOut ? "Keluar..." : "Keluar"}</span></button>
            </section>
            <section className="rtl-filter panel" aria-label="Filter komparasi RTL">
              <div className="filter-title">
                <span className="filter-icon"><Users size={17} /></span>
                <div><strong>Filter data komparasi</strong><span>Data tetap agregat</span></div>
              </div>
              <label className="filter-field">
                <span>Jenjang</span>
                <select
                  disabled={Boolean(lockedClass)}
                  value={activeFilters.kelas}
                  onChange={(event) => setFilters({ ...filters, kelas: event.target.value, rombel: "" })}
                >
                  <option value="">Semua jenjang</option><option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option><option value="XII">Kelas XII</option>
                </select>
              </label>
              <label className="filter-field">
                <span>Rombel</span>
                <input
                  disabled={Boolean(lockedClass)}
                  placeholder="Mis. XI-1"
                  value={activeFilters.rombel}
                  onChange={(event) => setFilters({ ...filters, rombel: event.target.value })}
                />
              </label>
              <label className="filter-field">
                <span>Jenis kelamin</span>
                <select
                  value={activeFilters.jenisKelamin}
                  onChange={(event) => setFilters({ ...filters, jenisKelamin: event.target.value })}
                >
                  <option value="">Semua</option><option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </label>
            </section>
            <PeriodComparisonPanel
              enabled={Boolean(session && !isStudent)}
              filters={activeFilters}
              onComparisonChange={setComparison}
            />

            {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => setError(null)}>Tutup</button></div>}
            {canCreate && (
              <ChartCard
                className="rtl-compose-card"
                description="Tetapkan sasaran, penanggung jawab, dan tindak lanjut yang dapat dievaluasi."
                eyebrow="SUSUN RENCANA"
                title="Draf RTL baru"
              >
                <form className="policy-form" onSubmit={createPlan}>
                  <div className="policy-form-row">
                    <label>Kebiasaan
                      <select value={draft.habitCategory} onChange={(event) => setDraft({ ...draft, habitCategory: event.target.value })}>
                        {habits.map((habit) => <option key={habit}>{habit}</option>)}
                      </select>
                    </label>
                    <label>Penanggung jawab
                      <select value={draft.responsibleRole} onChange={(event) => setDraft({ ...draft, responsibleRole: event.target.value as RtlPlanDraft["responsibleRole"] })}>
                        {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <label>Sasaran
                    <input required placeholder="Seluruh Siswa / Kelas X / X-1" value={draft.targetScope} onChange={(event) => setDraft({ ...draft, targetScope: event.target.value })} />
                  </label>
                  {recommendation && (
                    <div className="rtl-recommendation">
                      <strong>Rekomendasi kontekstual</strong>
                      <p>{recommendation}</p>
                      <button className="policy-cancel-button" onClick={useRecommendation} type="button">Gunakan rekomendasi</button>
                    </div>
                  )}
                  <label>Rencana dan indikator tindak lanjut
                    <textarea required maxLength={4000} rows={4} value={draft.planContent} onChange={(event) => setDraft({ ...draft, planContent: event.target.value })} />
                  </label>
                  <button className="policy-save-button" disabled={busy || !comparison || !selectedComparisonHabit || selectedComparisonHabit.fromScore === null || selectedComparisonHabit.toScore === null} type="submit"><Plus size={14} /> Simpan RTL</button>
                  {(!comparison || !selectedComparisonHabit || selectedComparisonHabit.fromScore === null || selectedComparisonHabit.toScore === null) && <span className="rtl-help">Menunggu skor Google Sheets untuk kebiasaan dan checkpoint terpilih.</span>}
                </form>
              </ChartCard>
            )}

            <section className="rtl-list-section">
              <div className="section-caption">
                <div><span className="eyebrow">RENCANA TERSIMPAN</span><h2>Daftar RTL</h2></div>
                <span className="update-label">{plans.length} rencana</span>
              </div>
              {plansLoading ? (
                <p className="policy-empty">Memuat daftar RTL…</p>
              ) : plans.length ? (
                <div className="rtl-plan-grid">
                  {plans.map((plan) => {
                    const canEdit = canCreate;
                    const canChangeStatus =
                      session.user.role === "ADMIN" ||
                      session.user.role === "KEPSEK" ||
                      session.user.role === "GURU_BK" ||
                      session.user.role === plan.responsibleRole;
                    const isEditing = editingId === plan.id;
                    return (
                      <article className="rtl-plan-card panel" key={plan.id}>
                        <header className="policy-note-heading">
                          <div>
                            <span className="policy-note-category">{plan.habitCategory}</span>
                            <span className={statusClass(plan.status)}>{statusLabels[plan.status]}</span>
                          </div>
                          {canEdit && !isEditing && (
                            <div className="policy-note-actions">
                              <button aria-label={`Edit RTL ${plan.habitCategory}`} className="policy-icon-button" onClick={() => setEditingId(plan.id)} type="button"><Pencil size={14} /></button>
                              <button aria-label={`Hapus RTL ${plan.habitCategory}`} className="policy-icon-button policy-delete-button" disabled={busy} onClick={() => removePlan(plan)} type="button"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </header>
                        <div className="policy-note-scope">Sasaran: {plan.targetScope} · Penanggung jawab: {plan.responsibleRole.replaceAll("_", " ")}</div>
                        {isEditing ? (
                          <form className="policy-form policy-edit-form" onSubmit={(event) => saveEdit(event, plan)}>
                            <label>Kebiasaan<select name="habitCategory" defaultValue={plan.habitCategory}>{habits.map((habit) => <option key={habit}>{habit}</option>)}</select></label>
                            <label>Sasaran<input name="targetScope" defaultValue={plan.targetScope} required /></label>
                            <label>Penanggung jawab<select name="responsibleRole" defaultValue={plan.responsibleRole}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
                            <label>Rencana<textarea name="planContent" defaultValue={plan.planContent} maxLength={4000} required rows={4} /></label>
                            <div className="policy-form-actions">
                              <button className="policy-save-button" disabled={busy} type="submit"><Save size={13} /> Simpan</button>
                              <button className="policy-cancel-button" onClick={() => setEditingId(null)} type="button"><X size={13} /> Batal</button>
                            </div>
                          </form>
                        ) : <p className="policy-note-content">{plan.planContent}</p>}
                        <div className="rtl-snapshot">
                          <strong>Snapshot komparasi · Pengukuran {plan.comparisonFrom} → {plan.comparisonTo}</strong>
                          <span className="rtl-snapshot-filter">
                            Filter: {plan.comparison.appliedFilters.kelas ?? "Semua jenjang/rombel"} · {plan.comparison.appliedFilters.jenisKelamin ?? "Semua jenis kelamin"} · {plan.comparison.fromRespondents} → {plan.comparison.toRespondents} responden
                          </span>
                          <div className="rtl-snapshot-scores">
                            {plan.comparison.habits
                              .filter((habit) => habit.habit === plan.habitCategory)
                              .map((habit) => (
                                <span key={habit.key}>{score(habit.fromScore)} → {score(habit.toScore)} ({habit.delta === null ? "—" : `${habit.delta > 0 ? "+" : ""}${habit.delta.toFixed(2)}`})</span>
                              ))}
                          </div>
                        </div>
                        {canChangeStatus && !isEditing && (
                          <div className="rtl-status-editor">
                            <label>Status
                              <select
                                value={statusDrafts[plan.id] ?? plan.status}
                                onChange={(event) => setStatusDrafts({ ...statusDrafts, [plan.id]: event.target.value as NoteStatus })}
                              >
                                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                            </label>
                            <button className="policy-save-button" disabled={busy || (statusDrafts[plan.id] ?? plan.status) === plan.status} onClick={() => updateStatus(plan)} type="button"><Check size={13} /> Perbarui status</button>
                          </div>
                        )}
                        <footer className="policy-note-meta">{plan.author.name} · {new Date(plan.updatedAt).toLocaleDateString("id-ID")}</footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="policy-empty">Belum ada RTL pada lingkup akses akun ini.</p>
              )}
            </section>
            <p className="policy-privacy-note">RTL hanya menyimpan ringkasan agregat antar checkpoint. Hindari memasukkan nama atau identitas pribadi siswa ke dalam rencana.</p>
          </>
        )}
      </div>
      <footer className="footer"><span>SMAVO · 7 Kebiasaan Anak Indonesia Hebat</span><span>VERTIKAL SMA 2026</span></footer>
    </main>
  );
}
