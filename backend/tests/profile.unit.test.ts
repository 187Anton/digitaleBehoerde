import { describe, it, expect } from "vitest";
import { profileUpdateSchema } from "../src/schemas/profile.schema.js";

describe("profileUpdateSchema", () => {
  it("akzeptiert ein vollständig ausgefülltes Profil", () => {
    const result = profileUpdateSchema.safeParse({
      firstName: "Leon",
      lastName: "Gührke",
      birthDate: "1998-04-12",
      birthPlace: "Berlin",
      street: "Hauptstraße 1",
      postalCode: "10115",
      city: "Berlin",
    });
    expect(result.success).toBe(true);
  });

  it("akzeptiert ein leeres Profil (alle Felder optional)", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("akzeptiert eine Teilaktualisierung", () => {
    expect(
      profileUpdateSchema.safeParse({ city: "Potsdam" }).success
    ).toBe(true);
  });

  it("lehnt eine ungültige Postleitzahl ab", () => {
    const result = profileUpdateSchema.safeParse({ postalCode: "123" });
    expect(result.success).toBe(false);
  });

  it("lehnt ein Datum im falschen Format ab", () => {
    const result = profileUpdateSchema.safeParse({ birthDate: "12.04.1998" });
    expect(result.success).toBe(false);
  });

  it("lehnt einen leeren Vornamen ab", () => {
    const result = profileUpdateSchema.safeParse({ firstName: "" });
    expect(result.success).toBe(false);
  });
});
