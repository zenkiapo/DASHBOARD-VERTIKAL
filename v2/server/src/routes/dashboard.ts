import { Router } from "express";
import { dashboardSummaryController } from "../controllers/dashboardController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", optionalAuth, dashboardSummaryController);

export default router;
