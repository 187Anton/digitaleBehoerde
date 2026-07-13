import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import "express-async-errors";
import { errorHandler } from "../src/app.js";

describe("Zentrale Fehlerbehandlung (Integration)", () => {
  it("liefert 500 mit generischer Fehlermeldung, wenn eine async-Route rejected", async () => {
    const app = express();
    app.get("/api/failing", async () => {
      throw new Error("boom mit sensiblen Details");
    });
    app.use(errorHandler);

    const res = await request(app).get("/api/failing");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Interner Serverfehler." });
    expect(JSON.stringify(res.body)).not.toContain("boom");
    expect(JSON.stringify(res.body)).not.toContain("sensiblen");
  });
});
