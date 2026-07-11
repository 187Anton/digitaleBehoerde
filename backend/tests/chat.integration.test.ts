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
      lastName: role === "CITIZEN" ? "Bürger" : "Sachbearbeiter",
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
          oldStreet: "Alte Straße 1",
          oldPostalCode: "14467",
          oldCity: "Potsdam",
          newStreet: "Neue Straße 2",
          newPostalCode: "10115",
          newCity: "Berlin",
          householdSize: 2,
        },
      },
    },
  });
}

describe("Antragschat (Integration)", () => {
  beforeEach(async () => {
    await prisma.application.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(() => prisma.$disconnect());

  it("ermöglicht Bürgern und Sachbearbeitung eine bidirektionale Unterhaltung", async () => {
    const citizen = await createUser("CITIZEN");
    const caseworker = await createUser("CASEWORKER");
    const application = await createApplication(citizen.user.id);

    const citizenMessage = await request(app)
      .post(`/api/applications/${application.id}/messages`)
      .set("Cookie", citizen.cookie)
      .send({ body: "  Wann wird mein Antrag bearbeitet?  " });
    expect(citizenMessage.status).toBe(201);
    expect(citizenMessage.body.message).toMatchObject({
      applicationId: application.id,
      authorId: citizen.user.id,
      body: "Wann wird mein Antrag bearbeitet?",
      author: { role: "CITIZEN" },
    });

    const caseworkerOverview = await request(app)
      .get("/api/caseworker/applications")
      .set("Cookie", caseworker.cookie);
    expect(caseworkerOverview.body.applications[0].unreadChatMessages).toBe(1);

    const caseworkerMessages = await request(app)
      .get(`/api/caseworker/applications/${application.id}/messages`)
      .set("Cookie", caseworker.cookie);
    expect(caseworkerMessages.status).toBe(200);
    expect(caseworkerMessages.body.messages).toHaveLength(1);

    const caseworkerReply = await request(app)
      .post(`/api/caseworker/applications/${application.id}/messages`)
      .set("Cookie", caseworker.cookie)
      .send({ body: "Wir prüfen den Antrag diese Woche." });
    expect(caseworkerReply.status).toBe(201);
    expect(caseworkerReply.body.message.author.role).toBe("CASEWORKER");

    const citizenOverview = await request(app)
      .get("/api/applications")
      .set("Cookie", citizen.cookie);
    expect(citizenOverview.body.applications[0].unreadChatMessages).toBe(1);

    const citizenMessages = await request(app)
      .get(`/api/applications/${application.id}/messages`)
      .set("Cookie", citizen.cookie);
    expect(citizenMessages.status).toBe(200);
    expect(citizenMessages.body.messages).toHaveLength(2);
    expect(citizenMessages.body.messages.map((message: { body: string }) => message.body)).toEqual([
      "Wann wird mein Antrag bearbeitet?",
      "Wir prüfen den Antrag diese Woche.",
    ]);
  });

  it("verweigert Bürgern den Zugriff auf fremde Chats und Sachbearbeiter-Endpunkte", async () => {
    const owner = await createUser("CITIZEN");
    const stranger = await createUser("CITIZEN");
    const application = await createApplication(owner.user.id);

    const foreignRead = await request(app)
      .get(`/api/applications/${application.id}/messages`)
      .set("Cookie", stranger.cookie);
    expect(foreignRead.status).toBe(404);

    const foreignWrite = await request(app)
      .post(`/api/applications/${application.id}/messages`)
      .set("Cookie", stranger.cookie)
      .send({ body: "Unbefugte Nachricht" });
    expect(foreignWrite.status).toBe(404);

    const caseworkerEndpoint = await request(app)
      .post(`/api/caseworker/applications/${application.id}/messages`)
      .set("Cookie", owner.cookie)
      .send({ body: "Unbefugt" });
    expect(caseworkerEndpoint.status).toBe(403);
    expect(await prisma.chatMessage.count()).toBe(0);
  });
});
