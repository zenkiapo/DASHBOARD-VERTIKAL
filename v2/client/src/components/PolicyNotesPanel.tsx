import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  LogIn,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createPolicyNote,
  deletePolicyNote,
  fetchPolicyNotes,
  loginAsDemo,
  loginWithPassword,
  NOTE_STATUS_LABELS,
  updatePolicyContent,
  updatePolicyFollowUp,
} from "../lib/policyNotesApi";
import type {
  AuthSession,
  NoteStatus,
  PolicyNoteContent,
  PolicyNoteDTO,
  UserRole,
} from "../types/policyNotes";
import { ChartCard } from "./ChartCard";

interface PolicyNotesPanelProps {
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
}

const demoRoles: Array<{ role: UserRole; label: string }> = [
  { role: "SISWA", label: "Siswa" },
  { role: "KEPSEK", label: "Kepala Sekolah" },
  { role: "GURU_BK", label: "Guru BK" },
  { role: "WALI_KELAS", label: "Wali Kelas X-1" },
  { role: "ADMIN", label: "Admin" },
];

const habitOptions = [
  "Semua",
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
];

function emptyDraft(): PolicyNoteContent {
  return {
    habitCategory: "Semua",
    targetScope: "Seluruh Siswa",
    noteContent: "",
  };
}

interface PolicyNoteCardProps {
  note: PolicyNoteDTO;
  session: AuthSession;
  onUpdated: (note: PolicyNoteDTO) => void;
  onDeleted: (id: string) => void;
  onError: (message: string) => void;
}

