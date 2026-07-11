import { expect, test } from "@playwright/test";

test("Wohnsitzummeldung übermittelt beide Pflichtdokumente gemeinsam", async ({ page }) => {
  let submittedMultipart = "";

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "user-1", email: "bea@example.com", role: "CITIZEN" },
      }),
    })
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        services: [
          {
            type: "RESIDENCE_CHANGE",
            title: "Wohnsitz ummelden",
            description: "Adresswechsel online anzeigen.",
            available: true,
          },
        ],
      }),
    })
  );
  await page.route("**/api/applications", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"applications":[]}' })
  );
  await page.route("**/api/applications/residence-change", async (route) => {
    submittedMultipart = route.request().postDataBuffer()?.toString("utf8") ?? "";
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        application: {
          id: "application-1",
          type: "RESIDENCE_CHANGE",
          status: "SUBMITTED",
          userId: "user-1",
          createdAt: "2026-07-01T10:00:00.000Z",
          updatedAt: "2026-07-01T10:00:00.000Z",
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
          documents: [
            {
              id: "identity-1",
              applicationId: "application-1",
              originalName: "nachweis.pdf",
              mimeType: "application/pdf",
              type: "IDENTITY_DOCUMENT",
              size: 128,
              uploadedAt: "2026-07-01T10:00:00.000Z",
            },
            {
              id: "landlord-1",
              applicationId: "application-1",
              originalName: "nachweis.pdf",
              mimeType: "application/pdf",
              type: "LANDLORD_CONFIRMATION",
              size: 128,
              uploadedAt: "2026-07-01T10:00:00.000Z",
            },
          ],
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("heading", { name: "Wohnsitz ummelden", exact: true }).click();

  const oldAddress = page.getByRole("group", { name: "Bisherige Anschrift" });
  const newAddress = page.getByRole("group", { name: "Neue Anschrift" });
  await page.getByLabel("Einzugsdatum").fill("2026-07-15");
  await oldAddress.getByLabel("Straße und Hausnummer").fill("Alte Straße 1");
  await oldAddress.getByLabel("Postleitzahl").fill("14467");
  await oldAddress.getByLabel("Ort").fill("Potsdam");
  await newAddress.getByLabel("Straße und Hausnummer").fill("Neue Straße 2");
  await newAddress.getByLabel("Postleitzahl").fill("10115");
  await newAddress.getByLabel("Ort").fill("Berlin");

  const identity = page.getByLabel(
    "Personalausweis (Pflicht, PDF, JPEG oder PNG, maximal 5 MB)"
  );
  const landlord = page.getByLabel(
    "Wohnungsgeberbestätigung (Pflicht, PDF, JPEG oder PNG, maximal 5 MB)"
  );
  const optional = page.getByLabel(
    "Einzugsbestätigung (optional, PDF, JPEG oder PNG, maximal 5 MB)"
  );
  await expect(identity).toHaveAttribute("required", "");
  await expect(landlord).toHaveAttribute("required", "");
  await expect(optional).not.toHaveAttribute("required", "");
  await identity.setInputFiles("e2e/fixtures/nachweis.pdf");
  await landlord.setInputFiles("e2e/fixtures/nachweis.pdf");

  await page.getByRole("button", { name: "Wohnsitzummeldung absenden" }).click();
  await expect(page.getByText("Wohnsitzummeldung wurde erfolgreich eingereicht.")).toBeVisible();
  expect(submittedMultipart).toContain('name="identityDocument"');
  expect(submittedMultipart).toContain('name="landlordConfirmation"');
  expect(submittedMultipart).not.toContain('name="moveInConfirmation"');
});
