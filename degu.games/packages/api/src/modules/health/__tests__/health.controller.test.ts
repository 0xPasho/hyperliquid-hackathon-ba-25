import request from "supertest";
import express from "express";
import healthRoutes from "../health.routes";

describe("HealthController", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use("/api/v1/health", healthRoutes);
  });

  describe("GET /api/v1/health", () => {
    it("should return status up", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "up" });
    });
  });
});
