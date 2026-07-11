import { expect, test } from "@playwright/test";

test("Sachbearbeitung sieht PDF- und Bildvorschauen mit Download-Fallback", async ({ page }) => {
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
      body: JSON.stringify({
        applications: [
          {
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
            documents: [
              {
                id: "pdf-1",
                applicationId: "application-1",
                originalName: "nachweis.pdf",
                mimeType: "application/pdf",
                size: 128,
                uploadedAt: "2026-07-01T10:00:00.000Z",
              },
              {
                id: "image-1",
                applicationId: "application-1",
                originalName: "ausweis.png",
                mimeType: "image/png",
                size: 256,
                uploadedAt: "2026-07-01T10:00:00.000Z",
              },
            ],
          },
        ],
      }),
    })
  );
  await page.route("**/api/applications/*/documents/*", (route) =>
    route.fulfill({ status: 200, contentType: "application/octet-stream", body: "preview" })
  );

  await page.goto("/");

  const pdfPreview = page.getByTitle("Vorschau von nachweis.pdf");
  const imagePreview = page.getByAltText("Vorschau von ausweis.png");
  await expect(pdfPreview).toHaveAttribute("src", /pdf-1\?inline=true$/);
  await expect(imagePreview).toHaveAttribute("src", /image-1\?inline=true$/);

  const downloads = page.getByRole("link", { name: "Herunterladen" });
  await expect(downloads).toHaveCount(2);
  await expect(downloads.nth(0)).not.toHaveAttribute("href", /inline=true/);
});
