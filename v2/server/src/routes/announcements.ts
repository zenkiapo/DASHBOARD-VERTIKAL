import { Router } from "express";
import {
  createAnnouncementController,
  deleteAnnouncementController,
  getAnnouncementsController,
  updateAnnouncementController,
} from "../controllers/announcementsController.js";
import { authorizeRoles, requireAuth } from "../middleware/auth.js";

const router = Router();
const announcementManagers = ["KEPSEK", "GURU_BK", "WALI_KELAS", "ADMIN"] as const;

router.get("/", getAnnouncementsController);
router.post(
  "/",
  requireAuth,
  authorizeRoles(...announcementManagers),
  createAnnouncementController,
);
router.patch(
  "/:id",
  requireAuth,
  authorizeRoles(...announcementManagers),
  updateAnnouncementController,
);
router.delete(
  "/:id",
  requireAuth,
  authorizeRoles(...announcementManagers),
  deleteAnnouncementController,
);

export default router;
