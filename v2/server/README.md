# 7 KAIH SMAVO API

Backend Express + TypeScript untuk agregasi survei 7 Kebiasaan Anak Indonesia Hebat.

Struktur utama:

```text
src/
  controllers/dashboardController.ts
  data/mockData.ts
  routes/dashboard.ts
  services/aggregatorService.ts
  services/sheetsService.ts
  types/survey.ts
  app.ts
  index.ts
```

## Menjalankan

```powershell
npm install
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Isi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` di `.env` dari
database Upstash sebelum menjalankan API. Docker Compose lokal hanya
menyediakan PostgreSQL; sesi autentikasi memakai Upstash REST.

Server berjalan pada `http://localhost:4000`. Endpoint hanya menggunakan data
Google Sheets yang dikonfigurasi; server tidak mengganti data produksi dengan
mock. Jika konfigurasi tidak tersedia, API mengembalikan HTTP 503 dengan pesan
yang menjelaskan variabel yang perlu diisi.

```powershell
npm test
npm run build
npm start
```

`npm run build` selalu menjalankan `prisma generate` sebelum TypeScript dikompilasi,
agar Prisma Client mengikuti `prisma/schema.prisma` pada setiap deployment.

## Konfigurasi Google Sheets

`src/index.ts` memuat `.env` melalui `dotenv/config`. Backend membaca:

| Variabel | Kegunaan |
| --- | --- |
| `GOOGLE_SHEETS_CSV_URL` | URL ekspor CSV tab survei utama; wajib diisi |
| `PORT` | Port HTTP; default `4000` |
| `DATABASE_URL` | URL PostgreSQL runtime; gunakan URL pooler jika provider menyarankannya |
| `DIRECT_URL` | Koneksi PostgreSQL langsung untuk Prisma migrate/db push |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST URL database Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST Upstash; rahasiakan nilainya |
| `CLIENT_ORIGINS` | Daftar origin frontend yang diizinkan, dipisahkan koma |
| `SESSION_TTL_SECONDS` | TTL Redis/cookie; default `28800` (8 jam) |
| `SESSION_COOKIE_NAME` | Nama cookie sesi; default `smavo.sid` |

Di development lokal, URL PostgreSQL pada `.env.example` memakai port Compose
host `5433`. Di cloud, akun/catatan disimpan pada PostgreSQL terkelola; filesystem
Render tidak digunakan untuk menyimpan database.

Data survei Google Sheets disimpan di `node-cache` selama 180 detik. Setelah
TTL cache segar berakhir, server segera menyajikan data tervalidasi terakhir
sambil memuat ulang tab utama dan `Sheet3` di latar belakang. Refresh bersamaan
digabung menjadi satu proses per instance Node.js. Data stale berlaku maksimum
24 jam sejak berhasil dimuat; API menandai respons `isStale: true` dan dashboard
memberi peringatan, sementara ekspor PDF dinonaktifkan. Pada cold start tanpa
cache last-known-good, request pertama tetap menunggu fetch dan validasi CSV.
Cache ini bersifat per proses/instance, bukan cache global lintas instance
Vercel/Render; jika cold start atau skala multi-instance membebani kuota Sheets,
gunakan cache bersama yang terkelola sebelum menaikkan TTL. Bila belum ada cache
valid, error dikembalikan (tanpa mock fallback).

Atur `GOOGLE_SHEETS_CSV_URL` pada `.env` ke URL CSV yang dapat dibaca server.
Jangan mencetak atau mengirimkan nilai URL konfigurasi karena dapat memuat
informasi akses spreadsheet. Parser mendukung format panjang Google Forms
(`Timestamp`, `Email`, `Jenis Kelamin`, `Angkatan`, `Kelas`,
`Kategori Kebiasaan`, `Pertanyaan`, `Respon`, `Skor Likert`) dan format lebar
(`respondent_id`, `kelas`, `jenis_kelamin`, `item_1` sampai `item_35`).

