import { expect, test } from "@playwright/test";

test("Passwort kann ein- und ausgeblendet werden", async ({ page }) => {
  await page.goto("/");

  const passwordInput = page.getByLabel("Passwort");
  const toggle = page.getByRole("button", { name: "Anzeigen" });

  await expect(passwordInput).toHaveAttribute("type", "password");
  await toggle.click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Verbergen" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.getByRole("button", { name: "Verbergen" }).click();
  await expect(passwordInput).toHaveAttribute("type", "password");
});
