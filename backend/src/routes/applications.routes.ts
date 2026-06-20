import { Router } from "express";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import {
  documentUpload,
  hasValidDocumentSignature,
  publicDocumentSelect,
} from "../lib/upload.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { residenceChangeSchema } from "../schemas/application.schema.js";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

applicationsRouter.get("/", async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.userId },
    include: { residenceChange: true, documents: { select: publicDocumentSelect } },
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
    include: { residenceChange: true, documents: { select: publicDocumentSelect } },
  });

  return res.status(201).json({ application });
});

applicationsRouter.post(
  "/:id/documents",
  async (req, res, next) => {
    if (req.user!.role !== "CITIZEN") {
      return res.status(403).json({ error: "Nur Buerger koennen Dokumente hochladen" });
    }
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!application) {
      return res.status(404).json({ error: "Antrag nicht gefunden" });
    }
    if (application.status !== "SUBMITTED") {
      return res.status(409).json({ error: "Dokumente koennen nicht mehr hinzugefuegt werden" });
    }
    res.locals.applicationId = application.id;
    return next();
  },
  documentUpload.single("document"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "Kein Dokument ausgewaehlt" });
    }
    if (!(await hasValidDocumentSignature(req.file.path, req.file.mimetype))) {
      await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: "Dateiinhalt entspricht nicht dem Dateityp" });
    }
    try {
      const document = await prisma.document.create({
        data: {
          applicationId: res.locals.applicationId as string,
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
        select: publicDocumentSelect,
      });
      return res.status(201).json({ document });
    } catch (error) {
      await unlink(req.file.path).catch(() => undefined);
      return next(error);
    }
  }
);

applicationsRouter.get("/:applicationId/documents/:documentId", async (req, res) => {
  const document = await prisma.document.findFirst({
    where: {
      id: req.params.documentId,
      applicationId: req.params.applicationId,
    },
    include: { application: { select: { userId: true } } },
  });
  if (!document) {
    return res.status(404).json({ error: "Dokument nicht gefunden" });
  }
  if (req.user!.role !== "CASEWORKER" && document.application.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Kein Zugriff auf dieses Dokument" });
  }

  return res.download(path.join(env.uploadDir, document.storedName), document.originalName, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ error: "Datei nicht gefunden" });
    }
  });
});
