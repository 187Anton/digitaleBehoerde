import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

async function createUser(role: "CITIZEN" | "CASEWORKER") {
  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}-${crypto.randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
      role,
      firstName: role === "CITIZEN" ? "Bea" : "Sven",
      lastName: role === "CITIZEN" ? "Buerger" : "Sachbearbeiter",
    },
  });
  return {
    user,
    cookie: `${AUTH_COOKIE}=${signToken({ userId: user.id, role: user.role })}`,
  };
}

async function createApplication(userId: string) {
  return prisma.application.create({
    data: {
      type: "RESIDENCE_CHANGE",
      userId,
      residenceChange: {
        create: {
          moveDate: new Date("2026-07-01T00:00:00.000Z"),
          oldStreet: "Alte Strasse 1",
          oldPostalCode: "14467",
          oldCity: "Potsdam",
          newStreet: "Neue Strasse 2",
          newPostalCode: "10115",
          newCity: "Berlin",
          householdSize: 2,
        },
      },
    },
  });
}

describe("Sachbearbeiter-Endpunkte (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("liefert Sachbearbeitern alle Antraege mit Buergerdaten", async () => {
    const citizen = await createUser("CITIZEN");
    const caseworker = await createUser("CASEWORKER");
    await createApplication(citizen.user.id);

    const res = await request(app)
      .get("/api/caseworker/applications")
      .set("Cookie", caseworker.cookie);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0]).toMatchObject({
      status: "SUBMITTED",
      user: { email: citizen.user.email, firstName: "Bea", lastName: "Buerger" },
      residenceChange: { newCity: "Berlin" },
      documents: [],
    });
  });

  it("verweigert Buergern den Zugriff", async () => {
    const citizen = await createUser("CITIZEN");
    const res = await request(app)
      .get("/api/caseworker/applications")
      .set("Cookie", citizen.cookie);
    expect(res.status).toBe(403);
  });

  it("verlangt eine Anmeldung", async () => {
    const res = await request(app).get("/api/caseworker/applications");
    expect(res.status).toBe(401);
  });

  it("erlaubt den vollstaendigen Statusablauf", async () => {
    const citizen = await createUser("CITIZEN");
    const caseworker = await createUser("CASEWORKER");
    const application = await createApplication(citizen.user.id);

    const review = await request(app)
      .patch(`/api/caseworker/applications/${application.id}/status`)
      .set("Cookie", caseworker.cookie)
      .send({ status: "IN_REVIEW" });
    expect(review.status).toBe(200);
    expect(review.body.application.status).toBe("IN_REVIEW");

    const approve = await request(app)
      .patch(`/api/caseworker/applications/${application.id}/status`)
      .set("Cookie", caseworker.cookie)
      .send({ status: "APPROVED" });
    expect(approve.status).toBe(200);
    expect(approve.body.application.status).toBe("APPROVED");
  });

  it("lehnt ungueltige Statusspruenge ab", async () => {
    const citizen = await createUser("CITIZEN");
    const caseworker = await createUser("CASEWORKER");
    const application = await createApplication(citizen.user.id);

    const res = await request(app)
      .patch(`/api/caseworker/applications/${application.id}/status`)
      .set("Cookie", caseworker.cookie)
      .send({ status: "APPROVED" });
    expect(res.status).toBe(409);
    expect((await prisma.application.findUnique({ where: { id: application.id } }))?.status)
      .toBe("SUBMITTED");
  });

  it("liefert fuer unbekannte Antraege 404", async () => {
    const caseworker = await createUser("CASEWORKER");
    const res = await request(app)
      .get(`/api/caseworker/applications/${crypto.randomUUID()}`)
      .set("Cookie", caseworker.cookie);
    expect(res.status).toBe(404);
  });
});
