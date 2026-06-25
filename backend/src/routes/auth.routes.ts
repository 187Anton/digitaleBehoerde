import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AUTH_COOKIE, signToken } from "../lib/auth.js";
import { isProduction } from "../lib/env.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
export const authRouter = Router();

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  birthPlace: true,
  street: true,
  postalCode: true,
  city: true,
} as const;
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 2 * 60 * 60 * 1000,
};
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validierung fehlgeschlagen",
      details: parsed.error.flatten(),
    });
  }
  const { email, password, firstName, lastName } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName },
      select: publicUserSelect,
    });
    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "E-Mail-Adresse bereits registriert" });
    }
    throw err;
  }
});
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validierung fehlgeschlagen" });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  const publicUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect,
  });
  return res.json({ user: publicUser });
});
authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE);
  return res.json({ ok: true });
});
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: publicUserSelect,
  });
  if (!user) {
    return res.status(404).json({ error: "Nutzer nicht gefunden" });
  }
  return res.json({ user });
});
