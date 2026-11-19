import { Router } from "express";
import {
  dashboardComparisonController,
  dashboardSummaryController,
} from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, dashboardSummaryController);
router.get("/comparison", requireAuth, dashboardComparisonController);

export default router;
