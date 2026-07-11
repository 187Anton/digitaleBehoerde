import { z } from "zod";

const requiredText = z.string().trim().min(1).max(120);
const postalCode = z.string().trim().regex(/^\d{5}$/, "Postleitzahl muss aus 5 Ziffern bestehen");
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format JJJJ-MM-TT angegeben werden")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "Datum ist ungültig");

export const residenceChangeSchema = z.object({
  moveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Einzugsdatum muss im Format JJJJ-MM-TT angegeben werden")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }, "Einzugsdatum ist ungültig"),
  oldStreet: requiredText,
  oldPostalCode: postalCode,
  oldCity: requiredText,
  newStreet: requiredText,
  newPostalCode: postalCode,
  newCity: requiredText,
  householdSize: z.number().int().min(1).max(20),
});

export type ResidenceChangeInput = z.infer<typeof residenceChangeSchema>;

export const dogTaxSchema = z.object({
  dogName: requiredText,
  dogBreed: requiredText.optional(),
  dogBirthDate: isoDate.optional(),
  chipNumber: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "Chipnummer muss aus 15 Ziffern bestehen")
    .optional(),
  ownerStreet: requiredText,
  ownerPostalCode: postalCode,
  ownerCity: requiredText,
  taxStartDate: isoDate,
});

export type DogTaxInput = z.infer<typeof dogTaxSchema>;

export const certificateOfConductSchema = z.object({
  purpose: requiredText,
  deliveryType: z.enum(["PRIVATE", "AUTHORITY"]),
  deliveryRecipient: requiredText,
  deliveryStreet: requiredText,
  deliveryPostalCode: postalCode,
  deliveryCity: requiredText,
});

export type CertificateOfConductInput = z.infer<typeof certificateOfConductSchema>;

export const applicationStatusSchema = z.object({
  status: z.enum(["IN_REVIEW", "APPROVED", "REJECTED"]),
});

export const applicationCommentSchema = z.object({
  body: z.string().trim().min(1, "Kommentar darf nicht leer sein").max(2000),
});
