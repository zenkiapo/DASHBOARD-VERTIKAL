import type { RequestHandler } from "express";
import { ApiError } from "../errors/ApiError.js";
import {
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
