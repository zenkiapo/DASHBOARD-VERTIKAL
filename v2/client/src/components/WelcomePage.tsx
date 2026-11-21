import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Heart,
  Moon,
  Sunrise,
  Utensils,
  Users,
} from "lucide-react";

interface WelcomePageProps {
  onOpenDashboard: () => void;
  onOpenTeam: () => void;
  onOpenLogin: () => void;
}

const habits = [
  { title: "Bangun Pagi", icon: Sunrise, note: "Memulai hari dengan disiplin" },
  { title: "Beribadah", icon: Heart, note: "Membangun karakter dan spiritualitas" },
  { title: "Berolahraga", icon: Activity, note: "Menjaga tubuh tetap sehat dan aktif" },
  { title: "Makan Sehat dan Bergizi", icon: Utensils, note: "Memilih asupan yang seimbang" },
  { title: "Gemar Belajar", icon: BookOpen, note: "Menumbuhkan rasa ingin tahu" },
  { title: "Bermasyarakat", icon: Users, note: "Peduli dan berkontribusi bagi sesama" },
  { title: "Tidur Cepat", icon: Moon, note: "Memberi waktu cukup untuk beristirahat" },
];

// Foto sekolah berizin menggunakan nama file lokal; gradien tetap menjadi fallback.
const gallery = [
  {
    title: "Awali hari dengan semangat",
    caption: "Kebiasaan pagi dan kesiapan belajar",
    className: "scene-morning",
    img: "/gallery/scene-morning.jpg",
    tag: "DISIPLIN DIRI",
  },
  {
    title: "Aktif bergerak bersama",
    caption: "Olahraga untuk tubuh yang bugar",
    className: "scene-sport",
    img: "/gallery/scene-sport.jpg",
    tag: "HIDUP SEHAT",
  },
  {
    title: "Tumbuh lewat pembelajaran",
    caption: "Belajar, membaca, dan bereksplorasi",
    className: "scene-study",
    img: "/gallery/scene-study.jpg",
    tag: "GEMAR BELAJAR",
  },
  {
    title: "Peduli di lingkungan sekitar",
    caption: "Membangun kebersamaan dan kepedulian",
    className: "scene-community",
    img: "/gallery/scene-community.jpg",
    tag: "BERMASYARAKAT",
  },
];

