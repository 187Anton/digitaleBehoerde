import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { profileUpdateSchema } from "../schemas/profile.schema.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.patch("/", async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validierung fehlgeschlagen",
      details: parsed.error.flatten(),
    });
  }

  const { birthDate, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...rest,
      birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : undefined,
    },
    select: {
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
    },
  });

  return res.json({ user });
});
