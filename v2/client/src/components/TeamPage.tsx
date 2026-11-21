import { useEffect } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Users } from "lucide-react";
import { ResponsiveActionMenu } from "./ResponsiveActionMenu";

interface TeamPageProps {
  onBack: () => void;
  onOpenDashboard: () => void;
  onOpenRtl: () => void;
  onOpenAnnouncement: () => void;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  responsibility: string;
  photo: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Bagaskara Bisma Anoka",
    role: "Project Lead",
    initials: "BB",
    photo: "/gallery/optimized/foto-bagaskara-bisma-anoka.jpeg",
    responsibility:
      "Mengoordinasikan tim, menjaga arah riset 7 KAIH, dan memastikan setiap bagian proyek berjalan selaras.",
  },
  {
    name: "Rei Dillan Hartedi",
    role: "Dashboard Lead",
    initials: "RD",
    photo: "/gallery/optimized/foto-rei-dillan-hartedi.jpeg",
    responsibility:
      "Mengembangkan dashboard serta visualisasi data agar hasil pemantauan mudah dibaca dan ditindaklanjuti.",
  },
  {
    name: "Kenzie Dzakwan Ibrahim",
    role: "Presentation Lead",
    initials: "KD",
    photo: "/gallery/optimized/foto-kenzie-dzakwan-ibrahim.jpeg",
    responsibility:
      "Menyusun alur presentasi dan narasi yang runtut, jelas, serta relevan untuk dewan juri VERTIKAL SMA 2026.",
  },
  {
    name: "Jesslyn Quinn Gabrielle Sitorus",
    role: "Data Analyst",
    initials: "JQ",
    photo: "/gallery/optimized/foto-jesslyn-quinn-gabrielle-sitorus.jpeg",
    responsibility:
      "Mengolah dan memvalidasi jawaban survei 7 KAIH agar ringkasan dan perbandingan data tersaji akurat.",
  },
  {
    name: "Mohammad Arsa Dafansyah",
    role: "Gemini & Insight Lead",
    initials: "MA",
    photo: "/gallery/optimized/foto-mohammad-arsa-dafansyah.jpeg",
    responsibility:
      "Merancang prompt dan alur kerja AI untuk mendukung riset, analisis, dan proses pengembangan proyek.",
  },
  {
    name: "Ahmad Tirtayasa, S.Pd.",
    role: "Guru Substansi 7 KAIH",
    initials: "AT",
    photo: "/gallery/optimized/foto-ahmad-tirtayasa.jpeg",
    responsibility:
      "Memberikan arahan substansi 7 KAIH agar pemantauan dan analisis sesuai dengan tujuan pembiasaan siswa.",
  },
  {
    name: "Nur Adillawati Kosim Saputri, M.Pd.",
    role: "Guru Pendamping",
    initials: "NA",
    photo: "/gallery/optimized/foto-nur-adillawati-kosim-saputri.jpeg",
    responsibility:
      "Mendampingi tim dalam pelaksanaan proyek dan pengembangan dashboard monitoring 7 KAIH.",
  },
];

function TeamPhoto({ member, index }: { member: TeamMember; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`team-photo team-photo-${index + 1}`}>
      {!failed ? (
        <img
          alt={`Foto ${member.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
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
  );
}

export function TeamPage({
  onBack,
  onOpenDashboard,
  onOpenRtl,
  onOpenAnnouncement,
}: TeamPageProps) {
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
        <ResponsiveActionMenu
          ariaLabel="Navigasi halaman"
          actions={[
            { label: "Rencana RTL", onSelect: onOpenRtl },
            { label: "Pengumuman", onSelect: onOpenAnnouncement },
            { label: "Buka dashboard", onSelect: onOpenDashboard },
          ]}
        />
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
              <TeamPhoto index={index} member={member} />
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
