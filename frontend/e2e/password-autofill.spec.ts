import { expect, test } from "@playwright/test";

test("Passwort ist nicht vorbelegt und wird nach fehlgeschlagenem Login geleert", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"Nicht angemeldet"}' })
  );
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"E-Mail oder Passwort falsch"}',
    })
  );
  await page.goto("/");

  const password = page.getByLabel("Passwort");
  await expect(password).toHaveValue("");
  await expect(password).toHaveAttribute("autocomplete", "off");

  await password.fill("falsches-passwort");
  await page.getByRole("button", { name: "Einloggen" }).click();

  await expect(page.getByText("E-Mail oder Passwort falsch")).toBeVisible();
  await expect(password).toHaveValue("");
});
