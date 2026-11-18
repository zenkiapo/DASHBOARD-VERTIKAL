import {
  HABITS,
  type DashboardFilters,
  type DashboardSummary,
  type HabitKey,
  type HabitScore,
  type MeasurementPeriod,
  type SurveyRecord,
} from "../types/survey.js";

const PERIODS: MeasurementPeriod[] = [1, 2, 3, 4];
const GRADES = ["X", "XI", "XII"] as const;
const MAX_FILTER_LENGTH = 64;

function gradeFromClass(kelas: string): (typeof GRADES)[number] | null {
  const normalized = kelas.trim().toUpperCase().replace(/^KELAS\s+/, "");
  const match = normalized.match(/^(XII|XI|X)(?=$|[\s/-])/);
  const grade = match?.[1];
  return grade === "X" || grade === "XI" || grade === "XII" ? grade : null;
}

function normalizedText(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

function matchesClass(kelas: string, filter: string): boolean {
  const normalizedFilter = filter.trim().toUpperCase().replace(/^KELAS\s+/, "");
  if (/^(XII|XI|X)$/.test(normalizedFilter)) {
    return gradeFromClass(kelas) === normalizedFilter;
  }
  return normalizedText(kelas) === normalizedText(filter);
}

export function filterSurveyRecords(
  records: SurveyRecord[],
  filters: DashboardFilters,
  includePeriod = true,
): SurveyRecord[] {
  return records.filter((record) => {
    if (filters.kelas && !matchesClass(record.kelas, filters.kelas)) return false;
    if (
      filters.jenisKelamin &&
      normalizedText(record.jenisKelamin) !== normalizedText(filters.jenisKelamin)
    ) {
      return false;
    }
    if (
      includePeriod &&
      filters.periode !== null &&
      record.periode !== filters.periode
    ) {
      return false;
    }
    return true;
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function uniqueRespondents(records: SurveyRecord[]): number {
  return new Set(records.map((record) => record.respondentId)).size;
}

function averageHabit(
  records: SurveyRecord[],
  habitIndex: number,
): HabitScore {
  const habit = HABITS[habitIndex]!;
  let total = 0;
  let responseCount = 0;

  for (const record of records) {
    for (let item = habit.firstItem; item <= habit.lastItem; item += 1) {
      const score = record.answers[item];
      if (score !== null && score !== undefined) {
        total += score;
        responseCount += 1;
      }
    }
  }

  return {
    key: habit.key,
    habit: habit.name,
    itemRange: [habit.firstItem, habit.lastItem],
    score: responseCount === 0 ? null : round2(total / responseCount),
    responseCount,
  };
}

function aggregateDistribution(records: SurveyRecord[]): DashboardSummary["distribution"] {
  return HABITS.map((habit) => {
    const counts = [0, 0, 0, 0];
    for (const record of records) {
      for (let item = habit.firstItem; item <= habit.lastItem; item += 1) {
        const score = record.responseAnswers[item];
        if (score !== null && score !== undefined) counts[score - 1]! += 1;
      }
    }

    const totalResponses = counts.reduce((total, count) => total + count, 0);
    const percentage = (count: number): number =>
      totalResponses === 0 ? 0 : round2((count / totalResponses) * 100);

    return {
      key: habit.key,
      habit: habit.name,
      tidakPernah: percentage(counts[0]!),
      jarang: percentage(counts[1]!),
      sering: percentage(counts[2]!),
      selalu: percentage(counts[3]!),
      totalResponses,
    };
  });
}

function habitScoreMap(records: SurveyRecord[]): Record<HabitKey, number | null> {
  const scores = {} as Record<HabitKey, number | null>;
  HABITS.forEach((habit, index) => {
    scores[habit.key] = averageHabit(records, index).score;
  });
  return scores;
}

function countBy(
  records: SurveyRecord[],
  getLabel: (record: SurveyRecord) => string,
): { label: string; total: number }[] {
  const labelsByRespondent = new Map<string, string>();
  for (const record of records) {
    labelsByRespondent.set(record.respondentId, getLabel(record));
  }

  const counts = new Map<string, number>();
  for (const label of labelsByRespondent.values()) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([first], [second]) => first.localeCompare(second, "id"))
    .map(([label, total]) => ({ label, total }));
}

function gradeComparison(
  records: SurveyRecord[],
): DashboardSummary["gradeComparison"] {
  const totalsByGrade = new Map<
    (typeof GRADES)[number],
    Array<{ total: number; count: number }>
  >(
    GRADES.map((grade) => [
      grade,
      HABITS.map(() => ({ total: 0, count: 0 })),
    ]),
  );

  for (const record of records) {
    const grade = gradeFromClass(record.kelas);
    if (!grade) continue;
    const gradeTotals = totalsByGrade.get(grade);
    if (!gradeTotals) continue;

    HABITS.forEach((habit, habitIndex) => {
      const habitTotals = gradeTotals[habitIndex]!;
      for (let item = habit.firstItem; item <= habit.lastItem; item += 1) {
        const score = record.answers[item];
        if (score !== null && score !== undefined) {
          habitTotals.total += score;
          habitTotals.count += 1;
        }
      }
    });
  }

  return HABITS.map((habit, index) => {
    const scoreForGrade = (grade: (typeof GRADES)[number]): number | null => {
      const totals = totalsByGrade.get(grade)![index]!;
      return totals.count === 0 ? null : round2(totals.total / totals.count);
    };

    return {
      key: habit.key,
      habit: habit.name,
      kelasX: scoreForGrade("X"),
      kelasXI: scoreForGrade("XI"),
      kelasXII: scoreForGrade("XII"),
    };
  });
}

export function aggregateDashboardSummary(
  records: SurveyRecord[],
  filters: DashboardFilters,
  dataSource: DashboardSummary["dataSource"],
): DashboardSummary {
  const filteredRecords = filterSurveyRecords(records, filters);
  // Keep the four-checkpoint trend intact when a single period is selected for the KPIs.
  const trendRecords = filterSurveyRecords(records, filters, false);
  const habits = HABITS.map((_, index) => averageHabit(filteredRecords, index));
  const rankedHabits = [...habits].sort((first, second) => {
    if (first.score === null) return second.score === null ? 0 : 1;
    if (second.score === null) return -1;
    return second.score - first.score;
  });
  const lowestHabits = [...habits].sort((first, second) => {
    if (first.score === null) return second.score === null ? 0 : 1;
    if (second.score === null) return -1;
    return first.score - second.score;
  });
  const overallScores = habits.flatMap((habit) =>
    habit.score === null ? [] : [habit.score],
  );
  // Give each of the seven habit categories equal weight in the composite index.
  const overallIndex =
    overallScores.length === 0
      ? null
      : round2(
          overallScores.reduce((total, score) => total + score, 0) /
            overallScores.length,
        );
  const classDemographics = GRADES.map((grade) => ({
    label: `Kelas ${grade}`,
    total: uniqueRespondents(
      filteredRecords.filter(
        (record) => gradeFromClass(record.kelas) === grade,
      ),
    ),
  }));
  const respondentsWithoutGrade = uniqueRespondents(
    filteredRecords.filter((record) => gradeFromClass(record.kelas) === null),
  );
  if (respondentsWithoutGrade > 0) {
    classDemographics.push({
      label: "Anonim / tidak diketahui",
      total: respondentsWithoutGrade,
    });
  }

  return {
    totalRespondents: uniqueRespondents(filteredRecords),
    totalResponses: filteredRecords.length,
    overallIndex,
    highestHabit: rankedHabits[0]?.score === null ? null : rankedHabits[0] ?? null,
    priorityHabit: lowestHabits[0]?.score === null ? null : lowestHabits[0] ?? null,
    habits,
    priorityHabits: lowestHabits.slice(0, 2),
    distribution: aggregateDistribution(filteredRecords),
    gradeComparison: gradeComparison(filteredRecords),
    trends: PERIODS.map((periode) => ({
      periode,
      label: `Pengukuran ${periode}` as const,
      scores: habitScoreMap(
        trendRecords.filter((record) => record.periode === periode),
      ),
    })),
    demographics: {
      kelas: classDemographics,
      jenisKelamin: countBy(filteredRecords, (record) => record.jenisKelamin),
    },
    appliedFilters: filters,
    dataSource,
  };
}

export function parseDashboardFilters(
  query: Record<string, unknown>,
): DashboardFilters {
  const readString = (name: string): string | null => {
    const value = query[name];
    if (value === undefined) return null;
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Query parameter "${name}" harus berupa teks tunggal.`);
    }
    const normalized = value.trim();
    if (
      normalized.length > MAX_FILTER_LENGTH ||
      /[\u0000-\u001f\u007f]/.test(normalized)
    ) {
      throw new Error(
        `Query parameter "${name}" terlalu panjang atau mengandung karakter kontrol.`,
      );
    }
    return normalized;
  };

  const kelas = readString("kelas");
  const jenisKelamin = readString("jenis_kelamin");
  const periodeValue = readString("periode") ?? readString("periode_pengukuran");
  if (periodeValue === null) {
    return { kelas, jenisKelamin, periode: null };
  }

  const match = periodeValue.match(/^(?:pengukuran\s*)?([1-4])$/i);
  if (!match) {
    throw new Error('Filter "periode" harus bernilai 1, 2, 3, atau 4.');
  }
  return {
    kelas,
    jenisKelamin,
    periode: Number(match[1]) as MeasurementPeriod,
  };
}
