import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildContainer } from "../src/container.js";
import { createApp } from "../src/app.js";

describe("API Smoke Tests", () => {
  let app;

  beforeAll(() => {
    const container = buildContainer();
    app = createApp(container);
  });

  it("GET /health should return 200 or 503 structured envelope with requestId", async () => {
    const res = await request(app).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("requestId");
  });

  it("GET /api/unknown-route should return 404 with structured error envelope", async () => {
    const res = await request(app).get("/api/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty("code", "NOT_FOUND");
    expect(res.body).toHaveProperty("requestId");
  });

  it("POST /api/auth/login without body should return 422 validation error", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty("code", "VALIDATION_ERROR");
  });
});
