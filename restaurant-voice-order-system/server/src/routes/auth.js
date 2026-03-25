import express from "express";
import rateLimit from "express-rate-limit";

import { getCurrentAdmin, loginAdmin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, loginAdmin);
router.get("/me", requireAuth, getCurrentAdmin);

export default router;