Kolom `Email` tidak disalin ke objek survei, cache, atau response API. Untuk
mengelompokkan 35 baris jawaban menjadi satu pengisian, alamat email hanya
dipakai sebagai kunci sementara saat parsing; hasilnya menggunakan ID
pseudonim `SMAVO-0001`, dan kunci sementara dibuang setelah parsing.
Pertanyaan, kategori, waktu pengisian, kelas/angkatan, label jawaban, dan skor
Likert tetap tersedia di record internal. Tiap pengisian harus mempunyai
tepat 35 jawaban valid. Nilai jawaban `Respon` dipakai untuk distribusi,
sedangkan `Skor Likert` dipakai untuk rata-rata (termasuk pernyataan yang skornya
sudah dibalik).

Sheet saat ini menyediakan 18.655 baris untuk 533 pengisian (35 pernyataan per
pengisian), tetapi tidak memiliki kolom periode. Periode diturunkan dari tanggal
`Timestamp` menggunakan checkpoint 2026 berikut:

| Periode | Tanggal checkpoint | Rentang tanggal yang dipetakan |
| --- | --- | --- |
| Pengukuran 1 | 4 November | sebelum 6 November |
| Pengukuran 2 | 6 November | 6–8 November |
| Pengukuran 3 | 9 November | 9–11 November |
| Pengukuran 4 | 12 November | 12 November dan sesudahnya |

Artinya tanggal 5 November masuk Pengukuran 1; tanggal sebelum 4 November
dijepit ke Pengukuran 1, dan setelah 12 November ke Pengukuran 4. Tanggal
dibaca sebagai tanggal kalender yang tertulis pada timestamp Sheets (format
`YYYY-MM-DD` maupun `M/D/YYYY`, tanpa konversi timezone). Jika CSV menyediakan
kolom periode eksplisit, nilai itu diutamakan. Kategori sheet yang didukung:
`Bangun Pagi`, `Beribadah`, `Berolahraga`, `Makan Makanan Sehat dan Bergizi`,
`Gemar Membaca / Belajar`, `Bermasyarakat / Kepedulian Sosial`, dan
`Istirahat Cepat / Tidur Tepat Waktu`.

Tab `Sheet3` pada spreadsheet yang sama juga dimuat otomatis. Tab ini berupa
CSV tanpa header dengan 35 kolom jawaban per baris (135 baris saat terakhir
diperiksa). Baris tersebut mendapat ID `ANON-####`; tidak ada email, timestamp,
kelas, atau jenis kelamin yang diminta maupun disimpan. Jawaban Sheet3 masuk
ke KPI, skor kebiasaan, distribusi Likert, dan jumlah responden keseluruhan.
Karena periodenya dan demografinya tidak tersedia, kontribusinya ditandai
`Anonim / tidak diketahui`, tidak dimasukkan ke perbandingan kelas atau tren,
dan tidak muncul saat filter periode tertentu dipakai. Item 4 dibalik skornya
agar konsisten dengan pernyataan negatif pada survei utama. Urutan 35 kolom
diperlakukan sebagai urutan item 1–35 pada instrumen.

Pengisian utama yang tidak memiliki 35 jawaban valid dilewati dan dicatat
sebagai peringatan tanpa identitas responden. Jika tidak ada pengisian lengkap,
format CSV rusak, atau nilai skala tidak valid, API mengembalikan HTTP 502 dan
tidak menggantinya dengan data mock.

Data Sheets yang berhasil divalidasi di-cache selama 180 detik, dengan fallback
last-known-good maksimum 24 jam seperti dijelaskan di atas. Jangan letakkan
kolom identitas pribadi siswa pada CSV produksi; `respondent_id` sebaiknya
berupa ID pseudonim yang konsisten antarperiode.

## Endpoint

