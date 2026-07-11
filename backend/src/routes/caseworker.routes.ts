import { ApplicationStatus, type Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import {
  applicationCommentSchema,
  applicationStatusSchema,
} from "../schemas/application.schema.js";
import { publicDocumentSelect } from "../lib/upload.js";
import { applicationStatusChanges } from "../lib/metrics.js";

export const caseworkerRouter = Router();

const applicationInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  residenceChange: true,
  dogTax: true,
  certificateOfConduct: true,
  documents: { select: publicDocumentSelect },
  comments: {
    include: {
      author: {
        select: { id: true, role: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.ApplicationInclude;

const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["IN_REVIEW"],
  IN_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

caseworkerRouter.use(requireAuth, requireRole("CASEWORKER"));

caseworkerRouter.get("/applications", async (_req, res) => {
  const applications = await prisma.application.findMany({
    include: applicationInclude,
    orderBy: { createdAt: "asc" },
  });
  return res.json({ applications });
});

caseworkerRouter.get("/applications/:id", async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: applicationInclude,
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  return res.json({ application });
});

caseworkerRouter.post("/applications/:id/comments", async (req, res) => {
  const parsed = applicationCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
  }
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }

  const comment = await prisma.applicationComment.create({
    data: {
      applicationId: application.id,
      authorId: req.user!.userId,
      body: parsed.data.body,
    },
    include: {
      author: {
        select: { id: true, role: true, firstName: true, lastName: true },
      },
    },
  });
  return res.status(201).json({ comment });
});

caseworkerRouter.patch("/applications/:id/status", async (req, res) => {
  const parsed = applicationStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Ungültiger Status" });
  }

  const current = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!current) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  if (!allowedTransitions[current.status].includes(parsed.data.status)) {
    return res.status(409).json({
      error: `Statuswechsel von ${current.status} zu ${parsed.data.status} ist nicht erlaubt`,
    });
  }

  const updated = await prisma.application.updateMany({
    where: { id: current.id, status: current.status },
    data: { status: parsed.data.status },
  });
  if (updated.count === 0) {
    return res.status(409).json({ error: "Der Antrag wurde zwischenzeitlich bearbeitet" });
  }
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: current.id },
    include: applicationInclude,
  });
  applicationStatusChanges.inc({ from: current.status, to: application.status });
  return res.json({ application });
});
