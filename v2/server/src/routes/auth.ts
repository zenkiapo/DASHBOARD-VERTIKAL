import { Router } from "express";
import {
  currentUserController,
  demoLoginController,
  loginController,
  logoutController,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", loginController);
router.post("/demo-login", demoLoginController);
router.get("/me", requireAuth, currentUserController);
router.post("/logout", logoutController);

export default router;
