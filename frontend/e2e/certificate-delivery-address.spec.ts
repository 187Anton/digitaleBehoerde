import { expect, test } from "@playwright/test";

test("Versandadresse wird vorbelegt und spätere Uploads werden ausgeblendet", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "user-1",
          email: "bea@example.com",
          role: "CITIZEN",
          firstName: "Bea",
          lastName: "Bürger",
          street: "Hauptstraße 1",
          postalCode: "14467",
          city: "Potsdam",
        },
      }),
    })
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        services: [
          {
            type: "CERTIFICATE_OF_CONDUCT",
            title: "Führungszeugnis beantragen",
            description: "Führungszeugnis online beantragen.",
            available: true,
          },
        ],
      }),
    })
  );
  await page.route("**/api/applications", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        applications: [
          {
            id: "application-1",
            type: "CERTIFICATE_OF_CONDUCT",
            status: "SUBMITTED",
            userId: "user-1",
            createdAt: "2026-07-01T10:00:00.000Z",
            updatedAt: "2026-07-01T10:00:00.000Z",
            residenceChange: null,
            dogTax: null,
            certificateOfConduct: {
              id: "certificate-1",
              applicationId: "application-1",
              purpose: "Arbeitgeber",
              deliveryType: "PRIVATE",
              deliveryRecipient: "Bea Bürger",
              deliveryStreet: "Hauptstraße 1",
              deliveryPostalCode: "14467",
              deliveryCity: "Potsdam",
            },
            documents: [],
          },
        ],
      }),
    })
  );

  await page.goto("/");
  await page.getByRole("heading", { name: "Führungszeugnis beantragen" }).click();

  await expect(page.getByLabel("Empfänger")).toHaveValue("Bea Bürger");
  await expect(page.getByLabel("Straße und Hausnummer")).toHaveValue("Hauptstraße 1");
  await expect(page.getByLabel("Postleitzahl")).toHaveValue("14467");
  await expect(page.getByLabel("Ort")).toHaveValue("Potsdam");

  await page.getByRole("button", { name: "Meine Anträge (1)" }).click();
  await expect(page.getByText("Weiteres Dokument hochladen")).toHaveCount(0);
  await expect(page.getByText(/Versand an Bea Bürger/)).toBeVisible();
});
