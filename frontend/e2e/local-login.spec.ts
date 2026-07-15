import { expect, test } from "@playwright/test";

test("lokaler Demo-Bürger kann sich anmelden", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("E-Mail").fill("buerger@example.com");
  await page.getByLabel("Passwort").fill("password123");
  await page.getByRole("button", { name: "Einloggen" }).click();

  await expect(page.getByRole("heading", { name: "Antragskatalog" })).toBeVisible();
  await expect(page.getByText("Erfolgreich angemeldet.")).toBeVisible();
});
