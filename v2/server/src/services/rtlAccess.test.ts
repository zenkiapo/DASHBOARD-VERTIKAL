import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canManageRtlContent,
  canUpdateRtlStatus,
  canViewRtlPlan,
  isRtlResponsibleRole,
} from "./rtlAccess.js";
import type { AuthUser } from "../types/auth.js";

const user = (role: AuthUser["role"], assignedClass: string | null = null): AuthUser => ({
  id: role,
  name: role,
  email: `${role.toLowerCase()}@example.test`,
  role,
  assignedClass,
});

test("wali kelas can only view RTL plans in their own class scope", () => {
  const wali = user("WALI_KELAS", "X-1");
  assert.equal(canViewRtlPlan(wali, "X-1"), true);
  assert.equal(canViewRtlPlan(wali, "Kelas X"), true);
  assert.equal(canViewRtlPlan(wali, "Seluruh Siswa"), true);
  assert.equal(canViewRtlPlan(wali, "XI-1"), false);
});

test("RTL content and status updates use server-side role checks", () => {
  assert.equal(canManageRtlContent("KEPSEK"), true);
  assert.equal(canManageRtlContent("ADMIN"), true);
  assert.equal(canManageRtlContent("GURU_BK"), false);
  assert.equal(canUpdateRtlStatus(user("WALI_KELAS", "X-1"), "WALI_KELAS"), true);
  assert.equal(canUpdateRtlStatus(user("WALI_KELAS", "X-1"), "GURU_BK"), false);
  assert.equal(canUpdateRtlStatus(user("GURU_BK"), "WALI_KELAS"), true);
  assert.equal(canUpdateRtlStatus(user("SISWA"), "WALI_KELAS"), false);
});

test("student accounts cannot be assigned RTL responsibility", () => {
  assert.equal(isRtlResponsibleRole("SISWA"), false);
  assert.equal(isRtlResponsibleRole("WALI_KELAS"), true);
});
