import { expect, test, type Page } from "@playwright/test";

const application = {
  id: "application-1",
  type: "RESIDENCE_CHANGE",
  status: "SUBMITTED",
  userId: "citizen-1",
  createdAt: "2026-07-11T09:00:00.000Z",
  updatedAt: "2026-07-11T09:00:00.000Z",
  residenceChange: {
    id: "residence-1",
    applicationId: "application-1",
    moveDate: "2026-08-01",
    oldStreet: "Alte Straße 1",
    oldPostalCode: "14467",
    oldCity: "Potsdam",
    newStreet: "Neue Straße 2",
    newPostalCode: "10115",
    newCity: "Berlin",
    householdSize: 2,
  },
  dogTax: null,
  certificateOfConduct: null,
  documents: [],
};

async function mockSession(page: Page, user: Record<string, unknown>) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({ json: { user } });
  });
}

test("Bürger kann eine Nachricht zu seinem Antrag lesen und senden", async ({ page }) => {
  const citizen = {
    id: "citizen-1",
    email: "buerger@example.com",
    role: "CITIZEN",
    firstName: "Erika",
    lastName: "Musterfrau",
  };
  const receivedMessage = {
    id: "message-1",
    applicationId: application.id,
    authorId: "caseworker-1",
    body: "Bitte reichen Sie den fehlenden Nachweis nach.",
    createdAt: "2026-07-11T09:15:00.000Z",
    readByCitizenAt: null,
    readByCaseworkerAt: "2026-07-11T09:15:00.000Z",
    author: { id: "caseworker-1", role: "CASEWORKER", firstName: "Max", lastName: "Mustermann" },
  };

  await mockSession(page, citizen);
  await page.route("**/api/services", async (route) => route.fulfill({ json: { services: [] } }));
  await page.route("**/api/applications", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { applications: [{ ...application, unreadChatMessages: 1 }] } });
      return;
    }
    await route.fallback();
  });
  await page.route("**/api/applications/application-1/messages", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { messages: [receivedMessage] } });
      return;
    }
    const requestBody = route.request().postDataJSON() as { body: string };
    await route.fulfill({
      status: 201,
      json: {
        message: {
          id: "message-2",
          applicationId: application.id,
          authorId: citizen.id,
          body: requestBody.body,
          createdAt: "2026-07-11T09:20:00.000Z",
          readByCitizenAt: "2026-07-11T09:20:00.000Z",
          readByCaseworkerAt: null,
          author: { id: citizen.id, role: "CITIZEN", firstName: "Erika", lastName: "Musterfrau" },
        },
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Nachrichten (1)" }).click();
  await page.getByRole("button", { name: "Chat öffnen" }).click();
  await expect(page.getByText(receivedMessage.body)).toBeVisible();
  await expect(page.getByText("Automatische Aktualisierung alle 30 Sekunden")).toBeVisible();

  await page.getByLabel("Nachricht").fill("Den Nachweis lade ich heute hoch.");
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page.getByText("Den Nachweis lade ich heute hoch.")).toBeVisible();
  await expect(page.getByText("Erika Musterfrau")).toBeVisible();
});

test("Sachbearbeitung kann den Chat zu jedem Antrag öffnen und antworten", async ({ page }) => {
  const caseworker = {
    id: "caseworker-1",
    email: "sachbearbeiter@example.com",
    role: "CASEWORKER",
    firstName: "Max",
    lastName: "Mustermann",
  };
  const citizenMessage = {
    id: "message-1",
    applicationId: application.id,
    authorId: "citizen-1",
    body: "Ich habe eine Rückfrage zum Antrag.",
    createdAt: "2026-07-11T09:15:00.000Z",
    readByCitizenAt: "2026-07-11T09:15:00.000Z",
    readByCaseworkerAt: null,
    author: { id: "citizen-1", role: "CITIZEN", firstName: "Erika", lastName: "Musterfrau" },
  };

  await mockSession(page, caseworker);
  await page.route("**/api/caseworker/applications", async (route) => {
    await route.fulfill({
      json: {
        applications: [{
          ...application,
          unreadChatMessages: 1,
          user: { id: "citizen-1", email: "buerger@example.com", firstName: "Erika", lastName: "Musterfrau" },
        }],
      },
    });
  });
  await page.route("**/api/caseworker/applications/application-1/messages", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { messages: [citizenMessage] } });
      return;
    }
    const requestBody = route.request().postDataJSON() as { body: string };
    await route.fulfill({
      status: 201,
      json: {
        message: {
          id: "message-2",
          applicationId: application.id,
          authorId: caseworker.id,
          body: requestBody.body,
          createdAt: "2026-07-11T09:20:00.000Z",
          readByCitizenAt: null,
          readByCaseworkerAt: "2026-07-11T09:20:00.000Z",
          author: { id: caseworker.id, role: "CASEWORKER", firstName: "Max", lastName: "Mustermann" },
        },
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Nachrichten (1)" }).click();
  await expect(page.getByText(citizenMessage.body)).toBeVisible();

  await page.getByLabel("Nachricht").fill("Gern, wie kann ich helfen?");
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(page.getByText("Gern, wie kann ich helfen?")).toBeVisible();
  await expect(page.getByText("Max Mustermann")).toBeVisible();
});
