import { expect, test } from "@playwright/test";

const submittedApplication = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "RESIDENCE_CHANGE",
  status: "SUBMITTED",
  userId: "user-1",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  residenceChange: {
    id: "detail-1",
    applicationId: "11111111-1111-4111-8111-111111111111",
    moveDate: "2026-07-15T00:00:00.000Z",
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
  documents: [
    {
      id: "document-1",
      applicationId: "11111111-1111-4111-8111-111111111111",
      originalName: "nachweis.pdf",
      mimeType: "application/pdf",
      size: 128,
      uploadedAt: "2026-07-01T10:00:00.000Z",
    },
  ],
};

const reviewedApplication = {
  ...submittedApplication,
  id: "22222222-2222-4222-8222-222222222222",
  status: "IN_REVIEW",
  residenceChange: {
    ...submittedApplication.residenceChange,
    id: "detail-2",
    applicationId: "22222222-2222-4222-8222-222222222222",
  },
  documents: [],
};

test("eingereichte Anträge und Dokumente können bearbeitet werden", async ({ page }) => {
  let currentApplication = structuredClone(submittedApplication);

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "user-1", email: "bea@example.com", role: "CITIZEN" } }),
    })
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"services":[]}' })
  );
  await page.route("**/api/applications", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ applications: [currentApplication, reviewedApplication] }),
    })
  );
  await page.route("**/api/applications/*", async (route) => {
    const payload = route.request().postDataJSON();
    currentApplication = {
      ...currentApplication,
      residenceChange: { ...currentApplication.residenceChange, ...payload },
    };
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ application: currentApplication }),
    });
  });
  await page.route("**/api/applications/*/documents/*", async (route) => {
    if (route.request().method() === "PUT") {
      const replacement = { ...currentApplication.documents[0], originalName: "neu.pdf" };
      currentApplication = { ...currentApplication, documents: [replacement] };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ document: replacement }),
      });
      return;
    }
    if (route.request().method() === "DELETE") {
      currentApplication = { ...currentApplication, documents: [] };
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Meine Anträge (2)" }).click();

  const editButtons = page.getByRole("button", { name: "Bearbeiten" });
  await expect(editButtons.nth(0)).toBeEnabled();
  await expect(editButtons.nth(1)).toBeDisabled();

  await editButtons.nth(0).click();
  await expect(page.getByRole("heading", { name: "Wohnsitz ummelden" })).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByLabel("Ort").nth(1).fill("Hamburg");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Antrag wurde aktualisiert.")).toBeVisible();
  await expect(page.getByText(/Neue Anschrift:.*Hamburg/)).toBeVisible();

  await page.getByLabel("nachweis.pdf ersetzen").setInputFiles("e2e/fixtures/nachweis.pdf");
  await expect(page.getByRole("link", { name: "neu.pdf" })).toBeVisible();

  await page.getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("Kein Dokument vorhanden.").first()).toBeVisible();
});
