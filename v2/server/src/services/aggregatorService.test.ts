import assert from "node:assert/strict";
import { test } from "node:test";
import { generateMockSurveyRecords } from "../data/mockData.js";
import {
  aggregateDashboardSummary,
  filterSurveyRecords,
  parseDashboardFilters,
} from "./aggregatorService.js";
import {
  SurveyConfigError,
  getSurveyData,
  loadFromGoogleSheets,
  measurementFromTimestamp,
  parseAnonymousCsv,
  parseSurveyCsv,
} from "./sheetsService.js";
import type { DashboardFilters } from "../types/survey.js";

const noFilters: DashboardFilters = {
  kelas: null,
  jenisKelamin: null,
  periode: null,
};

const SHEET_CATEGORIES = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Makanan Sehat dan Bergizi",
  "Gemar Membaca / Belajar",
  "Bermasyarakat / Kepedulian Sosial",
  "Istirahat Cepat / Tidur Tepat Waktu",
];

function longFormCsv(timestamp: string, explicitPeriod?: number): string {
  const headers = [
    "Timestamp",
    "Email",
    "Jenis Kelamin",
    "Angkatan",
    "Kelas",
    "Kategori Kebiasaan",
    "Pertanyaan",
    "Respon",
    "Skor Likert",
  ];
  if (explicitPeriod !== undefined) headers.push("Periode Pengukuran");

  const rows = SHEET_CATEGORIES.flatMap((category) =>
    Array.from({ length: 5 }, (_, index) => {
      const values = [
        timestamp,
        "private@example.test",
        "Perempuan",
        "X",
        "X-1",
        category,
        `${category} item ${index + 1}`,
        "Jarang",
        "3",
      ];
      if (explicitPeriod !== undefined) values.push(String(explicitPeriod));
      return values.join(",");
    }),
  );
  return [headers.join(","), ...rows].join("\n");
}

function anonymousCsv(rowCount: number): string {
  const row = Array.from({ length: 35 }, (_, index) =>
    index === 3 ? "Jarang" : "Sering",
  ).join(",");
  return Array.from({ length: rowCount }, () => row).join("\n");
}

test("mock data represents 500 students at four checkpoints", () => {
  const records = generateMockSurveyRecords();

  assert.equal(records.length, 2_000);
  assert.equal(new Set(records.map((record) => record.respondentId)).size, 500);
  assert.ok(records.every((record) => Object.keys(record.answers).length === 35));
});

test("sheets service reports missing production configuration instead of using mock data", async () => {
  const previousUrl = process.env.GOOGLE_SHEETS_CSV_URL;
  process.env.GOOGLE_SHEETS_CSV_URL = "";

  try {
    await assert.rejects(getSurveyData(), (error: unknown) => {
      assert.ok(error instanceof SurveyConfigError);
      assert.match(error.message, /GOOGLE_SHEETS_CSV_URL/);
      return true;
    });
  } finally {
    if (previousUrl === undefined) {
      delete process.env.GOOGLE_SHEETS_CSV_URL;
    } else {
      process.env.GOOGLE_SHEETS_CSV_URL = previousUrl;
    }
  }
});

test("long-form imports omit incomplete respondent submissions with a diagnostic", () => {
  const [header, ...firstRespondentRows] = longFormCsv(
    "2026-11-05 13:51:11.213",
  ).split("\n");
  const secondRespondentRows = firstRespondentRows
    .map((row) => row.replace("private@example.test", "second@example.test"))
    .filter((row) => !row.includes("Bangun Pagi item 1"));
  const csv = [
    header,
    ...firstRespondentRows,
    ...secondRespondentRows,
  ].join("\n");

  const originalWarn = console.warn;
  let warning = "";
  console.warn = (message?: unknown) => {
    warning = String(message);
  };
  try {
    const records = parseSurveyCsv(csv);
    assert.equal(records.length, 1);
    assert.equal(
      Object.values(records[0]!.answers).filter((value) => value !== null).length,
      35,
    );
    assert.match(warning, /1 pengisian utama tidak lengkap/);
  } finally {
    console.warn = originalWarn;
  }
});

test("anonymous imports reject empty Likert answers", () => {
  const row = Array.from({ length: 35 }, (_, index) =>
    index === 3 ? "" : "Sering",
  ).join(",");

  assert.throws(() => parseAnonymousCsv(row), /kosong/);
});

