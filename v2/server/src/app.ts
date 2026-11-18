import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "./errors/ApiError.js";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import policyNotesRouter from "./routes/policyNotes.js";
import {
  SurveyConfigError,
  SurveyDataError,
} from "./services/sheetsService.js";
import { getAllowedOrigins } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { getRedisClient } from "./lib/redis.js";

const app = express();

app.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  const origin = request.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = !origin || allowedOrigins.has(origin);

  response.vary("Origin");
  if (origin && isAllowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader(
      "Access-Control-Allow-Methods",
      "GET, HEAD, POST, PATCH, DELETE, OPTIONS",
    );
    response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
    response.setHeader("Access-Control-Max-Age", "600");
  }

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      response.status(403).json({ error: "Origin tidak diizinkan." });
      return;
    }
    response.status(204).end();
    return;
  }

  if (!isAllowedOrigin) {
    response.status(403).json({ error: "Origin tidak diizinkan." });
    return;
  }

  const fetchSite = request.get("sec-fetch-site");
  const isReadOnly = ["GET", "HEAD"].includes(request.method);
  if (!isReadOnly && !origin && fetchSite === "cross-site") {
    response.status(403).json({ error: "Asal permintaan tidak diizinkan." });
    return;
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
app.get("/health", async (_request, response) => {
  const [database, redis] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    getRedisClient().ping(),
  ]);
  const checks = {
    database: database.status === "fulfilled" ? "ok" : "error",
    redis: redis.status === "fulfilled" ? "ok" : "error",
  };
  const healthy = Object.values(checks).every((check) => check === "ok");
  response.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks,
  });
});
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/policy-notes", policyNotesRouter);

const errorHandler: ErrorRequestHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next,
) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof SurveyConfigError) {
    console.error(`[survey-config] ${error.message}`);
    response.status(503).json({ error: error.message });
    return;
  }
  if (error instanceof SurveyDataError) {
    console.error(`[survey-data] ${error.message}`);
    response.status(502).json({ error: "Data survei tidak dapat dimuat." });
    return;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    response.status(409).json({ error: "Data dengan nilai tersebut sudah ada." });
    return;
  }
  console.error("[api] Unexpected request error", error);
  response.status(500).json({ error: "Terjadi kesalahan pada server." });
};

app.use(errorHandler);

export default app;