`GET /api/dashboard/summary?kelas=X&jenis_kelamin=Perempuan&periode=2`
memerlukan cookie sesi aktif. Untuk WALI_KELAS, backend
mengabaikan parameter jenjang/rombel yang dikirim dan memaksa filter ke
`assignedClass` akun.

`GET /api/dashboard/comparison?from=1&to=4&kelas=X&jenis_kelamin=Perempuan`
menghasilkan skor awal/akhir, delta, perubahan relatif, dan jumlah responden
tiap checkpoint. Endpoint mengabaikan filter `periode` dashboard karena kedua
checkpoint ditentukan eksplisit, menerapkan filter jenjang/rombel dan gender,
serta hanya menerima data Google Sheets.

`GET /api/rtl`, `POST /api/rtl`, `PATCH /api/rtl/:id`, dan
`DELETE /api/rtl/:id` mengelola rencana tindak lanjut secara terpisah dari
Policy Notes. KEPSEK/ADMIN menyusun atau mengubah isi; GURU_BK, ADMIN, KEPSEK,
atau peran yang ditetapkan dapat memperbarui status. WALI_KELAS hanya melihat
target seluruh sekolah, jenjang, dan rombel binaannya. Siswa ditolak di
middleware dan controller. Snapshot komparasi dibuat ulang server-side dari
Google Sheets dan hanya menyimpan statistik agregat.

Pengumuman 7 KAIH disimpan terpisah dari RTL dan Policy Notes:

- `GET /api/announcements` dapat dibaca tanpa autentikasi.
- `POST /api/announcements`, `PATCH /api/announcements/:id`, dan
  `DELETE /api/announcements/:id` hanya dapat dipakai KEPSEK, GURU_BK,
  WALI_KELAS, dan ADMIN. Otorisasi ditegakkan di middleware dan controller.
- API memvalidasi kategori 7 KAIH, sasaran seluruh siswa/jenjang/rombel,
  prioritas, panjang teks, serta tanggal. Isi dirender sebagai teks biasa di
  frontend; query database menggunakan Prisma.

Skema `Announcement` ditambahkan melalui
`prisma/migrations/20261121153000_add_announcements/migration.sql`. Pada
database dengan migration history, deploy migrasi dengan
`npx prisma migrate deploy` sebelum menjalankan API baru. Pada database yang
dikelola dengan alur `db push`, backup dahulu lalu jalankan `npx prisma db push`.
Konfigurasi Render pada `v2/render.yaml` menjalankan `npm run db:push` saat
build, menggunakan `DATABASE_URL`/`DIRECT_URL` yang disetel pada service
Render, sehingga database yang dipakai website ikut diselaraskan saat deploy.
Jika endpoint announcement menjawab 503 karena skema belum siap, jalankan
migrasi tersebut dari direktori `server` menggunakan koneksi `DIRECT_URL` yang
sesuai, lalu ulangi permintaan. API tidak mengirim detail skema atau stack trace
database ke klien.

- `kelas`: jenjang `X`, `XI`, `XII` (atau label seperti `X-1` untuk satu rombel).
- `jenis_kelamin`: pencocokan tanpa membedakan kapitalisasi.
- `periode` atau `periode_pengukuran`: nilai `1`–`4` atau `Pengukuran 1`–`4`.
- Nilai filter teks dibatasi 64 karakter dan karakter kontrol ditolak.
- Filter kelas/gender/periode diterapkan ke KPI, skor kebiasaan, distribusi,
  perbandingan kelas, serta demografi. Tren selalu menampilkan keempat periode,
  dengan filter kelas dan gender tetap berlaku.
- Respons API memakai `Cache-Control: no-store` agar payload sesi/kebijakan tidak
  disimpan cache browser atau proxy.
- `overallIndex` adalah rata-rata tujuh skor kebiasaan. `totalRespondents`
  menghitung ID unik, sedangkan `totalResponses` menghitung baris pengukuran.
