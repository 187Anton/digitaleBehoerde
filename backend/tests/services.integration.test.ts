import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
const app = createApp();
describe("GET /api/services (Antragskatalog)", () => {
  it("liefert drei Vorgaenge", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    expect(res.body.services).toHaveLength(3);
  });
  it("enthaelt alle drei MVP-Vorgaenge", async () => {
    const res = await request(app).get("/api/services");
    const types = res.body.services.map((s: { type: string }) => s.type);
    expect(types).toContain("RESIDENCE_CHANGE");
    expect(types).toContain("DOG_TAX");
    expect(types).toContain("CERTIFICATE_OF_CONDUCT");
  });
  it("markiert Wohnsitz und Hundesteuer als verfügbar, Führungszeugnis nicht", async () => {
    const res = await request(app).get("/api/services");
    const byType = (t: string) =>
      res.body.services.find((s: { type: string }) => s.type === t);
    expect(byType("RESIDENCE_CHANGE").available).toBe(true);
    expect(byType("DOG_TAX").available).toBe(true);
    expect(byType("CERTIFICATE_OF_CONDUCT").available).toBe(false);
  });
  it("ist ohne Anmeldung erreichbar", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
  });
});
