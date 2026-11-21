import type { Role } from "@prisma/client";

export function canManageAnnouncements(role: Role): boolean {
  return (
    role === "KEPSEK" ||
    role === "GURU_BK" ||
    role === "WALI_KELAS" ||
    role === "ADMIN"
  );
}