- `habits` mengikuti urutan resmi; `priorityHabits` berisi dua skor terendah.
- Persentase Likert dihitung atas seluruh jawaban item yang terisi per kebiasaan.
- Skor komparasi `delta` ialah skor akhir dikurangi skor awal; perubahan relatif
  dihitung terhadap skor awal dan dibulatkan dua desimal.

## Bentuk data untuk grafik

Respons API memuat semua dataset berikut dalam satu payload:

```json
{
  "totalRespondents": 500,
  "totalResponses": 2000,
  "overallIndex": 3.12,
  "highestHabit": { "key": "beribadah", "habit": "Beribadah", "itemRange": [6, 10], "score": 3.35, "responseCount": 10000 },
  "priorityHabit": { "key": "berolahraga", "habit": "Berolahraga", "itemRange": [11, 15], "score": 2.85, "responseCount": 10000 },
  "habits": [
    { "key": "bangunPagi", "habit": "Bangun Pagi", "itemRange": [1, 5], "score": 3.05, "responseCount": 10000 }
  ],
  "priorityHabits": [
    { "key": "berolahraga", "habit": "Berolahraga", "itemRange": [11, 15], "score": 2.85, "responseCount": 10000 }
  ],
  "distribution": [
    { "key": "bangunPagi", "habit": "Bangun Pagi", "tidakPernah": 3.2, "jarang": 16.4, "sering": 49.8, "selalu": 30.6, "totalResponses": 10000 }
  ],
  "gradeComparison": [
    { "key": "bangunPagi", "habit": "Bangun Pagi", "kelasX": 3.02, "kelasXI": 3.06, "kelasXII": 3.08 }
  ],
  "trends": [
    { "periode": 1, "label": "Pengukuran 1", "scores": { "bangunPagi": 3.0, "beribadah": 3.3, "berolahraga": 2.8, "makanSehat": 3.0, "gemarBelajar": 3.1, "bermasyarakat": 3.2, "tidurCepat": 2.8 } }
  ],
  "demographics": {
    "kelas": [
      { "label": "Kelas X", "total": 167 },
      { "label": "Kelas XI", "total": 167 },
      { "label": "Kelas XII", "total": 166 }
    ],
    "jenisKelamin": [
      { "label": "Perempuan", "total": 250 },
      { "label": "Laki-laki", "total": 250 }
    ]
  },
  "appliedFilters": { "kelas": null, "jenisKelamin": null, "periode": null },
  "dataSource": "google-sheets"
}
```

Array `habits`, `distribution`, dan `gradeComparison` berisi tujuh elemen;
`trends` berisi empat periode. Nilai numerik pada contoh hanya menunjukkan
bentuk kontrak API; aplikasi hanya menampilkan data setelah `dataSource`
terkonfirmasi `google-sheets`.

## Akun, autentikasi, dan catatan kebijakan

Fitur DSS memakai Prisma ORM dengan PostgreSQL untuk tabel `User` dan
`PolicyNote`, serta Upstash Redis REST untuk sesi login. Data survei tetap
dibaca dari Google Sheets. Salin variabel yang diperlukan dari `.env.example`
ke `.env` tanpa mengganti nilai `GOOGLE_SHEETS_CSV_URL`.

Untuk development lokal, jalankan PostgreSQL dari folder `server`:

```powershell
docker compose up -d
```

Kredensial PostgreSQL pada `docker-compose.yml` hanya untuk development lokal;
ganti dengan kredensial terkelola sebelum deployment. Isi juga URL dan token
Upstash pada `.env`, lalu siapkan database dan akun demo:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

Login membuat ID sesi acak yang disimpan di Upstash Redis selama 8 jam (default).
Browser menerima ID tersebut melalui cookie `HttpOnly`, `SameSite=Lax` lokal
atau `SameSite=None; Secure` di production; ID sesi tidak dikirim pada body
JSON atau disimpan sebagai bearer token di frontend. Role dan kelas binaan
dimuat ulang dari PostgreSQL pada setiap request. `SESSION_TTL_SECONDS` dan
`SESSION_COOKIE_NAME` dapat diatur di `.env`.

