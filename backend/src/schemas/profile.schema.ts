import { z } from "zod";

const optionalText = z.string().trim().min(1).max(120).optional();
const optionalPostalCode = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Postleitzahl muss aus 5 Ziffern bestehen")
  .optional();
const optionalIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format JJJJ-MM-TT angegeben werden")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "Datum ist ungültig")
  .optional();

export const profileUpdateSchema = z.object({
  firstName: optionalText,
  lastName: optionalText,
  birthDate: optionalIsoDate,
  birthPlace: optionalText,
  street: optionalText,
  postalCode: optionalPostalCode,
  city: optionalText,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
