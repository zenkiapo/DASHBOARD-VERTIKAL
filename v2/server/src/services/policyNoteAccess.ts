import type { NoteStatus, Role } from "@prisma/client";
import type { AuthUser } from "../types/auth.js";

export const POLICY_HABITS = [
  "Semua",
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat dan Bergizi",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Cepat",
] as const;

export const NOTE_STATUSES: NoteStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

const scopeGrade = (scope: string): string | null => {
  const match = scope.trim().toUpperCase().match(/^(XII|XI|X)(?=$|[\s/-])/);
  return match?.[1] ?? null;
};

export function canViewPolicyNote(user: AuthUser, targetScope: string): boolean {
  if (user.role === "SISWA") return false;
  if (user.role !== "WALI_KELAS") return true;
  if (!user.assignedClass) return false;
  if (targetScope === "Seluruh Siswa" || targetScope === user.assignedClass) {
    return true;
  }
  const assignedGrade = scopeGrade(user.assignedClass);
  return assignedGrade !== null && targetScope === `Kelas ${assignedGrade}`;
}

export function canCreatePolicyNote(role: Role): boolean {
  return role === "KEPSEK" || role === "ADMIN";
}

export function canUpdatePolicyContent(role: Role): boolean {
  return role === "KEPSEK" || role === "ADMIN";
}

export function canUpdatePolicyFollowUp(role: Role): boolean {
  return role === "GURU_BK" || role === "ADMIN";
}

export function isValidTargetScope(value: string): boolean {
  return (
    value === "Seluruh Siswa" ||
    /^Kelas (X|XI|XII)$/.test(value) ||
    /^(X|XI|XII)-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(value)
  );
}

export function isNoteStatus(value: unknown): value is NoteStatus {
  return typeof value === "string" && NOTE_STATUSES.includes(value as NoteStatus);
}
