import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../errors/ApiError.js";
import { prisma } from "../lib/prisma.js";
import { canManageAnnouncements } from "../services/announcementAccess.js";

const HABITS = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
] as const;

const PRIORITIES = ["LOW", "NORMAL", "HIGH"] as const;
const announcementInclude = {
  author: { select: { name: true, role: true } },
};

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
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(`${field} wajib diisi (maksimal ${maxLength} karakter).`, 400);
  }
  return value.trim();
}

function readHabit(value: unknown): string {
  if (typeof value !== "string" || !HABITS.includes(value as (typeof HABITS)[number])) {
    throw new ApiError("Kategori kebiasaan tidak dikenal.", 400);
  }
  return value;
}

function readTargetScope(value: unknown): string {
  const raw = readText({ targetScope: value }, "targetScope", 80);
  const grade = raw.match(/^Kelas (XII|XI|X)$/i);
  const normalized = grade
    ? `Kelas ${grade[1]!.toUpperCase()}`
    : raw.toUpperCase() === "SELURUH SISWA"
      ? "Seluruh Siswa"
      : raw.toUpperCase();
  if (
    normalized !== "Seluruh Siswa" &&
    !/^Kelas (X|XI|XII)$/.test(normalized) &&
    !/^(X|XI|XII)-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(normalized)
  ) {
    throw new ApiError("Target harus berupa seluruh siswa, jenjang, atau rombel.", 400);
  }
  return normalized;
}

function readPriority(value: unknown): (typeof PRIORITIES)[number] {
  if (typeof value !== "string" || !PRIORITIES.includes(value as (typeof PRIORITIES)[number])) {
    throw new ApiError("Prioritas pengumuman tidak valid.", 400);
  }
  return value as (typeof PRIORITIES)[number];
}

function readEventDate(value: unknown): Date | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError("Tanggal pengumuman harus menggunakan format YYYY-MM-DD.", 400);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError("Tanggal pengumuman tidak valid.", 400);
  }
  return date;
}

function readFields(body: Record<string, unknown>) {
  return {
    title: readText(body, "title", 120),
    habitCategory: readHabit(body.habitCategory),
    targetScope: readTargetScope(body.targetScope),
    priority: readPriority(body.priority),
    content: readText(body, "content", 3000),
    eventDate: readEventDate(body.eventDate),
  };
}

function rejectUnknownFields(body: Record<string, unknown>): void {
  const allowed = new Set([
    "title",
    "habitCategory",
    "targetScope",
    "priority",
    "content",
    "eventDate",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    throw new ApiError("Body memuat field yang tidak didukung.", 400);
  }
}

function requireManager(request: Parameters<RequestHandler>[0]) {
  const user = request.authUser;
  if (!user) throw new ApiError("Autentikasi diperlukan.", 401);
  if (!canManageAnnouncements(user.role)) {
    throw new ApiError("Role tidak memiliki izin mengelola pengumuman.", 403);
  }
  return user;
}

export const getAnnouncementsController: RequestHandler = async (_request, response, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: announcementInclude,
      orderBy: [{ createdAt: "desc" }],
    });
    response.json({ announcements });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncementController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireManager(request);
    const body = readRecord(request.body);
    rejectUnknownFields(body);
    const announcement = await prisma.announcement.create({
      data: { ...readFields(body), authorId: user.id },
      include: announcementInclude,
    });
    response.status(201).json({ announcement });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncementController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    requireManager(request);
    const id = request.params.id;
    if (typeof id !== "string" || !id) {
      throw new ApiError("ID pengumuman tidak valid.", 400);
    }
    const body = readRecord(request.body);
    rejectUnknownFields(body);
    if (Object.keys(body).length === 0) {
      throw new ApiError("Tidak ada perubahan yang dikirim.", 400);
    }
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Pengumuman tidak ditemukan.", 404);
    const merged = {
      title: "title" in body ? body.title : existing.title,
      habitCategory: "habitCategory" in body ? body.habitCategory : existing.habitCategory,
      targetScope: "targetScope" in body ? body.targetScope : existing.targetScope,
      priority: "priority" in body ? body.priority : existing.priority,
      content: "content" in body ? body.content : existing.content,
      eventDate: "eventDate" in body ? body.eventDate : existing.eventDate?.toISOString().slice(0, 10) ?? null,
    };
    const announcement = await prisma.announcement.update({
      where: { id },
      data: readFields(merged),
      include: announcementInclude,
    });
    response.json({ announcement });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncementController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    requireManager(request);
    const id = request.params.id;
    if (typeof id !== "string" || !id) {
      throw new ApiError("ID pengumuman tidak valid.", 400);
    }
    try {
      await prisma.announcement.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError("Pengumuman tidak ditemukan.", 404);
      }
      throw error;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
