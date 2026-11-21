import type { RequestHandler } from "express";
import { NoteStatus, Prisma } from "@prisma/client";
import { ApiError } from "../errors/ApiError.js";
import { prisma } from "../lib/prisma.js";
import {
  canCreatePolicyNote,
  canUpdatePolicyContent,
  canUpdatePolicyFollowUp,
  canViewPolicyNote,
  isNoteStatus,
  isValidTargetScope,
  POLICY_HABITS,
} from "../services/policyNoteAccess.js";

const noteInclude = {
  author: {
    select: {
      name: true,
      role: true,
    },
  },
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
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new ApiError(`${field} wajib diisi (maksimal ${maxLength} karakter).`, 400);
  }
  return value.trim();
}

function readNoteContentFields(body: Record<string, unknown>) {
  const habitCategory = readText(body, "habitCategory", 80);
  const rawTargetScope = readText(body, "targetScope", 80);
  const noteContent = readText(body, "noteContent", 2000);
  const gradeScope = rawTargetScope.match(/^Kelas (XII|XI|X)$/i);
  const targetScope = gradeScope
    ? `Kelas ${gradeScope[1]!.toUpperCase()}`
    : rawTargetScope.toUpperCase() === "SELURUH SISWA"
      ? "Seluruh Siswa"
      : rawTargetScope.toUpperCase();

  if (!POLICY_HABITS.includes(habitCategory as (typeof POLICY_HABITS)[number])) {
    throw new ApiError("Kategori kebiasaan tidak dikenal.", 400);
  }
  if (!isValidTargetScope(targetScope)) {
    throw new ApiError("Target harus berupa seluruh siswa, jenjang, atau rombel.", 400);
  }
  return { habitCategory, targetScope, noteContent };
}

export const getPolicyNotesController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    if (user.role === "WALI_KELAS" && !user.assignedClass) {
      throw new ApiError("Akun wali kelas belum memiliki kelas binaan.", 403);
    }
    const notes = await prisma.policyNote.findMany({
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
      include: noteInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    response.json({
      notes: notes.filter((note) => canViewPolicyNote(user, note.targetScope)),
    });
  } catch (error) {
    next(error);
  }
};

export const createPolicyNoteController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    if (!canCreatePolicyNote(user.role)) {
      throw new ApiError("Role Anda tidak memiliki izin untuk membuat catatan.", 403);
    }
    const body = readRecord(request.body);
    const allowedCreateKeys = new Set([
      "habitCategory",
      "targetScope",
      "noteContent",
    ]);
    const unknownKey = Object.keys(body).find((key) => !allowedCreateKeys.has(key));
    if (unknownKey) {
      throw new ApiError(`Field ${unknownKey} tidak didukung.`, 400);
    }
    const fields = readNoteContentFields(body);
    if (!canViewPolicyNote(user, fields.targetScope)) {
      throw new ApiError("Target catatan di luar lingkup kelas binaan Anda.", 403);
    }
    const note = await prisma.policyNote.create({
      data: { ...fields, authorId: user.id, status: NoteStatus.PENDING },
      include: noteInclude,
    });
    response.status(201).json({ note });
  } catch (error) {
    next(error);
  }
};

export const updatePolicyNoteController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    const noteId = request.params.id;
    if (typeof noteId !== "string" || !noteId) {
      throw new ApiError("ID catatan tidak valid.", 400);
    }
    const existing = await prisma.policyNote.findUnique({
      where: { id: noteId },
    });
    if (!existing) throw new ApiError("Catatan tidak ditemukan.", 404);
    if (!canViewPolicyNote(user, existing.targetScope)) {
      throw new ApiError("Catatan ini di luar lingkup kelas binaan Anda.", 403);
    }

    const body = readRecord(request.body);
    const contentKeys = ["habitCategory", "targetScope", "noteContent"];
    const followUpKeys = ["status", "followUpNote"];
    const permittedKeys = new Set<string>();
    if (canUpdatePolicyContent(user.role)) {
      contentKeys.forEach((key) => permittedKeys.add(key));
    }
    if (canUpdatePolicyFollowUp(user.role)) {
      followUpKeys.forEach((key) => permittedKeys.add(key));
    }
    const unknownKey = Object.keys(body).find((key) => !permittedKeys.has(key));
    if (unknownKey) {
      throw new ApiError(`Role Anda tidak dapat mengubah field ${unknownKey}.`, 403);
    }
    if (Object.keys(body).length === 0) {
      throw new ApiError("Tidak ada perubahan yang dikirim.", 400);
    }

    const data: Prisma.PolicyNoteUpdateInput = {};
    if (contentKeys.some((key) => key in body)) {
      if (!canUpdatePolicyContent(user.role)) {
        throw new ApiError("Role Anda tidak dapat mengubah isi kebijakan.", 403);
      }
      const merged = readNoteContentFields({
        habitCategory:
          "habitCategory" in body ? body.habitCategory : existing.habitCategory,
        targetScope: "targetScope" in body ? body.targetScope : existing.targetScope,
        noteContent: "noteContent" in body ? body.noteContent : existing.noteContent,
      });
      Object.assign(data, merged);
    }
    if ("status" in body) {
      if (!isNoteStatus(body.status)) {
        throw new ApiError("Status catatan tidak valid.", 400);
      }
      data.status = body.status;
    }
    if ("followUpNote" in body) {
      const value = body.followUpNote;
      if (value !== null && (typeof value !== "string" || value.trim().length > 2000)) {
        throw new ApiError("Catatan pendampingan maksimal 2000 karakter.", 400);
      }
      data.followUpNote = typeof value === "string" ? value.trim() || null : null;
    }

    const note = await prisma.policyNote.update({
      where: { id: existing.id },
      data,
      include: noteInclude,
    });
    response.json({ note });
  } catch (error) {
    next(error);
  }
};

export const deletePolicyNoteController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const user = requireUser(request);
    const noteId = request.params.id;
    if (typeof noteId !== "string" || !noteId) {
      throw new ApiError("ID catatan tidak valid.", 400);
    }
    const existing = await prisma.policyNote.findUnique({ where: { id: noteId } });
    if (!existing) throw new ApiError("Catatan tidak ditemukan.", 404);
    if (!canViewPolicyNote(user, existing.targetScope)) {
      throw new ApiError("Catatan ini di luar lingkup kelas binaan Anda.", 403);
    }
    await prisma.policyNote.delete({ where: { id: existing.id } });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