function PolicyNoteCard({
  note,
  session,
  onUpdated,
  onDeleted,
  onError,
}: PolicyNoteCardProps) {
  const canEditPolicy = session.user.role === "KEPSEK" || session.user.role === "ADMIN";
  const canUpdateFollowUp =
    session.user.role === "GURU_BK" || session.user.role === "ADMIN";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<PolicyNoteContent>({
    habitCategory: note.habitCategory,
    targetScope: note.targetScope,
    noteContent: note.noteContent,
  });
  const [status, setStatus] = useState<NoteStatus>(note.status);
  const [followUpNote, setFollowUpNote] = useState(note.followUpNote ?? "");

  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await updatePolicyContent(note.id, content);
      onUpdated(updated);
      setEditing(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Catatan gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  const saveFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await updatePolicyFollowUp(note.id, {
        status,
        followUpNote: followUpNote.trim() || null,
      });
      onUpdated(updated);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Tindak lanjut gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async () => {
    if (!window.confirm("Hapus catatan kebijakan ini?")) return;
    setSaving(true);
    try {
      await deletePolicyNote(note.id);
      onDeleted(note.id);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Catatan gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="policy-note">
      <header className="policy-note-heading">
        <div>
          <span className="policy-note-category">{note.habitCategory}</span>
          <span className={`policy-status policy-status-${note.status.toLowerCase()}`}>
            {NOTE_STATUS_LABELS[note.status]}
          </span>
        </div>
        {canEditPolicy && !editing && (
          <div className="policy-note-actions">
            <button
              aria-label={`Edit catatan ${note.habitCategory}`}
              className="policy-icon-button"
              onClick={() => setEditing(true)}
              type="button"
            >
              <Pencil size={14} />
            </button>
            <button
              aria-label={`Hapus catatan ${note.habitCategory}`}
              className="policy-icon-button policy-delete-button"
              disabled={saving}
              onClick={removeNote}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </header>
      <div className="policy-note-scope">Sasaran: {note.targetScope}</div>

      {editing ? (
        <form className="policy-form policy-edit-form" onSubmit={saveContent}>
          <label>
            Kebiasaan
            <select
              onChange={(event) =>
                setContent({ ...content, habitCategory: event.target.value })
              }
              value={content.habitCategory}
            >
              {habitOptions.map((habit) => <option key={habit}>{habit}</option>)}
            </select>
          </label>
          <label>
            Sasaran
            <input
              onChange={(event) =>
                setContent({ ...content, targetScope: event.target.value })
              }
              required
              value={content.targetScope}
            />
          </label>
          <label>
            Catatan kebijakan
            <textarea
              onChange={(event) =>
                setContent({ ...content, noteContent: event.target.value })
              }
              required
              rows={3}
              value={content.noteContent}
            />
          </label>
          <div className="policy-form-actions">
            <button className="policy-save-button" disabled={saving} type="submit">
              <Save size={13} /> Simpan
            </button>
            <button
              className="policy-cancel-button"
              onClick={() => setEditing(false)}
              type="button"
            >
              <X size={13} /> Batal
            </button>
          </div>
        </form>
      ) : (
        <p className="policy-note-content">{note.noteContent}</p>
      )}

      {canUpdateFollowUp ? (
        <form className="policy-follow-up" onSubmit={saveFollowUp}>
          <label>
            Status tindak lanjut
            <select
              onChange={(event) => setStatus(event.target.value as NoteStatus)}
              value={status}
            >
              {Object.entries(NOTE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Catatan pendampingan
            <textarea
              onChange={(event) => setFollowUpNote(event.target.value)}
              placeholder="Ringkasan pendampingan atau tindak lanjut..."
              rows={2}
              value={followUpNote}
            />
          </label>
          <button className="policy-save-button" disabled={saving} type="submit">
            <Check size={13} /> Simpan tindak lanjut
          </button>
        </form>
      ) : note.followUpNote ? (
        <div className="policy-follow-up-readonly">
          <strong>Catatan pendampingan</strong>
          <p>{note.followUpNote}</p>
        </div>
      ) : null}
      <footer className="policy-note-meta">
        {note.author.name} · {new Date(note.updatedAt).toLocaleDateString("id-ID")}
      </footer>
    </article>
  );
}

export function PolicyNotesPanel({
  session,
  onSessionChange,
}: PolicyNotesPanelProps) {
  const [notes, setNotes] = useState<PolicyNoteDTO[]>([]);
  const [draft, setDraft] = useState<PolicyNoteContent>(emptyDraft);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setNotes([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchPolicyNotes()
      .then((result) => {
        if (active) setNotes(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Catatan gagal dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onSessionChange(await loginWithPassword(email.trim(), password));
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login gagal.");
    } finally {
      setSaving(false);
    }
  };

  const signInDemo = async (role: UserRole) => {
    setSaving(true);
    setError(null);
    try {
      onSessionChange(await loginAsDemo(role));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login demo gagal.");
    } finally {
      setSaving(false);
    }
  };

  const createNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setError(null);
    try {
      const note = await createPolicyNote(draft);
      setNotes((current) => [note, ...current]);
      setDraft(emptyDraft());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Catatan gagal dibuat.");
    } finally {
      setSaving(false);
    }
  };

  const canCreate =
    session?.user.role === "KEPSEK" || session?.user.role === "ADMIN";

  return (
    <ChartCard
      className="policy-notes-card"
      description="Catat evaluasi, pantau status, dan dokumentasikan pendampingan."
      eyebrow="DECISION SUPPORT"
      title="Catatan Evaluasi & Tindak Lanjut"
    >
      {session ? (
        <>
          {canCreate && (
            <form className="policy-form policy-create-form" onSubmit={createNote}>
              <strong className="policy-form-title"><Plus size={14} /> Catatan kebijakan baru</strong>
              <div className="policy-form-row">
                <label>
                  Kebiasaan
                  <select
                    onChange={(event) =>
                      setDraft({ ...draft, habitCategory: event.target.value })
                    }
                    value={draft.habitCategory}
                  >
                    {habitOptions.map((habit) => <option key={habit}>{habit}</option>)}
                  </select>
                </label>
                <label>
                  Sasaran
                  <input
                    onChange={(event) =>
                      setDraft({ ...draft, targetScope: event.target.value })
                    }
                    placeholder="Seluruh Siswa / Kelas X / X-1"
                    required
                    value={draft.targetScope}
                  />
                </label>
              </div>
              <label>
                Evaluasi / kebijakan
                <textarea
                  onChange={(event) =>
                    setDraft({ ...draft, noteContent: event.target.value })
                  }
                  placeholder="Tulis evaluasi dan tindak lanjut yang disepakati..."
                  required
                  rows={3}
                  value={draft.noteContent}
                />
              </label>
              <button className="policy-save-button" disabled={saving} type="submit">
                <Plus size={14} /> Simpan catatan
              </button>
            </form>
          )}

          {error && <p className="policy-error" role="alert">{error}</p>}
          {loading ? (
            <p className="policy-empty">Memuat catatan kebijakan…</p>
          ) : notes.length ? (
            <div className="policy-note-list">
              {notes.map((note) => (
                <PolicyNoteCard
                  key={note.id}
                  note={note}
                  onDeleted={(id) =>
                    setNotes((current) => current.filter((item) => item.id !== id))
                  }
                  onError={setError}
                  onUpdated={(updated) =>
                    setNotes((current) =>
                      current.map((item) => item.id === updated.id ? updated : item),
                    )
                  }
                  session={session}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <p className="policy-empty">
                Belum ada catatan yang sesuai dengan lingkup akses akun ini.
              </p>
            )
          )}
        </>
      ) : (
        <>
          <p className="policy-login-intro">
            Masuk untuk mengakses catatan sesuai peran. Juri dapat mencoba akun demo
            tanpa memasukkan kata sandi.
          </p>
          <form className="policy-login-form" onSubmit={signIn}>
            <label>
              Email
              <input
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@sekolah.sch.id"
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Kata sandi
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button className="policy-save-button" disabled={saving} type="submit">
              <LogIn size={14} /> Masuk
            </button>
          </form>
          <div className="policy-demo-section">
            <span>1-Click Demo Login</span>
            <div className="policy-demo-grid">
              {demoRoles.map(({ role, label }) => (
                <button
                  disabled={saving}
                  key={role}
                  onClick={() => signInDemo(role)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="policy-error" role="alert">{error}</p>}
        </>
      )}
      <p className="policy-privacy-note">
        Catatan kebijakan berisi tindak lanjut sekolah; jangan mencantumkan
        identitas pribadi siswa. Hasil survei tetap bersifat agregat.
      </p>
    </ChartCard>
  );
}
