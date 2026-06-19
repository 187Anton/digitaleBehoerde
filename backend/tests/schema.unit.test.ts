import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../src/schemas/auth.schema.js";
import { residenceChangeSchema } from "../src/schemas/application.schema.js";
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

describe("residenceChangeSchema", () => {
  const validPayload = {
    moveDate: "2026-07-01",
    oldStreet: "Alte Strasse 1",
    oldPostalCode: "14467",
    oldCity: "Potsdam",
    newStreet: "Neue Strasse 2",
    newPostalCode: "10115",
    newCity: "Berlin",
    householdSize: 2,
  };

  it("akzeptiert gueltige Meldedaten", () => {
    expect(residenceChangeSchema.safeParse(validPayload).success).toBe(true);
  });

  it("lehnt ungueltige Postleitzahlen ab", () => {
    expect(
      residenceChangeSchema.safeParse({ ...validPayload, newPostalCode: "1234" }).success
    ).toBe(false);
  });

  it("lehnt ungueltige Kalenderdaten ab", () => {
    expect(
      residenceChangeSchema.safeParse({ ...validPayload, moveDate: "2026-02-30" }).success
    ).toBe(false);
  });

  it("begrenzt die Haushaltsgroesse", () => {
    expect(
      residenceChangeSchema.safeParse({ ...validPayload, householdSize: 0 }).success
    ).toBe(false);
  });
});
