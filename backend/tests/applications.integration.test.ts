import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";

const app = createApp();
const validPayload = {
  moveDate: "2026-07-01",
  oldStreet: "Alte Strasse 1",
  oldPostalCode: "14467",
  oldCity: "Potsdam",
  newStreet: "Neue Strasse 2",
  newPostalCode: "10115",
  newCity: "Berlin",
  householdSize: 2,
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

describe("Antrags-Endpunkte (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("legt eine Wohnsitzummeldung mit Status SUBMITTED an", async () => {
    const { user, cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      type: "RESIDENCE_CHANGE",
      status: "SUBMITTED",
      userId: user.id,
      residenceChange: {
        newPostalCode: "10115",
        householdSize: 2,
      },
    });
    expect(await prisma.application.count()).toBe(1);
  });

  it("lehnt unvollstaendige Meldedaten ab", async () => {
    const { cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send({ ...validPayload, newCity: "" });

    expect(res.status).toBe(400);
    expect(await prisma.application.count()).toBe(0);
  });

  it("verlangt eine Anmeldung", async () => {
    const res = await request(app).post("/api/applications/residence-change").send(validPayload);
    expect(res.status).toBe(401);
  });

  it("erlaubt Sachbearbeitern keine Antragstellung", async () => {
    const { cookie } = await createUser("CASEWORKER");
    const res = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it("liefert nur die Antraege des angemeldeten Buergers", async () => {
    const first = await createUser();
    const second = await createUser();
    await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", first.cookie)
      .send(validPayload);
    await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", second.cookie)
      .send({ ...validPayload, newCity: "Hamburg" });

    const res = await request(app).get("/api/applications").set("Cookie", first.cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].userId).toBe(first.user.id);
    expect(res.body.applications[0].residenceChange.newCity).toBe("Berlin");
  });
});
