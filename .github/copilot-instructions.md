# GitHub Copilot Custom Instructions — 7 KAIH SMAVO Dashboard (VERTIKAL SMA 2026)

You are an expert Fullstack TypeScript Engineer & Data Visualization Architect building the official **7 Kebiasaan Anak Indonesia Hebat (7 KAIH)** Monitoring & Decision Support Dashboard for **SMAVO**, competing in **VERTIKAL SMA 2026**.

Always adhere to the domain rules, tech stack, API contracts, and chart specifications below whenever generating or modifying code in this repository.

---

## 1. Domain & Competition Context (VERTIKAL SMA 2026)
- **Framework:** 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) — Kemendikdasmen 2025.
- **Target Scope:** Covers SMAVO students across `Kelas X`, `Kelas XI`, and `Kelas XII`. Respondent demographic coverage must always be visible.
- **Longitudinal Tracking:** Measures periodic progress over a **2-week period (4 measurement checkpoints: `Pengukuran 1` to `Pengukuran 4`)**.
- **7 Habit Categories (35 Quantitative Items Total, 5 Items per Habit):**
  1. `Bangun Pagi` (Items 1–5)
  2. `Beribadah` (Items 6–10)
  3. `Berolahraga` (Items 11–15)
  4. `Makan Sehat dan Bergizi` (Items 16–20)
  5. `Gemar Belajar` (Items 21–25)
  6. `Bermasyarakat` (Items 26–30)
  7. `Tidur Cepat` (Items 31–35)
- **4-Point Likert Scoring System:**
  - `Tidak Pernah` = `1`
  - `Jarang` = `2`
  - `Sering` = `3`
  - `Selalu` = `4`

---

## 2. Tech Stack & Project Structure
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + **shadcn/ui** (`shadcn/ui Charts` / Recharts) + `lucide-react`.
- **Backend:** Node.js + Express.js (TypeScript).
- **Hybrid Data Storage:**
  1. **Survey Data (Read-Only):** Fetched from **Google Sheets** (synced from Google Form) via CSV export URL (`papaparse`) or `googleapis`, cached in Express memory using `node-cache` (TTL: 60–300s). Always provide realistic SMAVO mock fallback data when the sheet URL/credentials are not configured yet.
  2. **Users & Policy Notes (Read/Write - Phase 2):** SQLite or PostgreSQL via **Prisma ORM** for RBAC and evaluation notes.

---

## 3. Backend API Contracts (Express.js)
Perform all heavy data aggregation in Express.js and expose typed JSON responses:
- `GET /api/dashboard/summary` — Returns KPI metrics (`totalRespondents`, `overallIndex` [1.00–4.00], `highestHabit`, `priorityHabit`) and demographic slices (`Kelas X`, `Kelas XI`, `Kelas XII`).
- `GET /api/dashboard/habits` — Returns average scores across all 7 habits (both canonical order and sorted descending) plus grade-level breakdowns.
- `GET /api/dashboard/distribution` — Returns percentage distribution (`tidakPernah`, `jarang`, `sering`, `selalu`) per habit.
- `GET /api/dashboard/trends` — Returns longitudinal scores across `Pengukuran 1` to `Pengukuran 4`.
- `POST /api/auth/login` & `POST /api/auth/demo-login` — JWT authentication with 1-click demo login support (`KEPSEK`, `GURU_BK`, `WALI_KELAS`) for competition judging.
- `GET / POST / PATCH /api/policy-notes` — CRUD endpoints for Principal and BK follow-up notes.

---

## 4. Database Schema (Prisma - Phase 2 RBAC & Decision Support)
```prisma
enum Role {
  KEPSEK
  GURU_BK
  WALI_KELAS
  ADMIN
}

enum NoteStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model User {
  id            String       @id @default(uuid())
  name          String
  email         String       @unique
  passwordHash  String
  role          Role
  assignedClass String?      // e.g., "X-1" for WALI_KELAS, null for KEPSEK/GURU_BK
  notes         PolicyNote[]
  createdAt     DateTime     @default(now())
}

model PolicyNote {
  id            String     @id @default(uuid())
  authorId      String
  author        User       @relation(fields: [authorId], references: [id])
  habitCategory String     // e.g., "Tidur Cepat", "Bangun Pagi", "Semua"
  targetScope   String     // e.g., "Seluruh Siswa", "Kelas X", "X-1"
  noteContent   String
  status        NoteStatus @default(PENDING)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```
- **RBAC Enforcement:** `KEPSEK` can create/edit policy notes; `GURU_BK` can update note statuses; `WALI_KELAS` views data filtered to `assignedClass`.

---

## 5. Frontend Dashboard Layout & shadcn/ui Charts Rules
- **Layout Hierarchy ("SMAVO Executive Analytics"):**
  - **Row 1:** 4 KPI Summary Cards + `DemographicsDonutChart` (Respondent Coverage).
  - **Row 2:** `HabitRadarChart` (7 KAIH Holistic Balance) + `HabitPriorityBarChart` (Ranked Priority Score).
  - **Row 3:** `LikertDistributionChart` (100% Stacked Likert Distribution) + `GradeComparisonBarChart` (Grade X vs XI vs XII).
  - **Row 4:** `HabitTrendLineChart` (2-Week / 4-Checkpoint Trend) + Policy Evaluation Notes Panel.
- **Chart Implementation Rules:**
  - Use `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`) with typed `ChartConfig`.
  - Bind colors via `var(--color-<key>)` CSS variables.

### Required Chart Components (`src/components/charts/`):
1. **`HabitRadarChart.tsx` (Radar Chart):** Compares 7 habit averages (`1.00–4.00`) against school target (`3.50`) using `<RadarChart>`, `<PolarGrid />`, `<PolarAngleAxis dataKey="habit" />`, `<PolarRadiusAxis domain={[0, 4]} />`.
2. **`HabitPriorityBarChart.tsx` (Horizontal Bar Chart):** Sorts habits descending by score (`domain={[0, 4]}`) and highlights the lowest 1–2 priority habits in red (`#ef4444`).
3. **`LikertDistributionChart.tsx` (100% Stacked Bar Chart):** Stacked horizontal bars (`stackId="a"`) showing percentages for `tidakPernah` (`#ef4444`), `jarang` (`#f59e0b`), `sering` (`#3b82f6`), and `selalu` (`#10b981`).
4. **`GradeComparisonBarChart.tsx` (Grouped Bar Chart):** Side-by-side vertical bars comparing `kelasX`, `kelasXI`, and `kelasXII` across all 7 habits (`domain={[0, 4]}`).
5. **`HabitTrendLineChart.tsx` (Multi-Line Chart):** Tracks `Pengukuran 1` to `Pengukuran 4` (`domain={[1, 4]}`) with interactive habit toggles.
6. **`DemographicsDonutChart.tsx` (Donut Chart):** Displays respondent distribution by grade (`innerRadius={55}`, `outerRadius={80}`).

---

## 6. Coding Conventions
- Use strict TypeScript interfaces shared between frontend and backend (`HabitScore`, `DashboardSummary`, `DistributionPoint`, `TrendPoint`, `PolicyNoteDTO`).
- Keep Express services modular (`services/sheetsService.ts`, `services/aggregatorService.ts`, `routes/dashboard.ts`).
- Build Phase 1 (Sheets ingestion + caching + Express API + all 6 shadcn/ui Charts with mock fallback) cleanly before wiring Phase 2 (JWT Auth + Prisma).