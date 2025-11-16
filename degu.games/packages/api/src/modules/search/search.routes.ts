import { Router } from "express";
import searchController from "./search.controller";

const router = Router();

// Search for projects and users
router.get("/", searchController.search.bind(searchController));

export default router;
