import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Camera,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Heart,
  Megaphone,
  Moon,
  Sunrise,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { galleryItems, type GalleryItem } from "../data/galleryItems";
import { ProgressiveDisclosureCard } from "./ProgressiveDisclosureCard";
import { ResponsiveActionMenu } from "./ResponsiveActionMenu";

interface WelcomePageProps {
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
  onOpenTeam: () => void;
  onOpenRtl: () => void;
  onOpenAnnouncement: () => void;
}

const habits = [
  {
    title: "Bangun Pagi",
    icon: Sunrise,
    note: "Memulai hari dengan disiplin dan persiapan yang lebih tenang.",
    detail:
      "Rutinitas pagi yang konsisten membantu siswa menyiapkan diri untuk belajar, datang tepat waktu, dan mengikuti kegiatan sekolah dengan lebih siap.",
  },
  {
    title: "Beribadah",
    icon: Heart,
    note: "Menumbuhkan karakter, rasa syukur, dan keteguhan nilai.",
    detail:
      "Pembiasaan ibadah dijalankan sesuai keyakinan masing-masing serta dengan sikap saling menghormati di lingkungan SMAVO yang beragam.",
  },
  {
    title: "Berolahraga",
    icon: Activity,
    note: "Menjaga tubuh tetap aktif dan memberi ruang untuk bergerak.",
    detail:
      "Aktivitas fisik sederhana dan teratur dapat menjadi bagian dari keseharian siswa, baik melalui olahraga bersama maupun jeda aktif.",
  },
  {
    title: "Makan Sehat dan Bergizi",
    icon: Utensils,
    note: "Mengenali pilihan pangan seimbang dan kebiasaan makan sehat.",
    detail:
      "Edukasi gizi dan pilihan makanan yang beragam mendukung siswa membangun perhatian terhadap asupan, hidrasi, dan kesejahteraan diri.",
  },
  {
    title: "Gemar Belajar",
    icon: BookOpen,
    note: "Menumbuhkan rasa ingin tahu dan konsistensi belajar.",
    detail:
      "Membaca, bertanya, berdiskusi, dan merefleksikan pelajaran memberi siswa cara aktif untuk mengembangkan pengetahuan di dalam maupun luar kelas.",
  },
  {
    title: "Bermasyarakat",
    icon: Users,
    note: "Belajar peduli, bekerja sama, dan berkontribusi bagi sesama.",
    detail:
      "Kegiatan kolaboratif, kepedulian terhadap lingkungan, dan gotong royong menguatkan rasa tanggung jawab sebagai bagian dari komunitas sekolah.",
  },
  {
    title: "Tidur Cepat",
    icon: Moon,
    note: "Menjaga waktu istirahat dan mengelola penggunaan gawai.",
    detail:
      "Rutinitas malam yang teratur, jeda dari layar sebelum tidur, dan menyimpan gawai saat beristirahat membantu siswa membangun kebiasaan tidur yang lebih sehat.",
  },
];

function GalleryMedia({
  item,
  number,
  large = false,
}: {
  item: GalleryItem;
  number: number;
  large?: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`gallery-art${large ? " gallery-art-large" : ""}`}>
      {!imageLoaded && (
        <>
          <span className="gallery-art-orb" aria-hidden="true" />
          <span className="gallery-art-shape shape-one" aria-hidden="true" />
          <span className="gallery-art-shape shape-two" aria-hidden="true" />
        </>
      )}
      {item.imageUrl && !imageFailed && (
        <img
          className={imageLoaded ? "is-loaded" : ""}
          src={item.imageUrl}
          alt={item.title}
          loading={large ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageLoaded(false);
            setImageFailed(true);
          }}
        />
      )}
      {!imageLoaded && (
        <div className="gallery-art-placeholder" aria-hidden="true">
          <Camera size={large ? 25 : 20} />
        </div>
      )}
      <span className="gallery-art-number">{String(number).padStart(2, "0")}</span>
    </div>
  );
}

