import { expect, test } from "@playwright/test";

const baseApplication = {
  id: "application-1",
  type: "RESIDENCE_CHANGE",
  status: "SUBMITTED",
  userId: "citizen-1",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  user: {
    id: "citizen-1",
    email: "bea@example.com",
    firstName: "Bea",
    lastName: "Bürger",
  },
  residenceChange: {
    id: "residence-1",
    applicationId: "application-1",
    moveDate: "2026-07-15T00:00:00.000Z",
    oldStreet: "Alte Straße 1",
    oldPostalCode: "14467",
    oldCity: "Potsdam",
    newStreet: "Neue Straße 2",
    newPostalCode: "10115",
    newCity: "Berlin",
    householdSize: 1,
  },
  dogTax: null,
  certificateOfConduct: null,
  documents: [],
};

const comment = {
  id: "comment-1",
  applicationId: "application-1",
  authorId: "caseworker-1",
  body: "Bitte reichen Sie die Rückseite nach.",
  createdAt: "2026-07-02T12:30:00.000Z",
  author: {
    id: "caseworker-1",
    role: "CASEWORKER",
    firstName: "Sven",
    lastName: "Sachbearbeiter",
  },
};

test("Sachbearbeiter können einen Kommentar hinzufügen", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "caseworker-1", email: "sven@example.com", role: "CASEWORKER" },
      }),
    })
  );
  await page.route("**/api/caseworker/applications", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ applications: [{ ...baseApplication, comments: [] }] }),
    })
  );
  await page.route("**/api/caseworker/applications/*/comments", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ body: comment.body });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ comment }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Kommentar an den Bürger").fill(comment.body);
  await page.getByRole("button", { name: "Kommentar senden" }).click();

  await expect(page.getByText(comment.body)).toBeVisible();
  await expect(page.getByText("Sven Sachbearbeiter")).toBeVisible();
  await expect(page.getByText("Kommentar wurde hinzugefügt.")).toBeVisible();
  await expect(page.getByLabel("Kommentar an den Bürger")).toHaveValue("");
});

test("Bürger können Kommentare lesen, aber nicht schreiben", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "citizen-1", email: "bea@example.com", role: "CITIZEN" },
      }),
    })
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"services":[]}' })
  );
  await page.route("**/api/applications", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ applications: [{ ...baseApplication, comments: [comment] }] }),
    })
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Meine Anträge (1)" }).click();

  await expect(page.getByText(comment.body)).toBeVisible();
  await expect(page.getByText("Sven Sachbearbeiter")).toBeVisible();
  await expect(page.getByLabel("Kommentar an den Bürger")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Kommentar senden" })).toHaveCount(0);
});
