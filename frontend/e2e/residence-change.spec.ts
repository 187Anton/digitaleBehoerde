import { expect, test } from "@playwright/test";

test("Buerger reicht Wohnsitzummeldung ein und Sachbearbeiter genehmigt sie", async ({
  page,
}) => {
  const marker = `E2E-${Date.now()}`;
  const newStreet = `${marker} Teststrasse 2`;

  await page.goto("/");
  await page.getByLabel("E-Mail").fill("buerger@example.com");
  await page.getByLabel("Passwort").fill("password123");
  await page.getByRole("button", { name: "Einloggen" }).click();

  await expect(page.getByRole("heading", { name: "Antragskatalog" })).toBeVisible();
  await page.getByRole("heading", { name: "Wohnsitz ummelden", exact: true }).click();

  const oldAddress = page.getByRole("group", { name: "Bisherige Anschrift" });
  const newAddress = page.getByRole("group", { name: "Neue Anschrift" });
  await page.getByLabel("Einzugsdatum").fill("2026-07-01");
  await oldAddress.getByLabel("Strasse und Hausnummer").fill("Alte Strasse 1");
  await oldAddress.getByLabel("Postleitzahl").fill("14467");
  await oldAddress.getByLabel("Ort").fill("Potsdam");
  await newAddress.getByLabel("Strasse und Hausnummer").fill(newStreet);
  await newAddress.getByLabel("Postleitzahl").fill("10115");
  await newAddress.getByLabel("Ort").fill("Berlin");
  await page.getByLabel("Anzahl umziehender Personen").fill("2");
  await page
    .getByLabel("Nachweisdokument (PDF, JPEG oder PNG, maximal 5 MB)")
    .setInputFiles("e2e/fixtures/nachweis.pdf");
  await page.getByRole("button", { name: "Wohnsitzummeldung absenden" }).click();

  await expect(page.getByText("Wohnsitzummeldung wurde erfolgreich eingereicht.")).toBeVisible();
  const citizenApplication = page.locator("li").filter({ hasText: newStreet });
  await expect(citizenApplication).toHaveCount(1);
  await expect(citizenApplication.getByRole("link", { name: "nachweis.pdf" })).toBeVisible();

  await page.getByRole("button", { name: "Abmelden" }).click();
  await page.getByLabel("E-Mail").fill("sachbearbeiter@example.com");
  await page.getByLabel("Passwort").fill("password123");
  await page.getByRole("button", { name: "Einloggen" }).click();

  await expect(page.getByRole("heading", { name: "Antragsbearbeitung" })).toBeVisible();
  const caseworkerApplication = page.locator("article").filter({ hasText: newStreet });
  await expect(caseworkerApplication).toHaveCount(1);
  await expect(caseworkerApplication.getByRole("link", { name: "nachweis.pdf" })).toBeVisible();

  await caseworkerApplication.getByRole("button", { name: "Bearbeitung beginnen" }).click();
  await expect(caseworkerApplication.getByText("In Bearbeitung", { exact: true })).toBeVisible();
  await caseworkerApplication.getByRole("button", { name: "Genehmigen" }).click();
  await expect(caseworkerApplication.getByText("Genehmigt", { exact: true })).toBeVisible();
});
