import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Home,
  LogIn,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { loginAsDemo, loginWithPassword } from "../lib/policyNotesApi";
import type { UserRole } from "../types/policyNotes";
import { ResponsiveActionMenu } from "./ResponsiveActionMenu";

interface LoginPageProps {
  onBack: () => void;
  onOpenDashboard: () => void;
  onOpenAnnouncement: () => void;
  onOpenRtl: () => void;
  onOpenTeam: () => void;
  onLoginComplete: () => void;
}

const demoRoles: Array<{ role: UserRole; label: string }> = [
  { role: "SISWA", label: "Siswa" },
  { role: "KEPSEK", label: "Kepala Sekolah" },
  { role: "GURU_BK", label: "Guru BK" },
  { role: "WALI_KELAS", label: "Wali Kelas X-1" },
  { role: "ADMIN", label: "Admin" },
];

export function LoginPage({
  onBack,
  onOpenDashboard,
  onOpenAnnouncement,
  onOpenRtl,
  onOpenTeam,
  onLoginComplete,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await loginWithPassword(email.trim(), password);
      setPassword("");
      onLoginComplete();
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
      await loginAsDemo(role);
      onLoginComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login demo gagal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header topbar">
        <span className="login-brand">
          <img src="https://sman2cibinong.sch.id/images/logo.png" alt="" />
          <span><strong>SMAN 2 CIBINONG</strong><small>SMAVO · VERTIKAL SMA 2026</small></span>
        </span>
        <div className="login-nav">
          <ResponsiveActionMenu
            ariaLabel="Navigasi halaman"
            actions={[
              { label: "Beranda", onSelect: onBack, icon: Home },
              { label: "Dashboard", onSelect: onOpenDashboard, icon: BarChart3 },
              { label: "Pengumuman", onSelect: onOpenAnnouncement, icon: Megaphone },
            ]}
            secondaryActions={[
              { label: "Rencana RTL", onSelect: onOpenRtl, icon: ClipboardList },
              { label: "Tim Pengembang", onSelect: onOpenTeam, icon: Users },
            ]}
          />
        </div>
        <button className="login-back-button" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Kembali ke beranda
        </button>
      </header>
      <section className="login-card">
        <span className="login-icon"><ShieldCheck size={22} /></span>
        <span className="eyebrow">AKSES WARGA SEKOLAH</span>
        <h1>Masuk ke akun</h1>
        <p className="login-description">
          Masuk untuk melihat dashboard dan mengakses fitur sesuai peran Anda.
          Halaman publik tetap dapat dibuka tanpa login.
        </p>
        <form className="login-form" onSubmit={signIn}>
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
          <button className="login-submit" disabled={saving} type="submit">
            <LogIn size={15} /> Masuk
          </button>
        </form>
        <div className="login-demo">
          <span>Akun demo</span>
          <div className="login-demo-grid">
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
        {error && <p className="login-error" role="alert">{error}</p>}
      </section>
      <footer className="login-footer">SMAVO · 7 Kebiasaan Anak Indonesia Hebat</footer>
    </main>
  );
}
