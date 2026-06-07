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
  it("markiert nur Wohnsitzummeldung als verfuegbar", async () => {
    const res = await request(app).get("/api/services");
    const residence = res.body.services.find(
      (s: { type: string }) => s.type === "RESIDENCE_CHANGE"
    );
    expect(residence.available).toBe(true);
    const others = res.body.services.filter(
      (s: { type: string }) => s.type !== "RESIDENCE_CHANGE"
    );
    expect(others.every((s: { available: boolean }) => !s.available)).toBe(true);
  });
  it("ist ohne Anmeldung erreichbar", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
  });
});