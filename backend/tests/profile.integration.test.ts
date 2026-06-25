import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";

const app = createApp();

async function createUser(role: "CITIZEN" | "CASEWORKER" = "CITIZEN") {
  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}-${crypto.randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
      role,
    },
  });
  const token = signToken({ userId: user.id, role: user.role });
  return { user, cookie: `${AUTH_COOKIE}=${token}` };
}

describe("PATCH /api/profile (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("verlangt eine Anmeldung", async () => {
    const res = await request(app).patch("/api/profile").send({ city: "Berlin" });
    expect(res.status).toBe(401);
  });

  it("speichert eine Teilaktualisierung", async () => {
    const { user, cookie } = await createUser();
    const res = await request(app)
      .patch("/api/profile")
      .set("Cookie", cookie)
      .send({ city: "Potsdam", postalCode: "14467" });
    expect(res.status).toBe(200);
    expect(res.body.user.city).toBe("Potsdam");
    expect(res.body.user.postalCode).toBe("14467");
    const inDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(inDb?.city).toBe("Potsdam");
  });

  it("lehnt ungültige Daten mit 400 ab", async () => {
    const { cookie } = await createUser();
    const res = await request(app)
      .patch("/api/profile")
      .set("Cookie", cookie)
      .send({ postalCode: "12" });
    expect(res.status).toBe(400);
  });

  it("aktualisiert keine fremden Profile", async () => {
    const a = await createUser();
    const b = await createUser();
    await request(app)
      .patch("/api/profile")
      .set("Cookie", b.cookie)
      .send({ city: "Potsdam" });
    const inDb = await prisma.user.findUnique({ where: { id: a.user.id } });
    expect(inDb?.city).toBeNull();
  });

  it("gibt die aktualisierten Profilfelder auch über /api/auth/me zurück", async () => {
    const { cookie } = await createUser();
    await request(app)
      .patch("/api/profile")
      .set("Cookie", cookie)
      .send({ firstName: "Leon", birthPlace: "Berlin" });
    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.firstName).toBe("Leon");
    expect(me.body.user.birthPlace).toBe("Berlin");
  });
});
