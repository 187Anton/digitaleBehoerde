import { describe, it, expect } from "vitest";
import { dogTaxSchema } from "../src/schemas/application.schema.js";

const validBody = {
  dogName: "Bello",
  dogBreed: "Labrador",
  dogBirthDate: "2020-05-12",
  chipNumber: "276001234567890",
  ownerStreet: "Hauptstraße 1",
  ownerPostalCode: "14467",
  ownerCity: "Potsdam",
  taxStartDate: "2026-07-01",
};

describe("dogTaxSchema", () => {
  it("akzeptiert gültige Antragsdaten", () => {
    expect(dogTaxSchema.safeParse(validBody).success).toBe(true);
  });

  it("akzeptiert Eingaben ohne optionale Felder", () => {
    const { dogBreed, dogBirthDate, chipNumber, ...rest } = validBody;
    expect(dogTaxSchema.safeParse(rest).success).toBe(true);
  });

  it("lehnt einen Antrag ohne Hundenamen ab", () => {
    const { dogName, ...rest } = validBody;
    expect(dogTaxSchema.safeParse(rest).success).toBe(false);
  });

  it("lehnt eine ungültige Postleitzahl ab", () => {
    const result = dogTaxSchema.safeParse({ ...validBody, ownerPostalCode: "123" });
    expect(result.success).toBe(false);
  });

  it("lehnt eine Chipnummer mit falscher Länge ab", () => {
    const result = dogTaxSchema.safeParse({ ...validBody, chipNumber: "12345" });
    expect(result.success).toBe(false);
  });

  it("lehnt ein Datum im falschen Format ab", () => {
    const result = dogTaxSchema.safeParse({ ...validBody, taxStartDate: "01.07.2026" });
    expect(result.success).toBe(false);
  });
});
