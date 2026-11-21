export const HABIT_KEYS = [
  "bangunPagi",
  "beribadah",
  "berolahraga",
  "makanSehat",
  "gemarBelajar",
  "bermasyarakat",
  "tidurCepat",
] as const;

export type HabitKey = (typeof HABIT_KEYS)[number];
export type MeasurementPeriod = 1 | 2 | 3 | 4;

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
  appliedFilters: {
    kelas: string | null;
    jenisKelamin: string | null;
    periode: MeasurementPeriod | null;
  };
  dataSource: "mock" | "google-sheets";
  isStale?: boolean;
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
  dataSource: "mock" | "google-sheets";
  isStale?: boolean;
}

export interface DashboardFilters {
  kelas: string;
  rombel: string;
  jenisKelamin: string;
  periode: string;
}
