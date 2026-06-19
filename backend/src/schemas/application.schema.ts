import { z } from "zod";

const requiredText = z.string().trim().min(1).max(120);
const postalCode = z.string().trim().regex(/^\d{5}$/, "Postleitzahl muss aus 5 Ziffern bestehen");

export const residenceChangeSchema = z.object({
  moveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Einzugsdatum muss im Format JJJJ-MM-TT angegeben werden")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }, "Einzugsdatum ist ungueltig"),
  oldStreet: requiredText,
  oldPostalCode: postalCode,
  oldCity: requiredText,
  newStreet: requiredText,
  newPostalCode: postalCode,
  newCity: requiredText,
  householdSize: z.number().int().min(1).max(20),
});

export type ResidenceChangeInput = z.infer<typeof residenceChangeSchema>;

export const applicationStatusSchema = z.object({
  status: z.enum(["IN_REVIEW", "APPROVED", "REJECTED"]),
});
