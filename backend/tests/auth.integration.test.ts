import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
const app = createApp();
async function resetDb() {
  await prisma.user.deleteMany();
}
describe("Auth-Endpunkte (Integration)", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());
  it("registriert einen neuen Nutzer und speichert ihn in der DB", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "neu@example.com", password: "geheim12" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("neu@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
    const inDb = await prisma.user.findUnique({ where: { email: "neu@example.com" } });
    expect(inDb).not.toBeNull();
    expect(inDb?.passwordHash).not.toBe("geheim12"); // ist gehasht
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("token=") && c.includes("HttpOnly"))).toBe(true);
  });
  it("lehnt eine doppelte E-Mail-Adresse ab", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "geheim12" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "geheim12" });
    expect(res.status).toBe(409);
  });
  it("lehnt Login mit falschem Passwort ab", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "login@example.com", password: "geheim12" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "falsch99" });

    expect(res.status).toBe(401);
  });
  it("erlaubt Login mit korrekten Daten und liefert Nutzerdaten ueber /me", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "ok@example.com", password: "geheim12" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "ok@example.com", password: "geheim12" });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers["set-cookie"] as unknown as string[];
    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("ok@example.com");
  });
  it("ohne Cookie liefert /me 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});