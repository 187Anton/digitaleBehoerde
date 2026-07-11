import { expect, test } from "@playwright/test";

test("Bürger sehen alle hochgeladenen Dokumente in einem eigenen Tab", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "user-1", email: "bea@example.com", role: "CITIZEN" },
      }),
    })
  );
  await page.route("**/api/services", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"services":[]}' })
  );
  await page.route("**/api/applications", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        applications: [
          {
            id: "application-1",
            type: "RESIDENCE_CHANGE",
            status: "SUBMITTED",
            userId: "user-1",
            createdAt: "2026-07-01T10:00:00.000Z",
            updatedAt: "2026-07-01T10:00:00.000Z",
            residenceChange: null,
            dogTax: null,
            certificateOfConduct: null,
            documents: [
              {
                id: "document-1",
                applicationId: "application-1",
                originalName: "wohnungsgeber.pdf",
                mimeType: "application/pdf",
                size: 128,
                uploadedAt: "2026-07-02T10:00:00.000Z",
              },
            ],
          },
          {
            id: "application-2",
            type: "DOG_TAX",
            status: "APPROVED",
            userId: "user-1",
            createdAt: "2026-06-01T10:00:00.000Z",
            updatedAt: "2026-06-01T10:00:00.000Z",
            residenceChange: null,
            dogTax: null,
            certificateOfConduct: null,
            documents: [
              {
                id: "document-2",
                applicationId: "application-2",
                originalName: "impfpass.png",
                mimeType: "image/png",
                size: 256,
                uploadedAt: "2026-06-03T10:00:00.000Z",
              },
            ],
          },
        ],
      }),
    })
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Dokumente (2)" }).click();

  await expect(page.getByRole("heading", { name: "Dokumentenübersicht" })).toBeVisible();
  await expect(page.getByText("2 hochgeladene Dokumente")).toBeVisible();
  await expect(page.getByText("wohnungsgeber.pdf")).toBeVisible();
  await expect(page.getByText(/Wohnsitz ummelden · Hochgeladen am 2\.7\.2026/)).toBeVisible();
  await expect(page.getByText("impfpass.png")).toBeVisible();
  await expect(page.getByText(/Hundesteuer anmelden · Hochgeladen am 3\.6\.2026/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Herunterladen" })).toHaveCount(2);
});
