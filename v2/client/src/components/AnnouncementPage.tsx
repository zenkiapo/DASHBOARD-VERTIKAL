import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  LogIn,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  updateAnnouncement,
} from "../lib/announcementsApi";
import {
  fetchCurrentSession,
  logoutCurrentSession,
} from "../lib/policyNotesApi";
import type {
  AnnouncementDTO,
  AnnouncementDraft,
  AnnouncementPriority,
} from "../types/announcements";
import type { AuthSession, UserRole } from "../types/policyNotes";
import { ResponsiveActionMenu } from "./ResponsiveActionMenu";

interface AnnouncementPageProps {
  onBack: () => void;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
  onOpenRtl: () => void;
  onOpenTeam: () => void;
}

const habits = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
];

const emptyDraft = (): AnnouncementDraft => ({
  title: "",
  habitCategory: habits[0]!,
  targetScope: "Seluruh Siswa",
  priority: "NORMAL",
  content: "",
  eventDate: "",
});

const priorityLabels: Record<AnnouncementPriority, string> = {
  LOW: "Informasi",
  NORMAL: "Normal",
  HIGH: "Penting",
};

function isManager(role: UserRole | undefined): boolean {
  return role === "KEPSEK" || role === "GURU_BK" || role === "WALI_KELAS" || role === "ADMIN";
}

