import NodeCache from "node-cache";
import Papa from "papaparse";
import { HABITS } from "../types/survey.js";
import type {
  CachedSurveyData,
  ItemAnswers,
  ItemText,
  LikertScore,
  MeasurementPeriod,
  SurveyRecord,
} from "../types/survey.js";

const CACHE_KEY = "survey-data";
const STALE_CACHE_KEY = "survey-data-last-known-good";
const CACHE_TTL_SECONDS = 180;
const STALE_CACHE_TTL_SECONDS = 24 * 60 * 60;
const ITEM_COUNT = 35;
const ANONYMOUS_SHEET_NAME = "Sheet3";
const PERIOD_CHECKPOINTS = [
  { year: 2026, month: 11, day: 4, period: 1 },
  { year: 2026, month: 11, day: 6, period: 2 },
  { year: 2026, month: 11, day: 9, period: 3 },
  { year: 2026, month: 11, day: 12, period: 4 },
] as const;
const cache = new NodeCache({
  stdTTL: CACHE_TTL_SECONDS,
  checkperiod: 30,
});

export class SurveyDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveyDataError";
  }
}

export class SurveyConfigError extends SurveyDataError {
  constructor(message: string) {
    super(message);
    this.name = "SurveyConfigError";
  }
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function itemNumberFromHeader(header: string): number | null {
  const match = header.match(/^(?:item|pernyataan|q)_?(\d{1,2})$/);
  if (!match) return null;
  const item = Number(match[1]);
  return item >= 1 && item <= ITEM_COUNT ? item : null;
}

function measurementFromValue(value: string, rowNumber: number): MeasurementPeriod {
  const match = value.match(/(?:pengukuran|periode|p)?\s*([1-4])\s*$/i);
  if (!match) {
    throw new SurveyDataError(
      `Periode pengukuran tidak valid pada baris CSV ${rowNumber}.`,
    );
  }
  return Number(match[1]) as MeasurementPeriod;
}

export function measurementFromTimestamp(
  value: string,
  rowNumber: number,
): MeasurementPeriod {
  // Read the calendar date as written by Sheets to avoid UTC date shifts.
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const year = isoMatch ? Number(isoMatch[1]) : Number(usMatch?.[3]);
  const month = isoMatch ? Number(isoMatch[2]) : Number(usMatch?.[1]);
  const day = isoMatch ? Number(isoMatch[3]) : Number(usMatch?.[2]);
  if (!isoMatch && !usMatch) {
    throw new SurveyDataError(
      `Timestamp tidak valid pada baris CSV ${rowNumber}.`,
    );
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new SurveyDataError(
      `Tanggal timestamp tidak valid pada baris CSV ${rowNumber}.`,
    );
  }

  let selected: (typeof PERIOD_CHECKPOINTS)[number] = PERIOD_CHECKPOINTS[0];
  for (const checkpoint of PERIOD_CHECKPOINTS) {
    const dateOrder =
      year - checkpoint.year ||
      month - checkpoint.month ||
      day - checkpoint.day;
    if (dateOrder < 0) break;
    selected = checkpoint;
  }
  return selected.period;
}

function likertFromValue(
  value: string,
  rowNumber: number,
  itemNumber: number,
): LikertScore | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) {
    return numeric as LikertScore;
  }

  const scores: Record<string, LikertScore> = {
    "tidak pernah": 1,
    jarang: 2,
    sering: 3,
    selalu: 4,
  };
  const score = scores[normalized];
  if (score !== undefined) return score;

  throw new SurveyDataError(
    `Jawaban item_${itemNumber} tidak valid pada baris CSV ${rowNumber}.`,
  );
}

function emptyScoreMap(): ItemAnswers {
  const values: ItemAnswers = {};
  for (let item = 1; item <= ITEM_COUNT; item += 1) values[item] = null;
  return values;
}