test("Google Forms long CSV imports all survey fields without retaining email", () => {
  const [record] = parseSurveyCsv(longFormCsv("2026-11-05 13:51:11.213"));

  assert.ok(record);
  assert.equal(record.periode, 1);
  assert.equal(record.angkatan, "X");
  assert.equal(record.submittedAt, "2026-11-05 13:51:11.213");
  assert.equal(record.answers[1], 3);
  assert.equal(record.responseAnswers[1], 2);
  assert.equal(record.itemQuestions[1], "Bangun Pagi item 1");
  assert.equal(record.responseLabels[1], "Jarang");
  assert.equal(JSON.stringify(record).includes("private@example.test"), false);

  const summary = aggregateDashboardSummary([record], noFilters, "google-sheets");
  assert.equal(summary.habits[0]?.score, 3);
  assert.equal(summary.distribution[0]?.jarang, 100);
});

test("headerless anonymous Sheet3 responses contribute to overall totals only", () => {
  const records = parseAnonymousCsv(anonymousCsv(135));
  const summary = aggregateDashboardSummary(records, noFilters, "google-sheets");

  assert.equal(records.length, 135);
  assert.equal(new Set(records.map((record) => record.respondentId)).size, 135);
  assert.ok(records.every((record) => record.periode === null));
  assert.equal(records[0]?.answers[4], 3);
  assert.equal(records[0]?.responseAnswers[4], 2);
  assert.equal(summary.totalRespondents, 135);
  assert.equal(summary.totalResponses, 135);
  assert.equal(
    summary.demographics.kelas.find((group) => group.label === "Anonim / tidak diketahui")
      ?.total,
    135,
  );
  assert.equal(
    summary.demographics.jenisKelamin.find((group) => group.label === "Tidak diketahui")
      ?.total,
    135,
  );
  assert.equal(
    aggregateDashboardSummary(
      records,
      { ...noFilters, periode: 1 },
      "google-sheets",
    ).totalRespondents,
    0,
  );
});