Permintaan browser yang mengubah data diverifikasi terhadap `CLIENT_ORIGIN`
(legacy) atau daftar `CLIENT_ORIGINS` (default
`http://localhost:5173`) untuk CORS credentials dan perlindungan CSRF. Origin
dicocokkan persis; di production gunakan URL HTTPS Vercel dan jangan memakai
wildcard. Cookie sesi menggunakan `SameSite=None; Secure` di production agar
frontend Vercel dapat memanggil API Render lintas origin.

Database SQLite lokal dari versi sebelumnya tidak dimigrasikan otomatis.
File lama tetap disimpan sebagai arsip; jalankan seed untuk membuat akun demo
di PostgreSQL baru.
Di deployment `NODE_ENV=production`, demo login nonaktif secara default;
seed akun demo juga ditolak secara default. Set `ALLOW_DEMO_SEED=true` untuk
menanam akun dan `ENABLE_DEMO_LOGIN=true` untuk mengaktifkan jalur login demo
hanya bila memang dibutuhkan untuk sesi penjurian yang terkontrol. Akun demo
juga tidak dapat dipakai melalui endpoint login biasa saat fitur demo nonaktif.

Akun lokal untuk demo (semua memakai kata sandi `Demo2026!`):

| Role | Email | Kelas binaan |
| --- | --- | --- |
| KEPSEK | `kepsek.demo@smavo.sch.id` | — |
| GURU_BK | `bk.demo@smavo.sch.id` | — |
| WALI_KELAS | `wali.x1.demo@smavo.sch.id` | `X-1` |
| ADMIN | `admin.demo@smavo.sch.id` | — |
| SISWA | `siswa.demo@smavo.sch.id` | — |

Akun dan kata sandi tersebut hanya untuk demo lokal; ganti seed sebelum
deployment produksi. Endpoint autentikasi:

- `POST /api/auth/login` dengan `{ "email": "...", "password": "..." }`
- `POST /api/auth/demo-login` dengan `{ "role": "KEPSEK" }`
- `GET /api/auth/me` memeriksa sesi dari cookie
- `POST /api/auth/logout` menghapus sesi Upstash Redis dan cookie

Akun SISWA dapat membuka dashboard agregat, tetapi tidak mendapatkan tombol
ekspor PDF maupun akses ke endpoint catatan kebijakan. Akun staf tetap
menggunakan peran KEPSEK, GURU_BK, WALI_KELAS, atau ADMIN untuk aturan akses.
Setelah menambahkan peran SISWA, terapkan migrasi dan seed akun:

```powershell
npm run db:migrate
npm run db:seed
```

Catatan kebijakan memerlukan sesi aktif dan akun staf:

- `GET /api/policy-notes` menampilkan catatan yang diizinkan untuk role.
- `POST /api/policy-notes` membuat catatan (KEPSEK/ADMIN).
- `PATCH /api/policy-notes/:id` mengubah isi kebijakan (KEPSEK/ADMIN), atau
  status dan `followUpNote` (GURU_BK/ADMIN).
- `DELETE /api/policy-notes/:id` menghapus catatan (KEPSEK/ADMIN).

Status yang diterima: `PENDING`, `IN_PROGRESS`, `COMPLETED`. Target catatan
ialah `Seluruh Siswa`, `Kelas X`/`Kelas XI`/`Kelas XII`, atau rombel seperti
`X-1`. WALI_KELAS hanya membaca catatan untuk kelas binaan, jenjangnya, dan
seluruh siswa. Request ringkasan dashboard dari wali kelas juga selalu
dipaksakan ke rombel binaan pada backend.

## Deployment PostgreSQL, Render, dan Vercel