function emptyTextMap(): ItemText {
  const values: ItemText = {};
  for (let item = 1; item <= ITEM_COUNT; item += 1) values[item] = null;
  return values;
}

function firstHeader(
  headers: string[],
  aliases: readonly string[],
): string | undefined {
  return headers.find((header) => aliases.includes(header));
}

function habitFromCategory(category: string): (typeof HABITS)[number] | undefined {
  const normalized = normalizeHeader(category);
  const aliases: Record<string, (typeof HABITS)[number]["key"]> = {
    bangun_pagi: "bangunPagi",
    beribadah: "beribadah",
    berolahraga: "berolahraga",
    makan_makanan_sehat_dan_bergizi: "makanSehat",
    makan_sehat_dan_bergizi: "makanSehat",
    gemar_membaca_belajar: "gemarBelajar",
    gemar_belajar: "gemarBelajar",
    bermasyarakat_kepedulian_sosial: "bermasyarakat",
    bermasyarakat: "bermasyarakat",
    istirahat_cepat_tidur_tepat_waktu: "tidurCepat",
    tidur_cepat: "tidurCepat",
  };
  const key = aliases[normalized];
  return HABITS.find((habit) => habit.key === key);
}

function parseLongForm(
  rows: Record<string, string>[],
  headers: string[],
): SurveyRecord[] {
  const timestampHeader = firstHeader(headers, ["timestamp"]);
  const emailHeader = firstHeader(headers, ["email", "alamat_email"]);
  const genderHeader = firstHeader(headers, ["jenis_kelamin", "gender", "sex"]);
  const gradeHeader = firstHeader(headers, ["angkatan", "grade", "jenjang"]);
  const classHeader = firstHeader(headers, ["kelas", "class"]);
  const categoryHeader = firstHeader(headers, [
    "kategori_kebiasaan",
    "habit_category",
  ]);
  const questionHeader = firstHeader(headers, ["pertanyaan", "question", "item"]);
  const responseHeader = firstHeader(headers, ["respon", "response", "jawaban"]);
  const scoreHeader = firstHeader(headers, [
    "skor_likert",
    "likert_score",
    "score",
  ]);
  const periodHeader = firstHeader(headers, [
    "periode_pengukuran",
    "periode",
    "measurement",
    "pengukuran",
  ]);

  if (
    !timestampHeader ||
    !genderHeader ||
    !classHeader ||
    !categoryHeader ||
    !questionHeader ||
    (!responseHeader && !scoreHeader)
  ) {
    throw new SurveyDataError(
      "CSV format baris-per-butir membutuhkan Timestamp, Jenis Kelamin, Kelas, Kategori Kebiasaan, Pertanyaan, dan Respon atau Skor Likert.",
    );
  }

  const records = new Map<string, SurveyRecord>();
  const respondentIds = new Map<string, string>();
  const itemByQuestion = new Map<string, Map<string, number>>();
  const seenItems = new Map<string, Set<number>>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const timestamp = row[timestampHeader]?.trim();
    const email = emailHeader
      ? row[emailHeader]?.trim().toLocaleLowerCase("id-ID")
      : "";
    const kelas = row[classHeader]?.trim();
    const jenisKelamin = row[genderHeader]?.trim();
    const category = row[categoryHeader]?.trim();
    const question = row[questionHeader]?.trim();
    const responseLabel = responseHeader
      ? row[responseHeader]?.trim() ?? ""
      : "";

    if (!timestamp || !kelas || !jenisKelamin || !category || !question) {
      throw new SurveyDataError(
        `Kolom wajib kosong pada baris CSV ${rowNumber}.`,
      );
    }

    const habit = habitFromCategory(category);
    if (!habit) {
      throw new SurveyDataError(
        `Kategori kebiasaan tidak dikenal pada baris CSV ${rowNumber}.`,
      );
    }

    let questionIndexes = itemByQuestion.get(habit.key);
    if (!questionIndexes) {
      questionIndexes = new Map<string, number>();
      itemByQuestion.set(habit.key, questionIndexes);
    }
    let item = questionIndexes.get(question);
    if (item === undefined) {
      if (questionIndexes.size >= 5) {
        throw new SurveyDataError(
          `Kategori ${habit.name} memiliki lebih dari lima pertanyaan.`,
        );
      }
      item = habit.firstItem + questionIndexes.size;
      questionIndexes.set(question, item);
    }

    const identity = email || timestamp;
    const respondentId =
      respondentIds.get(identity) ??
      `SMAVO-${String(respondentIds.size + 1).padStart(4, "0")}`;
    respondentIds.set(identity, respondentId);
    const periode = periodHeader
      ? measurementFromValue(row[periodHeader]?.trim() ?? "", rowNumber)
      : measurementFromTimestamp(timestamp, rowNumber);
    const recordKey = `${identity}\u0000${periode}\u0000${timestamp}`;
    let record = records.get(recordKey);
    if (!record) {
      record = {
        respondentId,
        submittedAt: timestamp,
        angkatan: gradeHeader ? row[gradeHeader]?.trim() ?? null : null,
        kelas,
        jenisKelamin,
        periode,
        answers: emptyScoreMap(),
        responseAnswers: emptyScoreMap(),
        itemCategories: emptyTextMap(),
        itemQuestions: emptyTextMap(),
        responseLabels: emptyTextMap(),
      };
      records.set(recordKey, record);
      seenItems.set(recordKey, new Set<number>());
    }

    const recordItems = seenItems.get(recordKey)!;
    if (recordItems.has(item)) {
      throw new SurveyDataError(
        `Butir survei duplikat pada baris CSV ${rowNumber}.`,
      );
    }
    recordItems.add(item);
    const responseScore = likertFromValue(responseLabel, rowNumber, item);
    const scoredValue = scoreHeader
      ? likertFromValue(row[scoreHeader]?.trim() ?? "", rowNumber, item)
      : responseScore;

    record.answers[item] = scoredValue ?? responseScore;
    record.responseAnswers[item] = responseScore ?? scoredValue;
    record.itemCategories[item] = category;
    record.itemQuestions[item] = question;
    record.responseLabels[item] = responseLabel || null;
  });

  for (const habit of HABITS) {
    if (itemByQuestion.get(habit.key)?.size !== 5) {
      throw new SurveyDataError(
        `Kategori ${habit.name} harus memiliki tepat lima pertanyaan.`,
      );
    }
  }

  const completeRecords: SurveyRecord[] = [];
  let incompleteCount = 0;
  for (const [recordKey, record] of records) {
    const recordItems = seenItems.get(recordKey);
    if (recordItems?.size !== ITEM_COUNT) {
      incompleteCount += 1;
      continue;
    }
    let hasMissingAnswer = false;
    for (let item = 1; item <= ITEM_COUNT; item += 1) {
      if (record.answers[item] === null) {
        hasMissingAnswer = true;
        break;
      }
    }
    if (hasMissingAnswer) {
      incompleteCount += 1;
      continue;
    }
    completeRecords.push(record);
  }
  if (incompleteCount > 0) {
    console.warn(
      `[survey-data] ${incompleteCount} pengisian utama tidak lengkap (kurang dari ${ITEM_COUNT} jawaban valid) dilewati.`,
    );
  }
  if (completeRecords.length === 0) {
    throw new SurveyDataError(
      `Tidak ada pengisian lengkap dengan ${ITEM_COUNT} jawaban valid pada CSV utama.`,
    );
  }

  return completeRecords;
}

