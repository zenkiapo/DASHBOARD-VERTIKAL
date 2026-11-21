import { Router } from "express";
import {
  createPolicyNoteController,
  deletePolicyNoteController,
  getPolicyNotesController,
  updatePolicyNoteController,
} from "../controllers/policyNotesController.js";
import { authorizeRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get(
  "/",
  authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"),
  getPolicyNotesController,
);
router.post(
  "/",
  authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"),
  createPolicyNoteController,
);
router.patch(
  "/:id",
  authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"),
  updatePolicyNoteController,
);
router.delete(
  "/:id",
  authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"),
  deletePolicyNoteController,
);

export default router;
