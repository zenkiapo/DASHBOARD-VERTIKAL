import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Camera, ClipboardList, Users } from "lucide-react";

interface TeamPageProps {
  onBack: () => void;
  onOpenDashboard: () => void;
  onOpenRtl: () => void;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  responsibility: string;
  photo?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Bagaskara Bisma Anoka",
    role: "Project Lead",
    initials: "BB",
    responsibility:
      "Mengoordinasikan tim, menjaga arah riset 7 KAIH, dan memastikan setiap bagian proyek berjalan selaras.",
  },
  {
    name: "Rei Dillan Hartedi",
    role: "Dashboard Lead",
    initials: "RD",
    responsibility:
      "Mengembangkan dashboard serta visualisasi data agar hasil pemantauan mudah dibaca dan ditindaklanjuti.",
  },
  {
    name: "Kenzie Dzakwan Ibrahim",
    role: "Presentation Lead",
    initials: "KD",
    responsibility:
      "Menyusun alur presentasi dan narasi yang runtut, jelas, serta relevan untuk dewan juri VERTIKAL SMA 2026.",
  },
  {
    name: "Jesslyn Quinn Gabrielle Sitorus",
    role: "Data Analyst",
    initials: "JQ",
    responsibility:
      "Mengolah dan memvalidasi jawaban survei 7 KAIH agar ringkasan dan perbandingan data tersaji akurat.",
  },
  {
    name: "Mohammad Arsa Dafansyah",
    role: "Gemini & Insight Lead",
    initials: "MA",
    responsibility:
      "Merancang prompt dan alur kerja AI untuk mendukung riset, analisis, dan proses pengembangan proyek.",
  },
  {
    name: "Ahmad Tirtayasa, S.Pd.",
    role: "Guru Substansi 7 KAIH",
    initials: "AT",
    responsibility:
      "Memberikan arahan substansi 7 KAIH agar pemantauan dan analisis sesuai dengan tujuan pembiasaan siswa.",
  },
  {
    name: "Nur Adillawati Kosim Saputri, M.Pd.",
    role: "Guru Pendamping",
    initials: "NA",
    responsibility:
      "Mendampingi tim dalam pelaksanaan proyek dan pengembangan dashboard monitoring 7 KAIH.",
  },
];

export function TeamPage({ onBack, onOpenDashboard, onOpenRtl }: TeamPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="team-page">
      <header className="welcome-nav team-nav">
        <button className="welcome-brand team-brand" onClick={onBack} type="button">
          <span className="welcome-brand-mark">
            <img src="https://sman2cibinong.sch.id/images/logo.png" alt="" />
          </span>
          <span>
            <strong>SMAN 2 CIBINONG</strong>
            <small>SMAVO · VERTIKAL SMA 2026</small>
          </span>
        </button>
        <span className="team-nav-label">
          <Users aria-hidden="true" size={15} />
          Tim Pengembang
        </span>
        <button className="rtl-nav-button" onClick={onOpenRtl} type="button">
          <ClipboardList size={14} /> Rencana RTL
        </button>
        <button className="welcome-nav-cta" onClick={onOpenDashboard} type="button">
          <span>Buka dashboard</span><ArrowRight size={15} />
        </button>
      </header>

      <div className="team-content">
        <button className="team-back-link" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={15} />
          Kembali ke beranda
        </button>

        <section className="team-heading">
          <span className="welcome-section-kicker">SMAVO · VERTIKAL SMA 2026</span>
          <h1>Tim Pengembang</h1>
          <p>
            Kenali tim di balik dashboard monitoring 7 Kebiasaan Anak Indonesia
            Hebat di SMAN 2 Cibinong.
          </p>
        </section>

        <section className="team-grid" aria-label="Anggota tim pengembang">
          {teamMembers.map((member, index) => (
            <article className="team-card" key={member.name}>
              <div className={`team-photo team-photo-${index + 1}`}>
                {member.photo ? (
                  <img
                    alt={`Foto ${member.name}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={member.photo}
                  />
                ) : (
                  <div className="team-photo-placeholder">
                    <span className="team-initials">{member.initials}</span>
                    <Camera aria-hidden="true" size={14} />
                    <small>Foto anggota</small>
                  </div>
                )}
                <span className="team-number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="team-card-content">
                <span className="team-role">{member.role}</span>
                <h2>{member.name}</h2>
                <p>{member.responsibility}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="team-footer-card">
          <span className="team-footer-mark"><Users aria-hidden="true" size={18} /></span>
          <p>
            Satu tim, satu tujuan: menyajikan pemantauan 7 KAIH yang bermakna
            bagi warga SMAVO.
          </p>
          <button className="team-dashboard-link" onClick={onOpenDashboard} type="button">
            Lihat dashboard <ArrowRight aria-hidden="true" size={15} />
          </button>
        </section>
      </div>

      <footer className="welcome-footer">
        <span>SMAN 2 Cibinong · SMAVO</span>
        <span>7 Kebiasaan Anak Indonesia Hebat · VERTIKAL SMA 2026</span>
      </footer>
    </main>
  );
}
