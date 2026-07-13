import { describe, expect, it } from "vitest";
import { resolveJwtSecret } from "../src/lib/env.js";

describe("Backend-Umgebung", () => {
  it("verwendet ein explizit gesetztes JWT-Secret", () => {
    expect(resolveJwtSecret("production", "sicheres-produktions-secret")).toBe(
      "sicheres-produktions-secret"
    );
  });

  it("erlaubt den Development-Fallback nur außerhalb der Produktion", () => {
    expect(resolveJwtSecret("development", undefined)).toBe(
      "development-only-secret-change-before-production"
    );
  });

  it("beendet den Produktionsstart ohne JWT-Secret mit klarer Fehlermeldung", () => {
    expect(() => resolveJwtSecret("production", undefined)).toThrow(
      "JWT_SECRET muss in Produktion gesetzt sein."
    );
    expect(() => resolveJwtSecret("production", "   ")).toThrow(
      "JWT_SECRET muss in Produktion gesetzt sein."
    );
  });
});
