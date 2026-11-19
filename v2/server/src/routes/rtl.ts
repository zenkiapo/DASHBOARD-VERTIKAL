import { Router } from "express";
import {
  createRtlPlanController,
  deleteRtlPlanController,
  getRtlPlansController,
  updateRtlPlanController,
} from "../controllers/rtlController.js";
import { authorizeRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"), getRtlPlansController);
router.post("/", authorizeRoles("KEPSEK", "ADMIN"), createRtlPlanController);
router.patch("/:id", authorizeRoles("KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"), updateRtlPlanController);
router.delete("/:id", authorizeRoles("KEPSEK", "ADMIN"), deleteRtlPlanController);

export default router;