function dateLabel(announcement: AnnouncementDTO): string {
  const date = announcement.eventDate ?? announcement.createdAt;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function AnnouncementPage({
  onBack,
  onOpenDashboard,
  onOpenLogin,
  onOpenRtl,
  onOpenTeam,
}: AnnouncementPageProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canManage = isManager(session?.user.role);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      setAnnouncements(await fetchAnnouncements());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengumuman gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCurrentSession()
      .then((result) => {
        if (active) setSession(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Sesi tidak dapat diperiksa.");
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    void loadAnnouncements();
    return () => {
      active = false;
    };
  }, [loadAnnouncements]);

  const signOut = async () => {
    setBusy(true);
    setError(null);
    try {
      await logoutCurrentSession();
      setSession(null);
      cancelEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tidak dapat keluar dari akun.");
    } finally {
      setBusy(false);
    }
  };

  const saveAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const saved = editingId
        ? await updateAnnouncement(editingId, draft)
        : await createAnnouncement(draft);
      setAnnouncements((current) =>
        editingId
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      cancelEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengumuman gagal disimpan.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (announcement: AnnouncementDTO) => {
    setDraft({
      title: announcement.title,
      habitCategory: announcement.habitCategory,
      targetScope: announcement.targetScope,
      priority: announcement.priority,
      content: announcement.content,
      eventDate: announcement.eventDate?.slice(0, 10) ?? "",
    });
    setEditingId(announcement.id);
  };

  function cancelEdit() {
    setDraft(emptyDraft());
    setEditingId(null);
  }

  const removeAnnouncement = async (id: string) => {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAnnouncement(id);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengumuman gagal dihapus.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="rtl-page announcement-page">
      <header className="topbar">
        <button className="brand" onClick={onBack} type="button" aria-label="Kembali ke beranda">
          <span className="back-home-icon"><ArrowLeft size={15} /></span>
          <span className="brand-mark"><img src="https://sman2cibinong.sch.id/images/logo.png" alt="" /></span>
          <span><strong>SMAN 2 CIBINONG</strong><small>Pengumuman 7 KAIH</small></span>
        </button>
        <ResponsiveActionMenu
          ariaLabel="Navigasi halaman"
          actions={[
            { label: "Beranda", onSelect: onBack },
            { label: "Dashboard", onSelect: onOpenDashboard },
            { label: "Rencana RTL", onSelect: onOpenRtl },
            { label: "Tim Pengembang", onSelect: onOpenTeam },
          ]}
        />
      </header>

      <div className="dashboard-content rtl-content announcement-content">
        <section className="page-heading">
          <div>
            <span className="eyebrow">BROADCAST & REMINDER · SMAVO</span>
            <h1>Pengumuman 7 KAIH</h1>
            <p>
              Informasi dan pengingat kebiasaan baik untuk siswa, disusun menurut
              kebiasaan dan sasaran penerima.
            </p>
          </div>
          <span className="period-badge">
            <span className="period-badge-icon"><BellRing size={17} /></span>
            <span><strong>Pengumuman aktif</strong><small>Dapat dibaca publik</small></span>
          </span>
        </section>

        {error && <p className="announcement-error" role="alert">{error}</p>}

        {authLoading ? (
          <section className="loading-panel panel" aria-live="polite">Memeriksa sesi...</section>
        ) : session ? (
          <section className="dashboard-account-banner" aria-label="Informasi akun aktif">
            <span className="dashboard-account-avatar" aria-hidden="true"><Megaphone size={19} /></span>
            <div className="dashboard-account-details">
              <span className="dashboard-account-kicker">AKUN AKTIF</span>
              <strong>{session.user.name}</strong>
              <span className="dashboard-account-role">
                {session.user.role.replaceAll("_", " ")} · {canManage ? "Dapat mengelola pengumuman" : "Akses baca"}
              </span>
            </div>
            <button className="dashboard-logout-button" disabled={busy} onClick={signOut} type="button">
              <LogOut size={14} /><span>Keluar</span>
            </button>
          </section>
        ) : (
          <section className="panel announcement-login">
            <div className="announcement-panel-heading">
              <div><span className="eyebrow">AKSES BERBASIS PERAN</span><h2>Masuk untuk mengelola</h2></div>
              <span className="announcement-read-badge">Baca tetap tersedia tanpa login</span>
            </div>
            <button className="policy-save-button" onClick={onOpenLogin} type="button">
              <LogIn size={14} /> Buka halaman login
            </button>
          </section>
        )}

        {canManage && (
          <section className="panel announcement-form-panel">
            <div className="announcement-panel-heading">
              <div>
                <span className="eyebrow">{editingId ? "PERBARUI SIARAN" : "BROADCAST SEKOLAH"}</span>
                <h2>{editingId ? "Ubah pengumuman" : "Buat pengumuman"}</h2>
              </div>
              {editingId && <button className="announcement-cancel" onClick={cancelEdit} type="button"><X size={14} /> Batal</button>}
            </div>
            <form className="announcement-form" onSubmit={saveAnnouncement}>
              <label className="announcement-field announcement-field-wide">
                Judul
                <input maxLength={120} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label className="announcement-field">
                Kebiasaan 7 KAIH
                <select value={draft.habitCategory} onChange={(event) => setDraft({ ...draft, habitCategory: event.target.value })}>
                  {habits.map((habit) => <option key={habit}>{habit}</option>)}
                </select>
              </label>
              <label className="announcement-field">
                Sasaran
                <input list="announcement-scopes" maxLength={80} required value={draft.targetScope} onChange={(event) => setDraft({ ...draft, targetScope: event.target.value })} />
                <datalist id="announcement-scopes">
                  <option value="Seluruh Siswa" /><option value="Kelas X" /><option value="Kelas XI" /><option value="Kelas XII" />
                </datalist>
              </label>
              <label className="announcement-field">
                Prioritas
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as AnnouncementPriority })}>
                  <option value="LOW">Informasi</option><option value="NORMAL">Normal</option><option value="HIGH">Penting</option>
                </select>
              </label>
              <label className="announcement-field">
                Tanggal kegiatan/pengingat
                <input type="date" value={draft.eventDate} onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })} />
              </label>
              <label className="announcement-field announcement-field-wide">
                Isi pengumuman
                <textarea maxLength={3000} required rows={4} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} />
              </label>
              <div className="announcement-form-actions">
                <span>Maks. 120 karakter untuk judul, 3000 untuk isi.</span>
                <button className="policy-save-button" disabled={busy} type="submit">
                  {editingId ? <Save size={14} /> : <Plus size={14} />}
                  {busy ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Terbitkan"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="announcement-list-section" aria-labelledby="announcement-list-title">
          <div className="announcement-list-heading">
            <div><span className="eyebrow">INFORMASI UNTUK WARGA SEKOLAH</span><h2 id="announcement-list-title">Siaran terbaru</h2></div>
            <span>{announcements.length} pengumuman</span>
          </div>
          {loading ? (
            <div className="loading-panel panel" aria-live="polite">Memuat pengumuman...</div>
          ) : announcements.length === 0 ? (
            <div className="comparison-empty panel">Belum ada pengumuman yang diterbitkan.</div>
          ) : (
            <div className="announcement-list">
              {announcements.map((announcement) => (
                <article className="announcement-card panel" key={announcement.id}>
                  <div className="announcement-card-top">
                    <span className={`announcement-priority priority-${announcement.priority.toLowerCase()}`}>
                      {announcement.priority === "HIGH" && <BellRing size={12} />}
                      {priorityLabels[announcement.priority]}
                    </span>
                    <span className="announcement-date"><CalendarDays size={13} />{dateLabel(announcement)}</span>
                  </div>
                  <div className="announcement-card-tags">
                    <span>{announcement.habitCategory}</span><span>{announcement.targetScope}</span>
                  </div>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <div className="announcement-card-footer">
                    <span>Disampaikan oleh {announcement.author.name}</span>
                    {canManage && (
                      <div className="announcement-actions">
                        <button aria-label={`Ubah ${announcement.title}`} disabled={busy} onClick={() => startEdit(announcement)} type="button"><Pencil size={14} /> Ubah</button>
                        <button aria-label={`Hapus ${announcement.title}`} disabled={busy} onClick={() => void removeAnnouncement(announcement.id)} type="button"><Trash2 size={14} /> Hapus</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
