import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { requireAuth } from "../middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const userSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  createdAt: true,
} as const;

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ error: "E-Mail ist bereits registriert." });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      select: userSelect,
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validierung fehlgeschlagen.", details: error.flatten() });
    }

    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return res.status(401).json({ error: "E-Mail oder Passwort ist ungueltig." });
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validierung fehlgeschlagen.", details: error.flatten() });
    }

    return next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});
