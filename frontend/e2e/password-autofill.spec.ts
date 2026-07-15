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

test("Passwort wird nach erfolgreichem Login und Logout verworfen", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"Nicht angemeldet"}' })
  );
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      json: {
        user: {
          id: "citizen-1",
          email: "buerger@example.com",
          role: "CITIZEN",
          firstName: "Bea",
          lastName: "Bürger",
          birthDate: null,
          birthPlace: null,
          street: null,
          postalCode: null,
          city: null,
        },
      },
    })
  );
  await page.route("**/api/services", (route) => route.fulfill({ json: { services: [] } }));
  await page.route("**/api/applications", (route) =>
    route.fulfill({ json: { applications: [] } })
  );
  await page.route("**/api/auth/logout", (route) => route.fulfill({ json: { ok: true } }));
  await page.goto("/");

  const password = page.getByLabel("Passwort");
  await password.fill("sicheres-passwort");
  await page.getByRole("button", { name: "Anzeigen" }).click();
  await page.getByRole("button", { name: "Einloggen" }).click();
  await expect(page.getByRole("heading", { name: "Antragskatalog" })).toBeVisible();

  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect(password).toHaveValue("");
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});
