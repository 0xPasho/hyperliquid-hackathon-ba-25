import HealthService from "../health.service";

describe("HealthService", () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = HealthService.getInstance();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = HealthService.getInstance();
      const instance2 = HealthService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("getHealthStatus", () => {
    it("should return status up", () => {
      const result = healthService.getHealthStatus();

      expect(result).toEqual({ status: "up" });
    });
  });
});
