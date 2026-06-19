import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { residenceChangeSchema } from "../schemas/application.schema.js";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

applicationsRouter.get("/", async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.userId },
    include: { residenceChange: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ applications });
});

applicationsRouter.post("/residence-change", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Buerger koennen Antraege stellen" });
  }

  const parsed = residenceChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validierung fehlgeschlagen",
      details: parsed.error.flatten(),
    });
  }

  const { moveDate, ...data } = parsed.data;
  const application = await prisma.application.create({
    data: {
      type: "RESIDENCE_CHANGE",
      userId: req.user!.userId,
      residenceChange: {
        create: {
          ...data,
          moveDate: new Date(`${moveDate}T00:00:00.000Z`),
        },
      },
    },
    include: { residenceChange: true },
  });

  return res.status(201).json({ application });
});