Akun dan catatan disimpan pada PostgreSQL terkelola, bukan disk instance
Render. Google Sheets tetap menjadi sumber survei; cache 180 detik serta
fallback stale tervalidasi (maksimum 24 jam) hanya tersimpan di memori server.
Free tier provider dapat membatasi kuota, uptime, retensi, atau backup. Buat
backup database berkala dan jangan menganggap paket gratis sebagai jaminan
backup permanen.

### 1. Siapkan PostgreSQL di Supabase atau Neon

1. Buat project/database PostgreSQL baru.
2. Salin connection string ke `.env` lokal server:
   - `DATABASE_URL`: URL runtime/pooler provider.
   - `DIRECT_URL`: URL direct/unpooled untuk Prisma.
3. Pertahankan `?schema=public` untuk URL Prisma bila belum disertakan. Encode
   karakter khusus pada password dalam URL.
4. Dari folder `v2/server`, jalankan:

   ```powershell
   npm.cmd run db:generate
   npx.cmd prisma db push
   npm.cmd run db:seed
   ```

`db push` menerapkan model Prisma tanpa migration history. Jika database sudah
dikelola dengan migration history, gunakan `npx prisma migrate deploy` dan
jangan mencampur kedua alur tanpa baseline migration.

Skema `RtlPlan` dan migration
`prisma/migrations/20261119110000_add_rtl_plans/migration.sql` bersifat
aditif dan mempertahankan tabel Policy Notes. Pada database production yang
memakai `db push`, jalankan `npx prisma db push` setelah backup. Pada database
dengan migration history yang sudah dibaseline, deploy migration tersebut
dengan `npx prisma migrate deploy` sebelum mengaktifkan versi API baru.

### 2. Deploy API di Render

1. Siapkan URL PostgreSQL dan database Upstash Redis; jangan memakai
   `localhost` pada konfigurasi production.
2. Hubungkan GitHub repository ke Render Blueprint menggunakan
   `v2/render.yaml`. Blueprint memakai root directory `v2/server`, membangun
   API, dan memeriksa endpoint `/health`.
3. Isi Render environment variables `DATABASE_URL`, `DIRECT_URL`,
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
   `GOOGLE_SHEETS_CSV_URL`, dan `CLIENT_ORIGINS`. Atur juga
   `SESSION_COOKIE_NAME=smavo.sid` dan `SESSION_TTL_SECONDS=28800`.
4. Set `CLIENT_ORIGINS` menjadi origin frontend HTTPS yang tepat, misalnya
   `https://<project>.vercel.app` (tanpa trailing slash). Untuk custom domain,
   tambahkan origin itu juga. Origin localhost hanya untuk development.
5. Deploy dan cek `https://<api-render>/health`. Response sehat adalah HTTP 200
   dengan `database` dan `redis` bernilai `ok`.
6. Untuk akun demo di production, jalankan seed sekali dengan
   `ALLOW_DEMO_SEED=true`. `ENABLE_DEMO_LOGIN=true` hanya diperlukan bila demo
   login diaktifkan untuk penjurian; keduanya nonaktif secara default.

### 3. Deploy frontend di Vercel

1. Import repository GitHub ke Vercel dan set **Root Directory** ke
   `v2/client`.
2. Gunakan build command `npm run build` dan output directory `dist`.
3. Set `VITE_API_BASE_URL=https://<nama-api>.onrender.com`, tanpa `/api` di
   akhir, lalu redeploy. Client menambahkan route API secara otomatis.
4. Pastikan origin Vercel yang persis sama tercantum di `CLIENT_ORIGINS` pada
   Render dan redeploy API.

Browser mengirim cookie sesi dengan `credentials: include`; API menggunakan
CORS credentials dan cookie `SameSite=None; Secure` di production. Kebijakan
third-party cookie dapat membatasi cookie antara domain `vercel.app` dan
`onrender.com`; custom domains satu site atau proxy API same-origin lebih
andal. `/health` tidak mengembalikan connection string maupun detail error
provider.