function parseWideForm(
  rows: Record<string, string>[],
  headers: string[],
): SurveyRecord[] {
  const respondentIdHeader = firstHeader(headers, [
    "respondent_id",
    "id_responden",
    "responden_id",
    "id_siswa",
  ]);
  const kelasHeader = firstHeader(headers, ["kelas", "class", "kelas_siswa"]);
  const genderHeader = firstHeader(headers, ["jenis_kelamin", "gender", "sex"]);
  const periodeHeader = firstHeader(headers, [
    "periode_pengukuran",
    "periode",
    "measurement",
    "pengukuran",
  ]);
  const timestampHeader = firstHeader(headers, ["timestamp"]);
  const gradeHeader = firstHeader(headers, ["angkatan", "grade", "jenjang"]);
  const itemHeaders = new Map<number, string>();
  for (const header of headers) {
    const itemNumber = itemNumberFromHeader(header);
    if (itemNumber !== null) itemHeaders.set(itemNumber, header);
  }

  if (!respondentIdHeader || !kelasHeader || !genderHeader || itemHeaders.size !== ITEM_COUNT) {
    throw new SurveyDataError(
      "CSV harus memiliki respondent_id, kelas, jenis_kelamin, serta item_1 sampai item_35.",
    );
  }

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const respondentId = row[respondentIdHeader]?.trim();
    const kelas = row[kelasHeader]?.trim();
    const jenisKelamin = row[genderHeader]?.trim();
    if (!respondentId || !kelas || !jenisKelamin) {
      throw new SurveyDataError(
        `Kolom demografi wajib kosong pada baris CSV ${rowNumber}.`,
      );
    }

    const answers = emptyScoreMap();
    const responseAnswers = emptyScoreMap();
    const itemCategories = emptyTextMap();
    const itemQuestions = emptyTextMap();
    const responseLabels = emptyTextMap();
    for (let item = 1; item <= ITEM_COUNT; item += 1) {
      const header = itemHeaders.get(item);
      if (!header) {
        throw new SurveyDataError(`Kolom item_${item} tidak ditemukan.`);
      }
      const label = row[header]?.trim() ?? "";
      const score = likertFromValue(label, rowNumber, item);
      if (score === null) {
        throw new SurveyDataError(
          `Jawaban item_${item} kosong pada baris CSV ${rowNumber}.`,
        );
      }
      answers[item] = score;
      responseAnswers[item] = score;
      itemCategories[item] = HABITS[Math.floor((item - 1) / 5)]!.name;
      responseLabels[item] = label || null;
    }

    return {
      respondentId,
      submittedAt: timestampHeader ? row[timestampHeader]?.trim() ?? null : null,
      angkatan: gradeHeader ? row[gradeHeader]?.trim() ?? null : null,
      kelas,
      jenisKelamin,
      periode: periodeHeader
        ? measurementFromValue(row[periodeHeader]?.trim() ?? "", rowNumber)
        : timestampHeader
          ? measurementFromTimestamp(
              row[timestampHeader]?.trim() ?? "",
              rowNumber,
            )
          : 1,
      answers,
      responseAnswers,
      itemCategories,
      itemQuestions,
      responseLabels,
    };
  });
}

