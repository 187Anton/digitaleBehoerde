import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { readdir, unlink } from "node:fs/promises";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { AUTH_COOKIE, signToken } from "../src/lib/auth.js";
import { env } from "../src/lib/env.js";
import { metricsRegistry } from "../src/lib/metrics.js";

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
    metricsRegistry.resetMetrics();
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());
  afterEach(async () => {
    const files = await readdir(env.uploadDir).catch(() => []);
    await Promise.all(files.map((file) => unlink(`${env.uploadDir}/${file}`)));
  });

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
    expect(await metricsRegistry.metrics()).toContain(
      'digitale_behoerde_applications_created_total{type="RESIDENCE_CHANGE",service="digitale-behoerde-backend"} 1'
    );
  });

  it("aktualisiert einen eigenen eingereichten Antrag", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    const updated = await request(app)
      .patch(`/api/applications/${created.body.application.id}`)
      .set("Cookie", cookie)
      .send({ ...validPayload, newCity: "Hamburg", householdSize: 3 });

    expect(updated.status).toBe(200);
    expect(updated.body.application.residenceChange).toMatchObject({
      newCity: "Hamburg",
      householdSize: 3,
    });
  });

  it("verhindert Änderungen nach Beginn der Bearbeitung", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);
    await prisma.application.update({
      where: { id: created.body.application.id },
      data: { status: "IN_REVIEW" },
    });

    const updated = await request(app)
      .patch(`/api/applications/${created.body.application.id}`)
      .set("Cookie", cookie)
      .send({ ...validPayload, newCity: "Hamburg" });

    expect(updated.status).toBe(409);
    const detail = await prisma.residenceChange.findUnique({
      where: { applicationId: created.body.application.id },
    });
    expect(detail?.newCity).toBe("Berlin");
  });

  it("aktualisiert einen Führungszeugnis-Antrag", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/certificate-of-conduct")
      .set("Cookie", cookie)
      .send({ purpose: "Arbeitgeber", deliveryType: "PRIVATE" });

    const updated = await request(app)
      .patch(`/api/applications/${created.body.application.id}`)
      .set("Cookie", cookie)
      .send({ purpose: "Ehrenamt", deliveryType: "AUTHORITY" });

    expect(updated.status).toBe(200);
    expect(updated.body.application.certificateOfConduct).toMatchObject({
      purpose: "Ehrenamt",
      deliveryType: "AUTHORITY",
    });
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

  it("laedt ein PDF zu einem eigenen Antrag hoch und wieder herunter", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("%PDF-1.4 demo"), {
        filename: "meldebestaetigung.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(201);
    expect(upload.body.document).toMatchObject({
      originalName: "meldebestaetigung.pdf",
      mimeType: "application/pdf",
      size: 13,
    });

    const download = await request(app)
      .get(
        `/api/applications/${created.body.application.id}/documents/${upload.body.document.id}`
      )
      .set("Cookie", cookie);
    expect(download.status).toBe(200);
    expect(download.headers["content-disposition"]).toContain("meldebestaetigung.pdf");

    const caseworker = await createUser("CASEWORKER");
    const preview = await request(app)
      .get(
        `/api/applications/${created.body.application.id}/documents/${upload.body.document.id}?inline=true`
      )
      .set("Cookie", caseworker.cookie);
    expect(preview.status).toBe(200);
    expect(preview.headers["content-type"]).toContain("application/pdf");
    expect(preview.headers["content-disposition"]).toBe("inline");
  });

  it("ersetzt und löscht ein Dokument eines eingereichten Antrags", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);
    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("%PDF-1.4 alt"), {
        filename: "alt.pdf",
        contentType: "application/pdf",
      });

    const replaced = await request(app)
      .put(
        `/api/applications/${created.body.application.id}/documents/${upload.body.document.id}`
      )
      .set("Cookie", cookie)
      .attach("document", Buffer.from("%PDF-1.4 neu"), {
        filename: "neu.pdf",
        contentType: "application/pdf",
      });

    expect(replaced.status).toBe(200);
    expect(replaced.body.document).toMatchObject({
      id: upload.body.document.id,
      originalName: "neu.pdf",
    });

    const deleted = await request(app)
      .delete(
        `/api/applications/${created.body.application.id}/documents/${upload.body.document.id}`
      )
      .set("Cookie", cookie);
    expect(deleted.status).toBe(204);
    expect(await prisma.document.count()).toBe(0);
  });

  it("lehnt nicht erlaubte Dateitypen ab", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("kein dokument"), {
        filename: "datei.txt",
        contentType: "text/plain",
      });

    expect(upload.status).toBe(400);
    expect(await prisma.document.count()).toBe(0);
  });

  it("lehnt manipulierte Dateiinhalte ab", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("kein echtes PDF"), {
        filename: "manipuliert.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(400);
    expect(await prisma.document.count()).toBe(0);
  });

  it("lehnt Dokumente über 5 MB ab", async () => {
    const { cookie } = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .send(validPayload);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.alloc(5 * 1024 * 1024 + 1, 0x25), {
        filename: "zu-gross.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(400);
    expect(upload.body.error).toBe("Dokument darf maximal 5 MB groß sein.");
    expect(await prisma.document.count()).toBe(0);
  });

  it("verhindert Uploads zu fremden Antraegen", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const created = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", owner.cookie)
      .send(validPayload);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", stranger.cookie)
      .attach("document", Buffer.from("%PDF-1.4 demo"), {
        filename: "fremd.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(404);
    expect(await prisma.document.count()).toBe(0);
  });
});
