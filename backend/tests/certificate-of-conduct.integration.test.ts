import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();
const validPayload = {
  purpose: "Vorlage beim Arbeitgeber",
  deliveryType: "PRIVATE",
  deliveryRecipient: "Bea Bürger",
  deliveryStreet: "Hauptstraße 1",
  deliveryPostalCode: "14467",
  deliveryCity: "Potsdam",
};

async function createCitizen() {
  const user = await prisma.user.create({
    data: {
      email: `citizen-${crypto.randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
      role: "CITIZEN",
    },
  });
  return {
    user,
    cookie: `${AUTH_COOKIE}=${signToken({ userId: user.id, role: user.role })}`,
  };
}

describe("Führungszeugnis-Endpunkte (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("speichert Zustellart und vollständige Versandanschrift", async () => {
    const { user, cookie } = await createCitizen();
    const response = await request(app)
      .post("/api/applications/certificate-of-conduct")
      .set("Cookie", cookie)
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.application).toMatchObject({
      type: "CERTIFICATE_OF_CONDUCT",
      userId: user.id,
      certificateOfConduct: validPayload,
    });
  });

  it("lehnt eine unvollständige Versandanschrift ab", async () => {
    const { cookie } = await createCitizen();
    const response = await request(app)
      .post("/api/applications/certificate-of-conduct")
      .set("Cookie", cookie)
      .send({ ...validPayload, deliveryPostalCode: "1234" });

    expect(response.status).toBe(400);
    expect(await prisma.application.count()).toBe(0);
  });
});
