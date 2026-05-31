import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../src/schemas/auth.schema.js";
describe("registerSchema", () => {
  it("akzeptiert gueltige Registrierungsdaten", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "geheim12",
    });
    expect(result.success).toBe(true);
  });
  it("lehnt eine ungueltige E-Mail-Adresse ab", () => {
    const result = registerSchema.safeParse({
      email: "keine-email",
      password: "geheim12",
    });
    expect(result.success).toBe(false);
  });
  it("lehnt ein zu kurzes Passwort ab", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
  it("normalisiert die E-Mail (trim + lowercase)", () => {
    const result = registerSchema.parse({
      email: "  TEST@Example.COM ",
      password: "geheim12",
    });
    expect(result.email).toBe("test@example.com");
  });
});
describe("loginSchema", () => {
  it("akzeptiert ein nicht-leeres Passwort", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.de", password: "x" }).success
    ).toBe(true);
  });
  it("lehnt leeres Passwort ab", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.de", password: "" }).success
    ).toBe(false);
  });
});