test("Google Sheets loader fetches and combines the anonymous Sheet3 tab", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requestedUrls.push(url.toString());
    const csv = url.searchParams.get("sheet") === "Sheet3"
      ? anonymousCsv(135)
      : longFormCsv("2026-11-05 13:51:11.213");
    return new Response(csv, { status: 200 });
  };

  try {
    const records = await loadFromGoogleSheets(
      "https://docs.google.com/spreadsheets/d/example/export?format=csv&gid=0",
    );
    const anonymousUrl = new URL(requestedUrls[1]!);

    assert.equal(records.length, 136);
    assert.equal(records[0]?.respondentId, "SMAVO-0001");
    assert.equal(records[1]?.respondentId, "ANON-0001");
    assert.equal(anonymousUrl.searchParams.get("sheet"), "Sheet3");
    assert.equal(anonymousUrl.searchParams.get("headers"), "0");
    assert.equal(anonymousUrl.searchParams.get("tqx"), "out:csv");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("timestamp dates map to the last checkpoint on or before that date", () => {
  const cases = [
    ["2026-11-03", 1],
    ["11/3/2026 08:15:00", 1],
    ["2026-11-04", 1],
    ["11/4/2026 20:47:51", 1],
    ["2026-11-05", 1],
    ["11/6/2026 20:47:51", 2],
    ["2026-11-06", 2],
    ["2026-11-08", 2],
    ["2026-11-09", 3],
    ["2026-11-10", 3],
    ["2026-11-11", 3],
    ["2026-11-12", 4],
    ["2026-11-13", 4],
  ] as const;

  for (const [timestamp, expectedPeriod] of cases) {
    assert.equal(measurementFromTimestamp(timestamp, 2), expectedPeriod);
  }
  assert.throws(() => measurementFromTimestamp("invalid date", 2), /Timestamp/);
});

test("an explicit measurement period takes precedence over its timestamp", () => {
  const [record] = parseSurveyCsv(
    longFormCsv("2026-11-05 13:51:11.213", 4),
  );

  assert.equal(record?.periode, 4);
});

test("summary honors class, gender, and period filters", () => {
  const records = generateMockSurveyRecords();
  const filters: DashboardFilters = {
    kelas: "Kelas X",
    jenisKelamin: "Perempuan",
    periode: 2,
  };
  const filtered = filterSurveyRecords(records, filters);
  const summary = aggregateDashboardSummary(records, filters, "mock");

  assert.ok(filtered.every((record) => record.periode === 2));
  assert.ok(filtered.every((record) => record.kelas.startsWith("X-")));
  assert.ok(filtered.every((record) => record.jenisKelamin === "Perempuan"));
  assert.equal(summary.totalRespondents, new Set(filtered.map((row) => row.respondentId)).size);
  assert.equal(summary.totalResponses, filtered.length);
  assert.equal(summary.trends.length, 4);
  assert.deepEqual(
    summary.trends.map((point) => point.periode),
    [1, 2, 3, 4],
  );
});

test("class filters distinguish a specific homeroom from a whole grade", () => {
  const records = generateMockSurveyRecords();
  const homeroom = filterSurveyRecords(records, {
    ...noFilters,
    kelas: "X-1",
  });
  const grade = filterSurveyRecords(records, {
    ...noFilters,
    kelas: "Kelas X",
  });

  assert.ok(homeroom.length > 0);
  assert.ok(homeroom.every((record) => record.kelas === "X-1"));
  assert.ok(grade.length > homeroom.length);
  assert.ok(grade.every((record) => record.kelas.startsWith("X-")));
});

test("filter parser supports the Indonesian checkpoint alias and rejects invalid periods", () => {
  assert.deepEqual(
    parseDashboardFilters({
      kelas: "X",
      jenis_kelamin: "Perempuan",
      periode_pengukuran: "Pengukuran 4",
    }),
    { kelas: "X", jenisKelamin: "Perempuan", periode: 4 },
  );
  assert.throws(() => parseDashboardFilters({ periode: "5" }), /periode/);
  assert.throws(
    () => parseDashboardFilters({ kelas: "X".repeat(65) }),
    /terlalu panjang/,
  );
  assert.throws(
    () => parseDashboardFilters({ jenis_kelamin: "Laki\n-laki" }),
    /karakter kontrol/,
  );
});

test("Google Sheets refreshes are shared and fresh data is reused", async () => {
  const previousUrl = process.env.GOOGLE_SHEETS_CSV_URL;
  const originalFetch = globalThis.fetch;
  let releaseFetch: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseFetch = resolve;
  });
  let requestCount = 0;
  process.env.GOOGLE_SHEETS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/example/export?format=csv&gid=0";
  globalThis.fetch = async (input) => {
    requestCount += 1;
    await gate;
    const url = new URL(String(input));
    const csv = url.searchParams.get("sheet") === "Sheet3"
      ? anonymousCsv(1)
      : longFormCsv("2026-11-05 13:51:11.213");
    return new Response(csv, { status: 200 });
  };

  try {
    const firstRequest = getSurveyData();
    const secondRequest = getSurveyData();
    assert.equal(requestCount, 2);
    releaseFetch();

    const [first, second] = await Promise.all([firstRequest, secondRequest]);
    assert.strictEqual(first, second);
    assert.equal(requestCount, 2);
    await getSurveyData();
    assert.equal(requestCount, 2);
  } finally {
    releaseFetch();
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) {
      delete process.env.GOOGLE_SHEETS_CSV_URL;
    } else {
      process.env.GOOGLE_SHEETS_CSV_URL = previousUrl;
    }
  }
});

test("summary includes seven habits, normalized Likert percentages, grades, and all trends", () => {
  const records = generateMockSurveyRecords();
  const summary = aggregateDashboardSummary(records, noFilters, "mock");

  assert.equal(summary.habits.length, 7);
  assert.equal(summary.gradeComparison.length, 7);
  assert.equal(summary.trends.length, 4);
  assert.deepEqual(
    summary.trends.map((point) => point.periode),
    [1, 2, 3, 4],
  );
  for (const point of summary.distribution) {
    const percentage =
      point.tidakPernah + point.jarang + point.sering + point.selalu;
    assert.ok(Math.abs(percentage - 100) < 0.05);
  }

  for (const [grade, field] of [
    ["X", "kelasX"],
    ["XI", "kelasXI"],
    ["XII", "kelasXII"],
  ] as const) {
    const gradeSummary = aggregateDashboardSummary(
      records,
      { ...noFilters, kelas: grade },
      "mock",
    );
    summary.gradeComparison.forEach((point, index) => {
      assert.equal(point[field], gradeSummary.habits[index]?.score);
    });
  }
});
