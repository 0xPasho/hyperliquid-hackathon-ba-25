import { Router } from "express";
import { healthRoutes } from "../modules/health";
import { projectRoutes } from "../modules/projects";
import { authRoutes } from "../modules/auth";
import { interactionRoutes } from "../modules/interactions";
import { userRoutes } from "../modules/users";
import { searchRoutes } from "../modules/search";
import { roomRoutes } from "../modules/rooms";
import { activityRoutes } from "../modules/activity";
import { testRoutes, blockchainRoutes } from "../modules/blockchain";
import { gameRoutes } from "../modules/game";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/interactions", interactionRoutes);
router.use("/users", userRoutes);
router.use("/search", searchRoutes);
router.use("/rooms", roomRoutes);
router.use("/activity", activityRoutes);
router.use("/game", gameRoutes);
router.use("/test", testRoutes);
router.use("/blockchain", blockchainRoutes);

export default router;
