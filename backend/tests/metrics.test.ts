import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { metricsRegistry } from "../src/lib/metrics.js";

const app = createApp();

describe("Prometheus-Metriken", () => {
  beforeEach(() => metricsRegistry.resetMetrics());

  it("liefert Prometheus-Metriken mit korrektem Content-Type", async () => {
    await request(app).get("/api/health");
    const res = await request(app).get("/metrics");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("digitale_behoerde_http_requests_total");
    expect(res.text).toContain('method="GET",route="/api/health",status_code="200"');
    expect(res.text).toContain("digitale_behoerde_http_request_duration_seconds_bucket");
    expect(res.text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}/i);
  });

  it("normalisiert IDs in Pfaden", async () => {
    await request(app).get(`/api/applications/${crypto.randomUUID()}/documents/${crypto.randomUUID()}`);
    const res = await request(app).get("/metrics");

    expect(res.text).toContain('route="/api/applications/:id/documents/:id"');
  });
});
