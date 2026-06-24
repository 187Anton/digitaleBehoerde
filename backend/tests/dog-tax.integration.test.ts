import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";

const app = createApp();

const validPayload = {
  dogName: "Bello",
  dogBreed: "Labrador",
  ownerStreet: "Hauptstraße 1",
  ownerPostalCode: "14467",
  ownerCity: "Potsdam",
  taxStartDate: "2026-07-01",
};

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

describe("POST /api/applications/dog-tax (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("verlangt eine Anmeldung", async () => {
    const res = await request(app)
      .post("/api/applications/dog-tax")
      .send(validPayload);
    expect(res.status).toBe(401);
  });

  it("verweigert Sachbearbeitern das Anlegen", async () => {
    const { cookie } = await createUser("CASEWORKER");
    const res = await request(app)
      .post("/api/applications/dog-tax")
      .set("Cookie", cookie)
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it("lehnt ungültige Daten mit 400 ab", async () => {
    const { cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/dog-tax")
      .set("Cookie", cookie)
      .send({ ...validPayload, ownerPostalCode: "12" });
    expect(res.status).toBe(400);
  });

  it("legt einen Hundesteuer-Antrag mit Status SUBMITTED an", async () => {
    const { user, cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/dog-tax")
      .set("Cookie", cookie)
      .send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      type: "DOG_TAX",
      status: "SUBMITTED",
      userId: user.id,
      dogTax: {
        dogName: "Bello",
        ownerCity: "Potsdam",
      },
    });
    const inDb = await prisma.application.findMany({ include: { dogTax: true } });
    expect(inDb).toHaveLength(1);
    expect(inDb[0].dogTax?.dogName).toBe("Bello");
  });

  it("liefert Hundesteuer-Anträge über GET zurück, fremde nicht", async () => {
    const { cookie: cookieA } = await createUser();
    const { cookie: cookieB } = await createUser();
    await request(app)
      .post("/api/applications/dog-tax")
      .set("Cookie", cookieA)
      .send(validPayload);
    const listA = await request(app).get("/api/applications").set("Cookie", cookieA);
    const listB = await request(app).get("/api/applications").set("Cookie", cookieB);
    expect(listA.body.applications).toHaveLength(1);
    expect(listA.body.applications[0].dogTax.dogName).toBe("Bello");
    expect(listB.body.applications).toHaveLength(0);
  });
});
