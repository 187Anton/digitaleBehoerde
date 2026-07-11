import { expect, test } from "@playwright/test";

test("Registrierung validiert Passwortlänge und Wiederholung", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Zur Registrierung" }).click();

  const password = page.locator('input[aria-describedby="password-requirements"]');
  const confirmation = page.getByLabel("Passwort wiederholen");

  await password.fill("kurz");
  await expect(page.getByText("Das Passwort muss mindestens 8 Zeichen lang sein.")).toBeVisible();
  await expect(password).toHaveAttribute("aria-invalid", "true");

  await password.fill("sicheres-passwort");
  await confirmation.fill("anderes-passwort");
  await expect(page.getByText("Die Passwörter stimmen nicht überein.")).toBeVisible();
  await expect(confirmation).toHaveAttribute("aria-invalid", "true");

  await confirmation.fill("sicheres-passwort");
  await expect(page.getByText("Die Passwörter stimmen nicht überein.")).toHaveCount(0);
  await expect(confirmation).toHaveAttribute("aria-invalid", "false");
});
