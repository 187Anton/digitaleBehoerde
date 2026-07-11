import { expect, test } from "@playwright/test";

function application(
  id: string,
  type: "RESIDENCE_CHANGE" | "DOG_TAX" | "CERTIFICATE_OF_CONDUCT",
  status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED",
  createdAt: string
) {
  return {
    id,
    type,
    status,
    userId: `user-${id}`,
    createdAt,
    updatedAt: createdAt,
    user: {
      id: `user-${id}`,
      email: `${id}@example.com`,
      firstName: "Test",
      lastName: id,
    },
    residenceChange: null,
    dogTax: null,
    certificateOfConduct: null,
    documents: [],
  };
}

test("Sachbearbeitung filtert nach Typ und Status und sortiert Anträge", async ({ page }) => {
  const applications = [
    application("dog-old", "DOG_TAX", "APPROVED", "2026-06-01T10:00:00.000Z"),
    application("residence-open", "RESIDENCE_CHANGE", "SUBMITTED", "2026-06-02T10:00:00.000Z"),
    application("certificate", "CERTIFICATE_OF_CONDUCT", "REJECTED", "2026-06-03T10:00:00.000Z"),
    application("residence-review", "RESIDENCE_CHANGE", "IN_REVIEW", "2026-06-04T10:00:00.000Z"),
  ];

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
      body: JSON.stringify({ applications }),
    })
  );

  await page.goto("/");

  await expect(page.locator("article h3")).toHaveText([
    "Hundesteuer anmelden",
    "Wohnsitz ummelden",
    "Führungszeugnis beantragen",
    "Wohnsitz ummelden",
  ]);

  await page.getByRole("tab", { name: "Hundesteuer (1)" }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article h3")).toHaveText("Hundesteuer anmelden");

  await page.getByRole("tab", { name: "Alle (4)" }).click();
  await page.getByLabel("Antragsstatus filtern").selectOption("APPROVED");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article").getByText("Genehmigt", { exact: true })).toBeVisible();

  await page.getByLabel("Antragsstatus filtern").selectOption("ALL");
  await page.getByLabel("Anträge sortieren").selectOption("NEWEST");
  await expect(page.locator("article").first().getByText("In Bearbeitung", { exact: true })).toBeVisible();

  await page.getByLabel("Anträge sortieren").selectOption("STATUS");
  await expect(page.locator("article .status-pill")).toHaveText([
    "Eingereicht",
    "In Bearbeitung",
    "Genehmigt",
    "Abgelehnt",
  ]);
});
