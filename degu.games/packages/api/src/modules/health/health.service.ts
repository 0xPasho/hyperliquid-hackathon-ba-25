/**
 * Simple health service that returns basic status
 */

export interface HealthStatus {
  status: "up";
}

class HealthService {
  private static instance: HealthService;

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Get basic health status
   */
  public getHealthStatus(): HealthStatus {
    return {
      status: "up",
    };
  }
}

export default HealthService;
