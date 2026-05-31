import { z } from "zod";
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;