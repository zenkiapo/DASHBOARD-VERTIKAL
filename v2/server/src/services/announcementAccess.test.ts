import assert from "node:assert/strict";
import { test } from "node:test";
import { canManageAnnouncements } from "./announcementAccess.js";

test("only announcement manager roles can perform create, update, and delete", () => {
  assert.equal(canManageAnnouncements("KEPSEK"), true);
  assert.equal(canManageAnnouncements("GURU_BK"), true);
  assert.equal(canManageAnnouncements("WALI_KELAS"), true);
  assert.equal(canManageAnnouncements("ADMIN"), true);
  assert.equal(canManageAnnouncements("SISWA"), false);
});