export function WelcomePage({ onOpenDashboard, onOpenTeam, onOpenLogin }: WelcomePageProps) {
  return (
    <main className="welcome-page">
      <header className="welcome-nav">
        <a className="welcome-brand" href="#beranda" aria-label="SMAN 2 Cibinong">
          <span className="welcome-brand-mark">
            <img src="https://sman2cibinong.sch.id/images/logo.png" alt="" />
          </span>
          <span>
            <strong>SMAN 2 CIBINONG</strong>
            <small>SMAVO · Tumbuh bersama kebiasaan baik</small>
          </span>
        </a>
        <nav className="welcome-links" aria-label="Navigasi utama">
          <a href="#tentang">Tentang 7 KAIH</a>
          <a href="#kebiasaan">7 Kebiasaan</a>
          <a href="#galeri">Galeri</a>
          <button
            aria-label="Buka halaman Tim Pengembang"
            className="welcome-team-link"
            onClick={onOpenTeam}
            type="button"
          >
            <Users aria-hidden="true" size={14} />
            <span>Tim Pengembang</span>
          </button>
          <button
            aria-label="Masuk sebagai petugas"
            className="welcome-team-link"
            onClick={onOpenLogin}
            type="button"
          >
            <span>Masuk</span>
          </button>
        </nav>
        <button className="welcome-nav-cta" onClick={onOpenDashboard} type="button">
          <span>Buka dashboard</span><ArrowRight size={15} />
        </button>
      </header>

      <section className="welcome-hero" id="beranda">
        <div className="welcome-hero-content">
          <span className="welcome-kicker"><span /> PROGRAM KARAKTER · SMAN 2 CIBINONG</span>
          <h1>
            Kebiasaan baik,
            <br />
            <em>masa depan hebat.</em>
          </h1>
          <p>
            Mengenal dan memantau 7 Kebiasaan Anak Indonesia Hebat sebagai
            langkah kecil untuk membentuk generasi yang sehat, tangguh, dan
            berkarakter.
          </p>
          <div className="welcome-actions">
            <button className="welcome-primary" onClick={onOpenDashboard} type="button">
              Lihat dashboard monitoring <ArrowRight size={16} />
            </button>
            <a className="welcome-secondary" href="#tentang">
              Kenali program <ArrowDown size={15} />
            </a>
          </div>
          <div className="welcome-hero-stats">
            <div><strong>7</strong><span>kebiasaan positif</span></div>
            <i />
            <div><strong>4</strong><span>checkpoint pengukuran</span></div>
            <i />
            <div><strong>1</strong><span>langkah lebih baik setiap hari</span></div>
          </div>
        </div>
        <div className="welcome-hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-sun" />
          <div className="hero-land land-back" />
          <div className="hero-land land-front" />
          <div className="hero-card hero-card-top"><Sunrise size={18} /><span>Mulai hari<br /><b>dengan semangat</b></span></div>
          <div className="hero-card hero-card-bottom"><Heart size={17} /><span>Bangun kebiasaan,<br /><b>tumbuhkan karakter</b></span></div>
          <div className="hero-art-label">7 KAIH <span>SMAVO</span></div>
        </div>
        <div className="hero-scroll-cue"><span /> GULIR UNTUK MENJELAJAH</div>
      </section>

      <section className="welcome-intro" id="tentang">
        <div className="welcome-intro-mark"><span>7</span><i>KAIH</i></div>
        <div className="welcome-intro-copy">
          <span className="welcome-section-kicker">TENTANG PROGRAM</span>
          <h2>Membiasakan hal baik,<br />setiap hari di SMAVO.</h2>
        </div>
        <p>
          Di SMAN 2 Cibinong, 7 KAIH dipantau sebagai bagian dari VERTIKAL SMA
          2026. Jawaban atas 35 butir pernyataan diolah secara agregat dan anonim
          untuk membaca perkembangan kebiasaan serta membantu sekolah menentukan
          tindak lanjut.
        </p>
      </section>

      <section className="methodology-section" id="metode">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-section-kicker">METODOLOGI MONITORING · VERTIKAL SMA 2026</span>
            <h2>Dari kebiasaan menuju bukti.</h2>
          </div>
          <p>
            Pemantauan membantu warga sekolah membaca perkembangan dengan
            indikator yang konsisten, bukan sekadar kesan sesaat.
          </p>
        </div>
        <div className="methodology-grid">
          <article className="method-card">
            <span className="method-icon"><ClipboardList size={19} /></span>
            <span className="method-value">35 <small>butir</small></span>
            <h3>Instrumen terstruktur</h3>
            <p>Instrumen terdiri atas 35 butir pernyataan: 5 pernyataan untuk setiap kebiasaan.</p>
          </article>
          <article className="method-card">
            <span className="method-icon"><ChartNoAxesCombined size={19} /></span>
            <span className="method-value">4 <small>pilihan</small></span>
            <h3>Skala Likert</h3>
            <p>Frekuensi perilaku dicatat secara konsisten dari Tidak Pernah hingga Selalu.</p>
            <div className="likert-pills">
              <span>1 · Tidak Pernah</span><span>2 · Jarang</span>
              <span>3 · Sering</span><span>4 · Selalu</span>
            </div>
          </article>
          <article className="method-card method-period">
            <span className="method-icon"><CalendarDays size={19} /></span>
            <span className="method-value">4 <small>checkpoint</small></span>
            <h3>Pemantauan berkala</h3>
            <p>Rangkaian pengukuran dua pekan untuk melihat pola dan perubahan, bukan hanya satu potret.</p>
            <div className="checkpoint-list">
              <span><b>01</b> 4 Nov</span><span><b>02</b> 6 Nov</span>
              <span><b>03</b> 9 Nov</span><span><b>04</b> 12 Nov 2026</span>
            </div>
          </article>
        </div>
        <div className="method-footer">
          <span className="method-footer-mark"><Users size={17} /></span>
          <p>
            Cakupan pemantauan meliputi <strong>Kelas X, XI, dan XII</strong>.
            Ringkasan dashboard mengolah data menurut jenjang, rombel, jenis
            kelamin, dan periode.
          </p>
        </div>
      </section>

      <section className="habit-section" id="kebiasaan">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-section-kicker">DARI PAGI HINGGA MALAM</span>
            <h2>7 kebiasaan, satu tujuan.</h2>
          </div>
          <p>Rutinitas yang saling melengkapi untuk mendukung tumbuh kembang siswa.</p>
        </div>
        <div className="welcome-habit-grid">
          {habits.map(({ title, icon: Icon, note }, index) => (
            <article className="welcome-habit-card" key={title}>
              <span className="habit-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="habit-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section" id="galeri">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-section-kicker">CERITA KEBIASAAN BAIK</span>
            <h2>Galeri kegiatan.</h2>
          </div>
          <p>Ruang untuk menampilkan momen kebiasaan baik warga SMAN 2 Cibinong.</p>
        </div>
        <div className="welcome-gallery-grid">
          {gallery.map(({ title, caption, className, img, tag }, index) => (
            <article className={`gallery-card ${className}`} key={title}>
              <div className="gallery-art">
                <span className="gallery-art-orb" />
                <span className="gallery-art-shape shape-one" />
                <span className="gallery-art-shape shape-two" />
                <img
                  src={img}
                  alt={title}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <span className="gallery-art-number">0{index + 1}</span>
              </div>
              <div className="gallery-caption">
                <span>{tag}</span>
                <h3>{title}</h3>
                <p>{caption}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="gallery-note">
          Momen kebiasaan baik yang tumbuh bersama warga SMAN 2 Cibinong.
        </p>
      </section>

      <section className="welcome-close">
        <span className="welcome-section-kicker">LANGKAH BERIKUTNYA</span>
        <h2>Lihat perkembangan,<br />rencanakan dampak.</h2>
        <p>Jelajahi ringkasan, tren, dan area prioritas 7 KAIH di SMAVO.</p>
        <button className="welcome-primary" onClick={onOpenDashboard} type="button">
          Masuk ke dashboard <ArrowRight size={16} />
        </button>
      </section>
      <footer className="welcome-footer">
        <span>SMAN 2 Cibinong · SMAVO</span>
        <span>7 Kebiasaan Anak Indonesia Hebat · VERTIKAL SMA 2026</span>
      </footer>
    </main>
  );
}
