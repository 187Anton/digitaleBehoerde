import { ApplicationStatus, type Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { applicationStatusSchema, chatMessageSchema } from "../schemas/application.schema.js";
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
  _count: {
    select: {
      chatMessages: {
        where: { readByCaseworkerAt: null },
      },
    },
  },
} satisfies Prisma.ApplicationInclude;

const chatMessageInclude = {
  author: {
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

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
  return res.json({
    applications: applications.map(({ _count, ...application }) => ({
      ...application,
      unreadChatMessages: _count.chatMessages,
    })),
  });
});

caseworkerRouter.get("/applications/:id", async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: applicationInclude,
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  const { _count, ...applicationData } = application;
  return res.json({ application: { ...applicationData, unreadChatMessages: _count.chatMessages } });
});

caseworkerRouter.get("/applications/:id/messages", async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  const messages = await prisma.chatMessage.findMany({
    where: { applicationId: application.id },
    include: chatMessageInclude,
    orderBy: { createdAt: "asc" },
  });
  await prisma.chatMessage.updateMany({
    where: {
      applicationId: application.id,
      authorId: { not: req.user!.userId },
      readByCaseworkerAt: null,
    },
    data: { readByCaseworkerAt: new Date() },
  });
  return res.json({ messages });
});

caseworkerRouter.post("/applications/:id/messages", async (req, res) => {
  const parsed = chatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Nachricht darf nicht leer sein" });
  }
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  const message = await prisma.chatMessage.create({
    data: {
      applicationId: application.id,
      authorId: req.user!.userId,
      body: parsed.data.body,
      readByCaseworkerAt: new Date(),
    },
    include: chatMessageInclude,
  });
  return res.status(201).json({ message });
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
  const { _count, ...applicationData } = application;
  return res.json({ application: { ...applicationData, unreadChatMessages: _count.chatMessages } });
});
