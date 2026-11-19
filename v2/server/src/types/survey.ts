export const HABITS = [
  { key: "bangunPagi", name: "Bangun Pagi", firstItem: 1, lastItem: 5 },
  { key: "beribadah", name: "Beribadah", firstItem: 6, lastItem: 10 },
  { key: "berolahraga", name: "Berolahraga", firstItem: 11, lastItem: 15 },
  {
    key: "makanSehat",
    name: "Makan Sehat dan Bergizi",
    firstItem: 16,
    lastItem: 20,
  },
  { key: "gemarBelajar", name: "Gemar Belajar", firstItem: 21, lastItem: 25 },
  { key: "bermasyarakat", name: "Bermasyarakat", firstItem: 26, lastItem: 30 },
  { key: "tidurCepat", name: "Tidur Cepat", firstItem: 31, lastItem: 35 },
] as const;

export type HabitKey = (typeof HABITS)[number]["key"];
export type MeasurementPeriod = 1 | 2 | 3 | 4;
export type LikertScore = 1 | 2 | 3 | 4;
export type DataSource = "mock" | "google-sheets";

export type ItemAnswers = Record<number, LikertScore | null>;
export type ItemText = Record<number, string | null>;

export interface SurveyRecord {
  respondentId: string;
  submittedAt: string | null;
  angkatan: string | null;
  kelas: string;
  jenisKelamin: string;
  periode: MeasurementPeriod | null;
  answers: ItemAnswers;
  responseAnswers: ItemAnswers;
  itemCategories: ItemText;
  itemQuestions: ItemText;
  responseLabels: ItemText;
}

export interface DashboardFilters {
  kelas: string | null;
  jenisKelamin: string | null;
  periode: MeasurementPeriod | null;
}

export interface HabitScore {
  key: HabitKey;
  habit: string;
  itemRange: [number, number];
  score: number | null;
  responseCount: number;
}

export interface DistributionPoint {
  key: HabitKey;
  habit: string;
  tidakPernah: number;
  jarang: number;
  sering: number;
  selalu: number;
  totalResponses: number;
}

export interface TrendPoint {
  periode: MeasurementPeriod;
  label: `Pengukuran ${MeasurementPeriod}`;
  scores: Record<HabitKey, number | null>;
}

export interface GradeComparisonPoint {
  key: HabitKey;
  habit: string;
  kelasX: number | null;
  kelasXI: number | null;
  kelasXII: number | null;
}

export interface DemographicCount {
  label: string;
  total: number;
}

export interface DashboardSummary {
  totalRespondents: number;
  totalResponses: number;
  overallIndex: number | null;
  highestHabit: HabitScore | null;
  priorityHabit: HabitScore | null;
  habits: HabitScore[];
  priorityHabits: HabitScore[];
  distribution: DistributionPoint[];
  gradeComparison: GradeComparisonPoint[];
  trends: TrendPoint[];
  demographics: {
    kelas: DemographicCount[];
    jenisKelamin: DemographicCount[];
  };
  appliedFilters: DashboardFilters;
  dataSource: DataSource;
}

export interface PeriodComparisonHabit {
  key: HabitKey;
  habit: string;
  fromScore: number | null;
  toScore: number | null;
  delta: number | null;
  changePercent: number | null;
  direction: "up" | "down" | "stable" | "unavailable";
}

export interface PeriodComparison {
  fromPeriod: MeasurementPeriod;
  toPeriod: MeasurementPeriod;
  fromRespondents: number;
  toRespondents: number;
  habits: PeriodComparisonHabit[];
  appliedFilters: {
    kelas: string | null;
    jenisKelamin: string | null;
  };
  dataSource: DataSource;
  isStale?: boolean;
}

export interface CachedSurveyData {
  records: SurveyRecord[];
  dataSource: DataSource;
  isStale?: boolean;
}
