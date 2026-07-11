import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { metricsRegistry } from "../src/lib/metrics.js";

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
    metricsRegistry.resetMetrics();
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

  it("erlaubt Sachbearbeitern Kommentare, die Bürger lesen können", async () => {
    const citizen = await createUser("CITIZEN");
    const caseworker = await createUser("CASEWORKER");
    const application = await createApplication(citizen.user.id);

    const created = await request(app)
      .post(`/api/caseworker/applications/${application.id}/comments`)
      .set("Cookie", caseworker.cookie)
      .send({ body: "  Bitte reichen Sie die Rückseite nach.  " });

    expect(created.status).toBe(201);
    expect(created.body.comment).toMatchObject({
      applicationId: application.id,
      authorId: caseworker.user.id,
      body: "Bitte reichen Sie die Rückseite nach.",
      author: { id: caseworker.user.id, role: "CASEWORKER" },
    });

    const citizenView = await request(app)
      .get("/api/applications")
      .set("Cookie", citizen.cookie);
    expect(citizenView.status).toBe(200);
    expect(citizenView.body.applications[0].comments).toHaveLength(1);
    expect(citizenView.body.applications[0].comments[0].body).toBe(
      "Bitte reichen Sie die Rückseite nach."
    );
  });

  it("verweigert Bürgern das Schreiben von Kommentaren", async () => {
    const citizen = await createUser("CITIZEN");
    const application = await createApplication(citizen.user.id);

    const response = await request(app)
      .post(`/api/caseworker/applications/${application.id}/comments`)
      .set("Cookie", citizen.cookie)
      .send({ body: "Dieser Kommentar ist nicht erlaubt." });

    expect(response.status).toBe(403);
    expect(await prisma.applicationComment.count()).toBe(0);
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
    const metrics = await metricsRegistry.metrics();
    expect(metrics).toContain(
      'digitale_behoerde_application_status_changes_total{from="SUBMITTED",to="IN_REVIEW",service="digitale-behoerde-backend"} 1'
    );
    expect(metrics).toContain(
      'digitale_behoerde_application_status_changes_total{from="IN_REVIEW",to="APPROVED",service="digitale-behoerde-backend"} 1'
    );
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
