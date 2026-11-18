# SMAVO 7 KAIH Dashboard

Frontend React + TypeScript + Vite untuk dashboard monitoring 7 Kebiasaan Anak
Indonesia Hebat. Chart memakai Recharts dengan wrapper `ChartContainer`,
`ChartConfig`, tooltip, dan CSS variables bergaya shadcn/ui.

## Menjalankan

Pastikan API Express di `../server` berjalan pada port 4000, lalu dari folder
`client` jalankan:

```powershell
npm install
npm run dev
```

Vite meneruskan `/api/*` ke `http://localhost:4000`. Build dan pemeriksaan kode:

```powershell
npm run build
npm run lint
```

Dependensi utama: `react`, `react-dom`, `vite`, `typescript`, `recharts`,
`lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `jspdf`, dan
`jspdf-autotable`.

## Struktur

```text
src/
  components/
    charts/
      DemographicsDonutChart.tsx
      GradeComparisonBarChart.tsx
      HabitPriorityBarChart.tsx
      HabitRadarChart.tsx
      HabitTrendLineChart.tsx
      LikertDistributionChart.tsx
    WelcomePage.tsx
    TeamPage.tsx
    ui/chart.tsx
    ChartCard.tsx
    Dashboard.tsx
    FilterBar.tsx
    KpiCards.tsx
  lib/
    api.ts
    exportReport.ts
  types/dashboard.ts
  App.tsx
  index.css
  main.tsx
```

`Dashboard` mengambil `GET /api/dashboard/summary` dan mengirim filter sebagai
query params. Jenjang dikirim melalui `kelas` (`X`, `XI`, `XII`); jika kolom
rombel diisi, nilainya mengirim nama kelas yang persis seperti `XI-1` dan
menggantikan pilihan jenjang. Filter lain menggunakan `jenis_kelamin` dan
`periode`.

Enam grafik menampilkan sebaran demografi, profil radar dengan target 3,50,
peringkat skor terendah, distribusi Likert, perbandingan jenjang, serta tren
empat checkpoint. Toggle pada grafik tren dapat menyembunyikan atau
menampilkan tiap kebiasaan.

Halaman pembuka memuat metodologi monitoring 35 pernyataan (5 pernyataan untuk tiap
kebiasaan), skala Likert 1–4, empat checkpoint, serta cakupan kelas X–XII.
Galeri membaca foto lokal dari `public/gallery/scene-morning.jpg`,
`scene-sport.jpg`, `scene-study.jpg`, dan `scene-community.jpg`. Letakkan foto
kegiatan sekolah yang telah mendapat izin publikasi dengan nama tersebut;
gradien ilustrasi tampil otomatis bila foto belum ada.

Tombol **Ekspor PDF** hanya bekerja jika API menandai data sebagai berasal
dari Google Sheets. Laporan berisi identitas SMAN 2 Cibinong, filter aktif,
KPI, kesimpulan dan rekomendasi berbasis skor terendah, distribusi Likert,
perbandingan jenjang, serta tren.

Login diperlukan untuk membuka data dashboard. Panel **Catatan Evaluasi &
Tindak Lanjut** tersedia di baris tren dashboard setelah masuk.
Panel menyediakan login biasa dan 1-Click Demo Login untuk akun SISWA, KEPSEK,
GURU_BK, WALI_KELAS X-1, serta ADMIN. Akun SISWA dapat melihat dashboard
agregat tanpa akses ekspor PDF atau catatan kebijakan. KEPSEK/ADMIN dapat
membuat, mengedit, dan menghapus catatan; GURU_BK/ADMIN mengelola status dan
catatan pendampingan; WALI_KELAS hanya melihat catatan sesuai lingkup kelas
binaan. Aturan akses kelas dan catatan siswa juga diberlakukan backend.

Sebelum membuka panel, siapkan PostgreSQL dari folder `server` dan konfigurasi
Upstash Redis pada `.env` server, lalu salin konfigurasi `.env.example` ke
`.env`:

```powershell
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
```

Autentikasi memakai cookie sesi `HttpOnly` yang disimpan di Upstash Redis;
PostgreSQL menyimpan akun dan catatan kebijakan. Data SQLite lama (jika ada) tidak
diimpor otomatis dan tetap disimpan sebagai arsip lokal.

Halaman **Tim Pengembang** dibuka dari tombol pengguna di header Welcome Page.
Nama, peran, inisial placeholder, dan deskripsi tanggung jawab diedit pada
array `teamMembers` di `src/components/TeamPage.tsx`. Untuk mengganti placeholder
dengan foto, letakkan foto berizin di `public/team/` dan isi properti `photo`
dengan path seperti `/team/bagaskara.jpg`.

## Deployment Vercel

Set Root Directory Vercel ke `v2/client`, build command `npm run build`, dan
output directory `dist`. Tambahkan environment variable
`VITE_API_BASE_URL=https://<nama-api>.onrender.com` lalu redeploy. URL harus
berupa origin API tanpa `/api`; semua endpoint memakai variabel ini. File
`vercel.json` menangani fallback route SPA.

Tambahkan origin URL Vercel yang persis ke `CLIENT_ORIGINS` di Render. Untuk
uji lokal, konfigurasi development server memakai origin
`http://localhost:5173`.