export function WelcomePage({
  onOpenDashboard,
  onOpenLogin,
  onOpenTeam,
  onOpenRtl,
  onOpenAnnouncement,
}: WelcomePageProps) {
  const [selectedGalleryItem, setSelectedGalleryItem] =
    useState<GalleryItem | null>(null);
  const galleryDialogRef = useRef<HTMLDialogElement>(null);
  const selectedGalleryIndex = selectedGalleryItem
    ? galleryItems.findIndex((item) => item.id === selectedGalleryItem.id)
    : -1;

  useEffect(() => {
    const dialog = galleryDialogRef.current;
    if (selectedGalleryItem && dialog && !dialog.open) dialog.showModal();
  }, [selectedGalleryItem]);

  const closeGalleryDialog = useCallback(
    () => galleryDialogRef.current?.close(),
    [],
  );
  const navigateGallery = useCallback((step: number) => {
    setSelectedGalleryItem((current) => {
      if (!current || galleryItems.length === 0) return current;
      const currentIndex = galleryItems.findIndex((item) => item.id === current.id);
      const nextIndex =
        (currentIndex + step + galleryItems.length) % galleryItems.length;
      return galleryItems[nextIndex];
    });
  }, []);

  useEffect(() => {
    if (!selectedGalleryItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGalleryDialog();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateGallery(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateGallery(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeGalleryDialog, navigateGallery, selectedGalleryItem]);

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
        <div className="welcome-nav-center">
          <ResponsiveActionMenu
            ariaLabel="Navigasi utama"
            actions={[
              { label: "7 KAIH", href: "#kebiasaan", icon: Activity },
              { label: "Galeri", href: "#galeri", icon: Camera },
              { label: "Rencana RTL", onSelect: onOpenRtl, icon: ClipboardList },
              { label: "Pengumuman", onSelect: onOpenAnnouncement, icon: Megaphone },
            ]}
            secondaryActions={[
              { label: "Tentang 7 KAIH", href: "#tentang", icon: BookOpen },
              { label: "Tim Pengembang", onSelect: onOpenTeam, icon: Users },
            ]}
          />
        </div>
        <div className="welcome-nav-actions">
          <button className="welcome-login-link" onClick={onOpenLogin} type="button">
            Masuk
          </button>
          <button
            aria-label="Buka dashboard"
            className="welcome-nav-cta"
            onClick={onOpenDashboard}
            type="button"
          >
            <span>Buka dashboard</span><ArrowRight size={15} />
          </button>
        </div>
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
        <div className="welcome-hero-art">
          <img
            src="/gallery/optimized/hero-art.jpg"
            alt="Gedung utama SMAN 2 Cibinong"
          />
          <div className="hero-card hero-card-top">
            <Sunrise size={18} />
            <span>Mulai hari<br /><b>dengan semangat</b></span>
          </div>
          <div className="hero-card hero-card-bottom">
            <Heart size={17} />
            <span>Bangun kebiasaan,<br /><b>tumbuhkan karakter</b></span>
          </div>
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
          2026. Jawaban atas 35 pernyataan diolah secara agregat dan anonim
          untuk membaca pola kebiasaan siswa kelas X, XI, dan XII. Pemantauan
          berkala membantu sekolah melihat area yang perlu diperkuat tanpa
          menjadikan skor sebagai label bagi siswa.
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
          <ProgressiveDisclosureCard
            className="method-card"
            details={<p>Instrumen terdiri atas 35 pernyataan: 5 pernyataan untuk setiap kebiasaan.</p>}
            label="Instrumen terstruktur"
            summary={
              <>
                <span className="method-icon"><ClipboardList size={19} /></span>
                <span className="method-value">35 <small>pernyataan</small></span>
                <h3>Instrumen terstruktur</h3>
              </>
            }
          />
          <ProgressiveDisclosureCard
            className="method-card"
            details={
              <>
                <p>Frekuensi perilaku dicatat secara konsisten dari Tidak Pernah hingga Selalu.</p>
                <div className="likert-pills">
                  <span>1 · Tidak Pernah</span><span>2 · Jarang</span>
                  <span>3 · Sering</span><span>4 · Selalu</span>
                </div>
              </>
            }
            label="Skala Likert"
            summary={
              <>
                <span className="method-icon"><ChartNoAxesCombined size={19} /></span>
                <span className="method-value">4 <small>pilihan</small></span>
                <h3>Skala Likert</h3>
              </>
            }
          />
          <ProgressiveDisclosureCard
            className="method-card method-period"
            details={
              <>
                <p>Rangkaian pengukuran dua pekan untuk melihat pola dan perubahan, bukan hanya satu potret.</p>
                <div className="checkpoint-list">
                  <span><b>01</b> 4 Nov</span><span><b>02</b> 6 Nov</span>
                  <span><b>03</b> 9 Nov</span><span><b>04</b> 12 Nov 2026</span>
                </div>
              </>
            }
            label="Pemantauan berkala"
            summary={
              <>
                <span className="method-icon"><CalendarDays size={19} /></span>
                <span className="method-value">4 <small>checkpoint</small></span>
                <h3>Pemantauan berkala</h3>
              </>
            }
          />
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
          <p>
            Tujuh rutinitas saling melengkapi dalam mendukung kesiapan belajar,
            kesehatan, karakter, dan kepedulian siswa.
          </p>
        </div>
        <div className="welcome-habit-grid">
          {habits.map(({ title, icon: Icon, note, detail }, index) => (
            <ProgressiveDisclosureCard
              className="welcome-habit-card"
              details={<p className="habit-detail">{detail}</p>}
              key={title}
              label={title}
              summary={
                <>
                  <span className="habit-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="habit-icon"><Icon size={20} /></span>
                  <h3>{title}</h3>
                  <p>{note}</p>
                </>
              }
            />
          ))}
        </div>
        <div className="habit-context-grid">
          <ProgressiveDisclosureCard
            className="habit-context-card"
            details={
              <p>
                7 KAIH menghubungkan rutinitas dari pagi hingga malam. Di SMAVO,
                pembiasaan ini menjadi ajakan yang konsisten bagi siswa, keluarga,
                dan sekolah untuk saling mendukung tumbuh kembang yang sehat.
              </p>
            }
            label="Urgensi kebiasaan"
            summary={
              <>
                <span className="welcome-section-kicker">URGENSI</span>
                <h3>Kebiasaan kecil membentuk kesiapan sehari-hari.</h3>
              </>
            }
          />
          <ProgressiveDisclosureCard
            className="habit-context-card"
            details={
              <p>
                Sebanyak 35 pernyataan, lima untuk setiap kebiasaan, dicatat dengan
                skala Likert 1–4 pada empat pengukuran selama dua pekan. Ringkasan
                dapat dibaca menurut jenjang, jenis kelamin, dan periode.
              </p>
            }
            label="Konteks monitoring"
            summary={
              <>
                <span className="welcome-section-kicker">MONITORING</span>
                <h3>Empat checkpoint memberi konteks perubahan.</h3>
              </>
            }
          />
          <ProgressiveDisclosureCard
            className="habit-context-card"
            details={
              <p>
                Dashboard membantu warga sekolah mengenali kebiasaan yang sudah
                kuat dan area prioritas, lalu merencanakan dukungan yang relevan.
                Angka dibaca sebagai gambaran agregat, bukan penilaian individu.
              </p>
            }
            label="Konteks VERTIKAL SMA 2026"
            summary={
              <>
                <span className="welcome-section-kicker">VERTIKAL SMA 2026</span>
                <h3>Data menjadi bahan refleksi dan tindak lanjut.</h3>
              </>
            }
          />
        </div>
      </section>

      <section className="gallery-section" id="galeri">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-section-kicker">CERITA KEBIASAAN BAIK</span>
            <h2>Galeri dokumentasi.</h2>
          </div>
          <p>Potret kegiatan warga SMAVO yang mencerminkan pembiasaan 7 KAIH.</p>
        </div>
        <div className="welcome-gallery-grid">
          {galleryItems.map((item, index) => (
            <article className={`gallery-card ${item.sceneClass}`} key={item.id}>
              <button
                className="gallery-card-trigger"
                type="button"
                aria-haspopup="dialog"
                aria-label={`Buka dokumentasi ${item.title}, kategori ${item.category}`}
                onClick={() => setSelectedGalleryItem(item)}
              >
                <GalleryMedia item={item} number={index + 1} />
                <div className="gallery-caption">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.caption}</p>
                  {item.period && <small>{item.period}</small>}
                </div>
              </button>
            </article>
          ))}
        </div>
      </section>

      <dialog
        className="gallery-dialog"
        ref={galleryDialogRef}
        aria-labelledby="gallery-dialog-title"
        onClose={() => setSelectedGalleryItem(null)}
        onClick={(event) => {
          if (event.target === galleryDialogRef.current) closeGalleryDialog();
        }}
      >
        {selectedGalleryItem && (
          <div className="gallery-dialog-content">
            <button
              className="gallery-dialog-close"
              type="button"
              aria-label="Tutup dokumentasi"
              onClick={closeGalleryDialog}
            >
              <X size={18} />
            </button>
            <div className={`gallery-dialog-media ${selectedGalleryItem.sceneClass}`}>
              <GalleryMedia
                item={selectedGalleryItem}
                number={selectedGalleryIndex + 1}
                large
              />
              <button
                aria-label="Foto sebelumnya"
                className="gallery-dialog-nav gallery-dialog-prev"
                onClick={() => navigateGallery(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={22} />
              </button>
              <button
                aria-label="Foto berikutnya"
                className="gallery-dialog-nav gallery-dialog-next"
                onClick={() => navigateGallery(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={22} />
              </button>
            </div>
            <div className="gallery-dialog-copy">
              <div className="gallery-dialog-caption-header">
                <span className="welcome-section-kicker">
                  {selectedGalleryItem.category}
                </span>
                <span className="gallery-dialog-counter" aria-live="polite">
                  {selectedGalleryIndex + 1} / {galleryItems.length}
                </span>
              </div>
              <h2 id="gallery-dialog-title">{selectedGalleryItem.title}</h2>
              {selectedGalleryItem.period && (
                <span className="gallery-dialog-period">
                  {selectedGalleryItem.period}
                </span>
              )}
              <p>{selectedGalleryItem.caption}</p>
              {selectedGalleryItem.documentationUrl && (
                <a
                  className="gallery-documentation-link"
                  href={selectedGalleryItem.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka dokumentasi lengkap <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </dialog>

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