export function parseSurveyCsv(csv: string): SurveyRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });
  if (parsed.errors.length > 0) {
    throw new SurveyDataError("Format CSV Google Sheets tidak valid.");
  }

  const headers = parsed.meta.fields ?? Object.keys(parsed.data[0] ?? {});
  const hasLongFormColumns =
    headers.includes("kategori_kebiasaan") &&
    headers.includes("pertanyaan");

  return hasLongFormColumns
    ? parseLongForm(parsed.data, headers)
    : parseWideForm(parsed.data, headers);
}

export function parseAnonymousCsv(csv: string): SurveyRecord[] {
  const parsed = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length > 0) {
    throw new SurveyDataError("CSV anonim Google Sheets tidak valid.");
  }

  return parsed.data.map((row, index) => {
    const rowNumber = index + 1;
    if (row.length !== ITEM_COUNT) {
      throw new SurveyDataError(
        `Baris anonim ${rowNumber} harus berisi tepat ${ITEM_COUNT} jawaban.`,
      );
    }

    const answers = emptyScoreMap();
    const responseAnswers = emptyScoreMap();
    const itemCategories = emptyTextMap();
    const responseLabels = emptyTextMap();
    for (let item = 1; item <= ITEM_COUNT; item += 1) {
      const label = row[item - 1]?.trim() ?? "";
      const responseScore = likertFromValue(label, rowNumber, item);
      if (responseScore === null) {
        throw new SurveyDataError(
          `Jawaban item_${item} kosong pada baris anonim ${rowNumber}.`,
        );
      }
      // Item 4 is the reverse-worded lateness statement.
      const score =
        item === 4 && responseScore !== null
          ? ((5 - responseScore) as LikertScore)
          : responseScore;

      answers[item] = score;
      responseAnswers[item] = responseScore;
      itemCategories[item] = HABITS[Math.floor((item - 1) / 5)]!.name;
      responseLabels[item] = label || null;
    }

    return {
      respondentId: `ANON-${String(index + 1).padStart(4, "0")}`,
      submittedAt: null,
      angkatan: null,
      kelas: "Anonim",
      jenisKelamin: "Tidak diketahui",
      periode: null,
      answers,
      responseAnswers,
      itemCategories,
      itemQuestions: emptyTextMap(),
      responseLabels,
    };
  });
}

