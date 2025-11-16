import { Request, Response } from "express";
import searchService from "./search.service";

class SearchController {
    /**
     * GET /api/v1/search?q=query
     * Search for projects and users
     */
    async search(req: Request, res: Response): Promise<void> {
        try {
            const query = req.query.q as string;
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;

            if (!query || query.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: "Search query is required",
                });
                return;
            }

            const results = await searchService.search(query, limit);

            res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error) {
            console.error("Search error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to perform search",
            });
        }
    }
}

export default new SearchController();
