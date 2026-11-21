import type { RequestHandler } from "express";
import { NoteStatus, Prisma, type Role } from "@prisma/client";
import { ApiError } from "../errors/ApiError.js";
import { prisma } from "../lib/prisma.js";
import {
  canManageRtlContent,
  canUpdateRtlStatus,
  canViewRtlPlan,
  isRtlResponsibleRole,
} from "../services/rtlAccess.js";
import { aggregatePeriodComparison, parseDashboardFilters } from "../services/aggregatorService.js";
import { getSurveyData } from "../services/sheetsService.js";
import {
  HABITS,
  type MeasurementPeriod,
  type PeriodComparison,
} from "../types/survey.js";

const planInclude = {
  author: { select: { name: true, role: true } },
};

function requireUser(request: Parameters<RequestHandler>[0]) {
  if (!request.authUser) throw new ApiError("Autentikasi diperlukan.", 401);
  return request.authUser;
}

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError("Body permintaan tidak valid.", 400);
  }
  return value as Record<string, unknown>;
}

function readText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number,
): string {
  const value = body[field];
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new ApiError(`${field} wajib diisi (maksimal ${maxLength} karakter).`, 400);
  }
  return value.trim();
}

function readPeriod(value: unknown, field: string): MeasurementPeriod {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 4) {
    throw new ApiError(`${field} harus bernilai 1, 2, 3, atau 4.`, 400);
  }
  return Number(value) as MeasurementPeriod;
}

function readScope(value: string): string {
  const match = value.match(/^Kelas (XII|XI|X)$/i);
  const normalized = match
    ? `Kelas ${match[1]!.toUpperCase()}`
    : value.toUpperCase() === "SELURUH SISWA"
      ? "Seluruh Siswa"
      : value.toUpperCase();
  if (
    normalized !== "Seluruh Siswa" &&
    !/^Kelas (X|XI|XII)$/.test(normalized) &&
    !/^(X|XI|XII)-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(normalized)
  ) {
    throw new ApiError("Target harus berupa seluruh siswa, jenjang, atau rombel.", 400);
  }
  return normalized;
}

function readHabit(value: string): string {
  if (!HABITS.some((habit) => habit.name === value)) {
    throw new ApiError("Kategori kebiasaan tidak dikenal.", 400);
  }
  return value;
}

async function buildComparison(
  body: Record<string, unknown>,
): Promise<PeriodComparison> {
  const fromPeriod = readPeriod(body.comparisonFrom, "comparisonFrom");
  const toPeriod = readPeriod(body.comparisonTo, "comparisonTo");
  if (fromPeriod === toPeriod) throw new ApiError("Pilih dua periode berbeda.", 400);
  const filterInput: Record<string, unknown> = {};
  if (body.kelas !== undefined && body.kelas !== "") {
    filterInput.kelas = body.kelas;
  }
  if (body.jenisKelamin !== undefined && body.jenisKelamin !== "") {
    filterInput.jenis_kelamin = body.jenisKelamin;
  }
  const filters = parseDashboardFilters({
    ...filterInput,
  });
  const { records, dataSource, isStale } = await getSurveyData();
  if (dataSource !== "google-sheets") {
    throw new ApiError("RTL hanya dapat dibuat dari data Google Sheets.", 503);
  }
  return {
    ...aggregatePeriodComparison(
    records,
    { kelas: filters.kelas, jenisKelamin: filters.jenisKelamin },
    fromPeriod,
    toPeriod,
    dataSource,
    ),
    isStale: isStale ?? false,
  };
}

function toDto<T extends { comparisonSummary: string }>(plan: T) {
  const { comparisonSummary, ...fields } = plan;
  return {
    ...fields,
    comparison: JSON.parse(comparisonSummary) as PeriodComparison,
  };
}

export const getRtlPlansController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    if (user.role === "SISWA") {
      throw new ApiError("Role tidak memiliki akses ke workspace RTL.", 403);
    }
    if (user.role === "WALI_KELAS" && !user.assignedClass) {
      throw new ApiError("Akun wali kelas belum memiliki kelas binaan.", 403);
    }
    const plans = await prisma.rtlPlan.findMany({
      where:
        user.role === "WALI_KELAS"
          ? {
              OR: [
                { targetScope: "Seluruh Siswa" },
                { targetScope: `Kelas ${user.assignedClass!.split("-")[0]}` },
                { targetScope: user.assignedClass! },
              ],
            }
          : undefined,
      include: planInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    response.json({
      plans: plans
        .filter((plan) => canViewRtlPlan(user, plan.targetScope))
        .map(toDto),
    });
  } catch (error) {
    next(error);
  }
};

