import type { Role } from "@prisma/client";

export const DEMO_PASSWORD = "Demo2026!";

export const DEMO_ACCOUNTS: Array<{
  name: string;
  email: string;
  role: Role;
  assignedClass: string | null;
}> = [
  {
    name: "Kepala Sekolah SMAVO (Demo)",
    email: "kepsek.demo@smavo.sch.id",
    role: "KEPSEK",
    assignedClass: null,
  },
  {
    name: "Guru BK SMAVO (Demo)",
    email: "bk.demo@smavo.sch.id",
    role: "GURU_BK",
    assignedClass: null,
  },
  {
    name: "Wali Kelas X-1 (Demo)",
    email: "wali.x1.demo@smavo.sch.id",
    role: "WALI_KELAS",
    assignedClass: "X-1",
  },
  {
    name: "Administrator SMAVO (Demo)",
    email: "admin.demo@smavo.sch.id",
    role: "ADMIN",
    assignedClass: null,
  },
  {
    name: "Akun Siswa SMAVO (Demo)",
    email: "siswa.demo@smavo.sch.id",
    role: "SISWA",
    assignedClass: null,
  },
];
