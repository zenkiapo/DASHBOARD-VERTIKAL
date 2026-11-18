import type {
  ItemAnswers,
  ItemText,
  LikertScore,
  MeasurementPeriod,
  SurveyRecord,
} from "../types/survey.js";

const STUDENT_COUNT = 500;
const PERIODS: MeasurementPeriod[] = [1, 2, 3, 4];
const HABIT_BASELINES = [3.05, 3.35, 2.85, 3.1, 3.2, 3.25, 2.9];
const HABIT_NAMES = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
];
const GRADE_LABELS = ["X", "XI", "XII"] as const;
const GRADE_SHIFTS = [0, 0.04, 0.08];

function stableNoise(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function studentClass(index: number): { kelas: string; gradeIndex: number } {
  const gradeIndex = index % 3;
  const section = Math.floor(index / 3) % 4 + 1;
  return { kelas: `${GRADE_LABELS[gradeIndex]}-${section}`, gradeIndex };
}

function answersFor(
  studentIndex: number,
  gradeIndex: number,
  period: MeasurementPeriod,
): ItemAnswers {
  const answers: ItemAnswers = {};

  for (let item = 1; item <= 35; item += 1) {
    const habitIndex = Math.floor((item - 1) / 5);
    const itemOffset = stableNoise(studentIndex * 41 + item * 13) * 0.32;
    const studentOffset = stableNoise(studentIndex + habitIndex * 89) * 0.38;
    const periodProgress = (period - 1) * 0.045;
    const rawScore =
      HABIT_BASELINES[habitIndex]! +
      GRADE_SHIFTS[gradeIndex]! +
      studentOffset +
      itemOffset +
      periodProgress;

    answers[item] = Math.max(
      1,
      Math.min(4, Math.round(rawScore)),
    ) as LikertScore;
  }

  return answers;
}

function emptyTextMap(): ItemText {
  const values: ItemText = {};
  for (let item = 1; item <= 35; item += 1) values[item] = null;
  return values;
}

export function generateMockSurveyRecords(): SurveyRecord[] {
  const records: SurveyRecord[] = [];

  for (let index = 0; index < STUDENT_COUNT; index += 1) {
    const { kelas, gradeIndex } = studentClass(index);
    const jenisKelamin = index % 2 === 0 ? "Perempuan" : "Laki-laki";

    for (const periode of PERIODS) {
      const answers = answersFor(index, gradeIndex, periode);
      const itemCategories = emptyTextMap();
      const responseLabels = emptyTextMap();
      for (let item = 1; item <= 35; item += 1) {
        itemCategories[item] = HABIT_NAMES[Math.floor((item - 1) / 5)]!;
        responseLabels[item] = String(answers[item]);
      }

      records.push({
        respondentId: `SMAVO-${String(index + 1).padStart(4, "0")}`,
        submittedAt: null,
        angkatan: GRADE_LABELS[gradeIndex]!,
        kelas,
        jenisKelamin,
        periode,
        answers,
        responseAnswers: { ...answers },
        itemCategories,
        itemQuestions: emptyTextMap(),
        responseLabels,
      });
    }
  }

  return records;
}
