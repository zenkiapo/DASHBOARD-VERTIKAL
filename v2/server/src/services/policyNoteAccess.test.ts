import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canCreatePolicyNote,
  canUpdatePolicyContent,
  canUpdatePolicyFollowUp,
  canViewPolicyNote,
  isValidTargetScope,
} from "./policyNoteAccess.js";
import type { AuthUser } from "../types/auth.js";

const waliX1: AuthUser = {
  id: "wali-x1",
  name: "Wali Kelas X-1",
  email: "wali@example.test",
  role: "WALI_KELAS",
  assignedClass: "X-1",
};

test("wali kelas sees only their class, grade, and school-wide policy notes", () => {
  assert.equal(canViewPolicyNote(waliX1, "X-1"), true);
  assert.equal(canViewPolicyNote(waliX1, "Kelas X"), true);
  assert.equal(canViewPolicyNote(waliX1, "Seluruh Siswa"), true);
  assert.equal(canViewPolicyNote(waliX1, "XI-1"), false);
  assert.equal(canViewPolicyNote({ ...waliX1, assignedClass: null }, "X-1"), false);
});

test("policy write permissions are separated by role", () => {
  assert.equal(canCreatePolicyNote("KEPSEK"), true);
  assert.equal(canCreatePolicyNote("GURU_BK"), true);
  assert.equal(canCreatePolicyNote("WALI_KELAS"), true);
  assert.equal(canCreatePolicyNote("ADMIN"), true);
  assert.equal(canUpdatePolicyContent("KEPSEK"), true);
  assert.equal(canUpdatePolicyContent("GURU_BK"), false);
  assert.equal(canUpdatePolicyFollowUp("GURU_BK"), true);
  assert.equal(canUpdatePolicyFollowUp("WALI_KELAS"), true);
  assert.equal(canUpdatePolicyFollowUp("ADMIN"), true);
});

test("student accounts cannot view or change policy notes", () => {
  const siswa: AuthUser = {
    id: "siswa",
    name: "Akun Siswa",
    email: "siswa@example.test",
    role: "SISWA",
    assignedClass: null,
  };

  assert.equal(canViewPolicyNote(siswa, "Seluruh Siswa"), false);
  assert.equal(canCreatePolicyNote(siswa.role), false);
  assert.equal(canUpdatePolicyContent(siswa.role), false);
  assert.equal(canUpdatePolicyFollowUp(siswa.role), false);
});

test("only supported school-wide, grade, and class scopes are accepted", () => {
  assert.equal(isValidTargetScope("Seluruh Siswa"), true);
  assert.equal(isValidTargetScope("Kelas XII"), true);
  assert.equal(isValidTargetScope("X-1"), true);
  assert.equal(isValidTargetScope("XI-IPA-2"), true);
  assert.equal(isValidTargetScope("Semua orang"), false);
});
