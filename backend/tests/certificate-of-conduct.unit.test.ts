import { describe, expect, it } from "vitest";
import { certificateOfConductSchema } from "../src/schemas/application.schema.js";

const validBody = {
  purpose: "Vorlage beim Arbeitgeber",
  deliveryType: "PRIVATE",
  deliveryRecipient: "Bea Bürger",
  deliveryStreet: "Hauptstraße 1",
  deliveryPostalCode: "14467",
  deliveryCity: "Potsdam",
};

describe("certificateOfConductSchema", () => {
  it("akzeptiert gültige Antragsdaten", () => {
    expect(certificateOfConductSchema.safeParse(validBody).success).toBe(true);
  });

  it("akzeptiert die Zustellung an eine Behörde", () => {
    const result = certificateOfConductSchema.safeParse({
      ...validBody,
      deliveryType: "AUTHORITY",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt einen Antrag ohne Zweck ab", () => {
    const { purpose, ...rest } = validBody;
    expect(certificateOfConductSchema.safeParse(rest).success).toBe(false);
  });

  it("lehnt eine unbekannte Zustellart ab", () => {
    const result = certificateOfConductSchema.safeParse({
      ...validBody,
      deliveryType: "EMAIL",
    });
    expect(result.success).toBe(false);
  });

  it("verlangt eine vollständige Versandanschrift", () => {
    expect(
      certificateOfConductSchema.safeParse({ ...validBody, deliveryPostalCode: "1446" }).success
    ).toBe(false);
    expect(
      certificateOfConductSchema.safeParse({ ...validBody, deliveryRecipient: "" }).success
    ).toBe(false);
  });
});
