import { Router } from "express";
import { dashboardSummaryController } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, dashboardSummaryController);

export default router;
