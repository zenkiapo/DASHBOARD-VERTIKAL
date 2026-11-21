import { useState, type FormEvent } from "react";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import {
  loginAsDemo,
  loginWithPassword,
} from "../lib/policyNotesApi";
import type { AuthSession, UserRole } from "../types/policyNotes";

interface LoginPageProps {
  onBack: () => void;
  onLogin: (session: AuthSession) => void;
  returnTo: string;
}

const demoRoles: Array<{ role: UserRole; label: string }> = [
  { role: "KEPSEK", label: "Kepala Sekolah" },
  { role: "GURU_BK", label: "Guru BK" },
  { role: "WALI_KELAS", label: "Wali Kelas X-1" },
  { role: "ADMIN", label: "Admin" },
];

export function LoginPage({ onBack, onLogin, returnTo }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const session = await loginWithPassword(email.trim(), password);
      onLogin(session);
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
      const session = await loginAsDemo(role);
      onLogin(session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login demo gagal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <button type="button" className="login-back" onClick={onBack}>
          <ArrowLeft size={16} /> Beranda
        </button>
        <span>SMAN 2 Cibinong · Dashboard 7 KAIH</span>
      </header>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-icon" aria-hidden="true"><ShieldCheck size={24} /></div>
        <span className="login-kicker">AREA PETUGAS</span>
        <h1 id="login-title">Masuk ke akun Anda</h1>
        <p>Gunakan akun terdaftar untuk mengakses dashboard sesuai peran.</p>
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
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={saving} type="submit">
            <LogIn size={16} /> {saving ? "Memproses…" : "Masuk"}
          </button>
        </form>
        <div className="login-demo">
          <span>Masuk cepat untuk simulasi peran</span>
          <div>
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
        {returnTo !== "/dashboard" && (
          <small className="login-return">Setelah masuk, Anda akan kembali ke {returnTo}.</small>
        )}
      </section>
    </main>
  );
}