function anonymousSheetCsvUrl(sourceUrl: string): string {
  const match = sourceUrl.match(
    /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]+)/,
  );
  if (!match) {
    throw new SurveyDataError(
      "URL Sheets harus berupa tautan Google Spreadsheet agar Sheet3 dapat dimuat.",
    );
  }

  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq`,
  );
  url.searchParams.set("sheet", ANONYMOUS_SHEET_NAME);
  url.searchParams.set("tq", "select *");
  url.searchParams.set("headers", "0");
  url.searchParams.set("tqx", "out:csv");
  return url.toString();
}

async function fetchCsv(url: string, sheetName: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new SurveyDataError(`${sheetName} tidak dapat diakses.`);
  }
  if (!response.ok) {
    throw new SurveyDataError(
      `${sheetName} mengembalikan HTTP ${response.status}.`,
    );
  }
  return response.text();
}

export async function loadFromGoogleSheets(url: string): Promise<SurveyRecord[]> {
  const [mainCsv, anonymousCsv] = await Promise.all([
    fetchCsv(url, "Sheet survei utama"),
    fetchCsv(anonymousSheetCsvUrl(url), ANONYMOUS_SHEET_NAME),
  ]);
  return [
    ...parseSurveyCsv(mainCsv),
    ...parseAnonymousCsv(anonymousCsv),
  ];
}

export async function getSurveyData(): Promise<CachedSurveyData> {
  const cached = cache.get<CachedSurveyData>(CACHE_KEY);
  if (cached) return cached;

  try {
    const sheetUrl = process.env.GOOGLE_SHEETS_CSV_URL?.trim();
    if (!sheetUrl) {
      throw new SurveyConfigError(
        "GOOGLE_SHEETS_CSV_URL belum dikonfigurasi pada file .env.",
      );
    }
    const data: CachedSurveyData = {
      records: await loadFromGoogleSheets(sheetUrl),
      dataSource: "google-sheets",
      isStale: false,
    };
    cache.set(CACHE_KEY, data, CACHE_TTL_SECONDS);
    cache.set(STALE_CACHE_KEY, data, STALE_CACHE_TTL_SECONDS);
    return data;
  } catch (error) {
    const lastKnownGood = cache.get<CachedSurveyData>(STALE_CACHE_KEY);
    if (lastKnownGood) {
      console.warn(
        "[survey-cache] Google Sheets refresh failed; serving validated data from the last successful refresh.",
      );
      return { ...lastKnownGood, isStale: true };
    }
    throw error;
  }
}
