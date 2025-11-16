import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rate-limit.middleware";

const router = Router();

// Public routes
// Apply strict rate limiting to login endpoint to prevent brute force attacks
router.post("/login", authRateLimiter, (req, res) => authController.login(req, res));
router.get("/wallet/:address", (req, res) =>
    authController.getUserByWallet(req, res)
);

// Protected routes
router.get("/me", authMiddleware, (req, res) =>
    authController.getCurrentUser(req, res)
);
router.put("/profile", authMiddleware, (req, res) =>
    authController.updateProfile(req, res)
);
router.post("/logout", authMiddleware, (req, res) =>
    authController.logout(req, res)
);

export const authRoutes = router;
