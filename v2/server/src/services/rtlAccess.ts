import type { Role } from "@prisma/client";
import type { AuthUser } from "../types/auth.js";
import { canViewPolicyNote } from "./policyNoteAccess.js";

export function canViewRtlPlan(user: AuthUser, targetScope: string): boolean {
  return canViewPolicyNote(user, targetScope);
}

export function canManageRtlContent(role: Role): boolean {
  return role === "KEPSEK" || role === "ADMIN";
}

export function canUpdateRtlStatus(
  user: AuthUser,
  responsibleRole: Role,
): boolean {
  return (
    user.role === "ADMIN" ||
    user.role === "KEPSEK" ||
    user.role === "GURU_BK" ||
    user.role === responsibleRole
  );
}

export function isRtlResponsibleRole(value: unknown): value is Role {
  return (
    value === "KEPSEK" ||
    value === "GURU_BK" ||
    value === "WALI_KELAS" ||
    value === "ADMIN"
  );
}
