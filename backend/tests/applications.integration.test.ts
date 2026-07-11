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

function submitResidenceChange(
  cookie?: string,
  payload: typeof validPayload = validPayload
) {
  const residenceRequest = request(app)
    .post("/api/applications/residence-change")
    .field("data", JSON.stringify(payload))
    .attach("identityDocument", Buffer.from("%PDF-1.4 ausweis"), {
      filename: "personalausweis.pdf",
      contentType: "application/pdf",
    })
    .attach("landlordConfirmation", Buffer.from("%PDF-1.4 wohnungsgeber"), {
      filename: "wohnungsgeber.pdf",
      contentType: "application/pdf",
    });
  return cookie ? residenceRequest.set("Cookie", cookie) : residenceRequest;
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
    const res = await submitResidenceChange(cookie);

    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      type: "RESIDENCE_CHANGE",
      status: "SUBMITTED",
      userId: user.id,
      residenceChange: {
        newPostalCode: "10115",
        householdSize: 2,
      },
      documents: [
        { type: "IDENTITY_DOCUMENT", originalName: "personalausweis.pdf" },
        { type: "LANDLORD_CONFIRMATION", originalName: "wohnungsgeber.pdf" },
      ],
    });
    expect(await prisma.application.count()).toBe(1);
    expect(await metricsRegistry.metrics()).toContain(
      'digitale_behoerde_applications_created_total{type="RESIDENCE_CHANGE",service="digitale-behoerde-backend"} 1'
    );
  });

  it("lehnt unvollstaendige Meldedaten ab", async () => {
    const { cookie } = await createUser();
    const res = await submitResidenceChange(cookie, { ...validPayload, newCity: "" });

    expect(res.status).toBe(400);
    expect(await prisma.application.count()).toBe(0);
  });

  it("verlangt eine Anmeldung", async () => {
    const res = await submitResidenceChange();
    expect(res.status).toBe(401);
  });

  it("erlaubt Sachbearbeitern keine Antragstellung", async () => {
    const { cookie } = await createUser("CASEWORKER");
    const res = await submitResidenceChange(cookie);
    expect(res.status).toBe(403);
  });

  it("verlangt beide Pflichtdokumente", async () => {
    const { cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .field("data", JSON.stringify(validPayload))
      .attach("identityDocument", Buffer.from("%PDF-1.4 ausweis"), {
        filename: "personalausweis.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Wohnungsgeberbestätigung");
    expect(await prisma.application.count()).toBe(0);
  });

  it("akzeptiert eine optionale Einzugsbestätigung", async () => {
    const { cookie } = await createUser();
    const res = await request(app)
      .post("/api/applications/residence-change")
      .set("Cookie", cookie)
      .field("data", JSON.stringify(validPayload))
      .attach("identityDocument", Buffer.from("%PDF-1.4 ausweis"), {
        filename: "personalausweis.pdf",
        contentType: "application/pdf",
      })
      .attach("landlordConfirmation", Buffer.from("%PDF-1.4 wohnungsgeber"), {
        filename: "wohnungsgeber.pdf",
        contentType: "application/pdf",
      })
      .attach("moveInConfirmation", Buffer.from("%PDF-1.4 einzug"), {
        filename: "einzug.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.application.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "MOVE_IN_CONFIRMATION", originalName: "einzug.pdf" }),
      ])
    );
  });

  it("liefert nur die Antraege des angemeldeten Buergers", async () => {
    const first = await createUser();
    const second = await createUser();
    await submitResidenceChange(first.cookie);
    await submitResidenceChange(second.cookie, { ...validPayload, newCity: "Hamburg" });

    const res = await request(app).get("/api/applications").set("Cookie", first.cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].userId).toBe(first.user.id);
    expect(res.body.applications[0].residenceChange.newCity).toBe("Berlin");
  });

  it("laedt ein PDF zu einem eigenen Antrag hoch und wieder herunter", async () => {
    const { cookie } = await createUser();
    const created = await submitResidenceChange(cookie);

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
      type: "OTHER",
      size: 13,
    });

    const download = await request(app)
      .get(
        `/api/applications/${created.body.application.id}/documents/${upload.body.document.id}`
      )
      .set("Cookie", cookie);
    expect(download.status).toBe(200);
    expect(download.headers["content-disposition"]).toContain("meldebestaetigung.pdf");
  });

  it("lehnt nicht erlaubte Dateitypen ab", async () => {
    const { cookie } = await createUser();
    const created = await submitResidenceChange(cookie);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("kein dokument"), {
        filename: "datei.txt",
        contentType: "text/plain",
      });

    expect(upload.status).toBe(400);
    expect(await prisma.document.count()).toBe(2);
  });

  it("lehnt manipulierte Dateiinhalte ab", async () => {
    const { cookie } = await createUser();
    const created = await submitResidenceChange(cookie);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.from("kein echtes PDF"), {
        filename: "manipuliert.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(400);
    expect(await prisma.document.count()).toBe(2);
  });

  it("lehnt Dokumente ueber 5 MB ab", async () => {
    const { cookie } = await createUser();
    const created = await submitResidenceChange(cookie);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", cookie)
      .attach("document", Buffer.alloc(5 * 1024 * 1024 + 1, 0x25), {
        filename: "zu-gross.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(400);
    expect(await prisma.document.count()).toBe(2);
  });

  it("verhindert Uploads zu fremden Antraegen", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const created = await submitResidenceChange(owner.cookie);

    const upload = await request(app)
      .post(`/api/applications/${created.body.application.id}/documents`)
      .set("Cookie", stranger.cookie)
      .attach("document", Buffer.from("%PDF-1.4 demo"), {
        filename: "fremd.pdf",
        contentType: "application/pdf",
      });

    expect(upload.status).toBe(404);
    expect(await prisma.document.count()).toBe(2);
  });
});