export const createRtlPlanController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    if (!canManageRtlContent(user.role)) {
      throw new ApiError("Hanya KEPSEK atau ADMIN yang dapat menyusun RTL.", 403);
    }
    const body = readRecord(request.body);
    const allowedFields = new Set([
      "habitCategory",
      "targetScope",
      "planContent",
      "responsibleRole",
      "comparisonFrom",
      "comparisonTo",
      "kelas",
      "jenisKelamin",
    ]);
    if (Object.keys(body).some((key) => !allowedFields.has(key))) {
      throw new ApiError("Body memuat field yang tidak didukung.", 400);
    }
    const habitCategory = readHabit(readText(body, "habitCategory", 80));
    const targetScope = readScope(readText(body, "targetScope", 80));
    const planContent = readText(body, "planContent", 4000);
    if (!isRtlResponsibleRole(body.responsibleRole)) {
      throw new ApiError("Peran penanggung jawab RTL tidak valid.", 400);
    }
    const comparison = await buildComparison(body);
    const plan = await prisma.rtlPlan.create({
      data: {
        authorId: user.id,
        habitCategory,
        targetScope,
        planContent,
        responsibleRole: body.responsibleRole,
        status: NoteStatus.PENDING,
        comparisonFrom: comparison.fromPeriod,
        comparisonTo: comparison.toPeriod,
        comparisonSummary: JSON.stringify(comparison),
      },
      include: planInclude,
    });
    response.status(201).json({ plan: toDto(plan) });
  } catch (error) {
    next(error);
  }
};

export const updateRtlPlanController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    const planId = request.params.id;
    if (typeof planId !== "string" || !planId) {
      throw new ApiError("ID RTL tidak valid.", 400);
    }
    const existing = await prisma.rtlPlan.findUnique({ where: { id: planId } });
    if (!existing) throw new ApiError("RTL tidak ditemukan.", 404);
    if (!canViewRtlPlan(user, existing.targetScope)) {
      throw new ApiError("RTL ini di luar lingkup kelas binaan Anda.", 403);
    }
    const body = readRecord(request.body);
    const contentKeys = [
      "habitCategory",
      "targetScope",
      "planContent",
      "responsibleRole",
    ];
    const permitted = new Set<string>();
    if (canManageRtlContent(user.role)) contentKeys.forEach((key) => permitted.add(key));
    if (canUpdateRtlStatus(user, existing.responsibleRole)) permitted.add("status");
    const unknownKey = Object.keys(body).find((key) => !permitted.has(key));
    if (unknownKey) {
      throw new ApiError(`Role Anda tidak dapat mengubah field ${unknownKey}.`, 403);
    }
    if (Object.keys(body).length === 0) {
      throw new ApiError("Tidak ada perubahan yang dikirim.", 400);
    }

    const data: Prisma.RtlPlanUpdateInput = {};
    if (contentKeys.some((key) => key in body)) {
      if (!canManageRtlContent(user.role)) {
        throw new ApiError("Role Anda tidak dapat mengubah isi RTL.", 403);
      }
      const habitCategory = readHabit(
        "habitCategory" in body
          ? readText(body, "habitCategory", 80)
          : existing.habitCategory,
      );
      const targetScope = readScope(
        "targetScope" in body
          ? readText(body, "targetScope", 80)
          : existing.targetScope,
      );
      const planContent =
        "planContent" in body
          ? readText(body, "planContent", 4000)
          : existing.planContent;
      const responsibleRole =
        "responsibleRole" in body ? body.responsibleRole : existing.responsibleRole;
      if (!isRtlResponsibleRole(responsibleRole)) {
        throw new ApiError("Peran penanggung jawab RTL tidak valid.", 400);
      }
      Object.assign(data, { habitCategory, targetScope, planContent, responsibleRole });
    }
    if ("status" in body) {
      if (!canUpdateRtlStatus(user, existing.responsibleRole)) {
        throw new ApiError("Role Anda tidak dapat memperbarui status RTL.", 403);
      }
      if (body.status !== "PENDING" && body.status !== "IN_PROGRESS" && body.status !== "COMPLETED") {
        throw new ApiError("Status RTL tidak valid.", 400);
      }
      data.status = body.status;
    }
    const plan = await prisma.rtlPlan.update({
      where: { id: existing.id },
      data,
      include: planInclude,
    });
    response.json({ plan: toDto(plan) });
  } catch (error) {
    next(error);
  }
};

export const deleteRtlPlanController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    if (!canManageRtlContent(user.role)) {
      throw new ApiError("Hanya KEPSEK atau ADMIN yang dapat menghapus RTL.", 403);
    }
    const planId = request.params.id;
    if (typeof planId !== "string" || !planId) {
      throw new ApiError("ID RTL tidak valid.", 400);
    }
    const existing = await prisma.rtlPlan.findUnique({ where: { id: planId } });
    if (!existing) throw new ApiError("RTL tidak ditemukan.", 404);
    await prisma.rtlPlan.delete({ where: { id: existing.id } });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
