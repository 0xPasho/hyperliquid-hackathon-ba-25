import { Request, Response } from "express";
import HealthService from "./health.service";

const healthService = HealthService.getInstance();

/**
 * Health controller for handling health check endpoints
 */
export class HealthController {
  /**
   * GET /api/v1/health
   * Basic health check endpoint
   */
  public static getHealth = (_: Request, res: Response) => {
    try {
      const healthStatus = healthService.getHealthStatus();
      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
