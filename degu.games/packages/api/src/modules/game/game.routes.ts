import { Router } from "express";
import gameController from "./game.controller";

const router = Router();

// Report game result (called by VM server)
router.post("/result", gameController.reportGameResult.bind(gameController));

export default router;
