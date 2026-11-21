import type { RequestHandler } from "express";
import { ApiError } from "../errors/ApiError.js";
import {
  aggregatePeriodComparison,
  aggregateDashboardSummary,
  parseDashboardFilters,
} from "../services/aggregatorService.js";
import { getSurveyData } from "../services/sheetsService.js";

export const dashboardSummaryController: RequestHandler = async (
  request,
  response,
  next,
) => {
  let filters;
  try {
    filters = parseDashboardFilters(request.query as Record<string, unknown>);
  } catch (error) {
    next(
      new ApiError(
        error instanceof Error ? error.message : "Filter tidak valid.",
        400,
      ),
    );
    return;
  }
  if (request.authUser?.role === "WALI_KELAS") {
    if (!request.authUser.assignedClass) {
      next(new ApiError("Akun wali kelas belum memiliki kelas binaan.", 403));
      return;
    }
    filters = { ...filters, kelas: request.authUser.assignedClass };
  }

  try {
    const { records, dataSource, isStale } = await getSurveyData();
    response.json({
      ...aggregateDashboardSummary(records, filters, dataSource),
      isStale: isStale ?? false,
    });
  } catch (error) {
    next(error);
  }
};

function readPeriod(value: unknown, name: string) {
  if (
    typeof value !== "string" ||
    !/^[1-4]$/.test(value)
  ) {
    throw new ApiError(`Query "${name}" harus bernilai 1, 2, 3, atau 4.`, 400);
  }
  return Number(value) as 1 | 2 | 3 | 4;
}

export const dashboardComparisonController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const fromPeriod = readPeriod(request.query.from, "from");
    const toPeriod = readPeriod(request.query.to, "to");
    if (fromPeriod === toPeriod) {
      throw new ApiError("Pilih dua periode yang berbeda.", 400);
    }

    const parsedFilters = parseDashboardFilters(request.query as Record<string, unknown>);
    let filters = {
      kelas: parsedFilters.kelas,
      jenisKelamin: parsedFilters.jenisKelamin,
    };
    if (request.authUser?.role === "WALI_KELAS") {
      if (!request.authUser.assignedClass) {
        throw new ApiError("Akun wali kelas belum memiliki kelas binaan.", 403);
      }
      filters = { ...filters, kelas: request.authUser.assignedClass };
    }

    const { records, dataSource, isStale } = await getSurveyData();
    if (dataSource !== "google-sheets") {
      throw new ApiError("Komparasi hanya tersedia untuk data Google Sheets.", 503);
    }
    response.json({
      ...aggregatePeriodComparison(
        records,
        filters,
        fromPeriod,
        toPeriod,
        dataSource,
      ),
      isStale: isStale ?? false,
    });
  } catch (error) {
    next(error);
  }
};
