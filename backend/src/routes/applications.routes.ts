import { Router } from "express";
import { unlink } from "node:fs/promises";
import { prisma } from "../lib/prisma.js";
import {
  deleteStoredDocument,
  isDocumentNotFoundError,
  openStoredDocument,
  persistUploadedDocument,
} from "../lib/document-storage.js";
import {
  documentUpload,
  hasValidDocumentSignature,
  publicDocumentSelect,
} from "../lib/upload.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  certificateOfConductSchema,
  dogTaxSchema,
  residenceChangeSchema,
} from "../schemas/application.schema.js";
import { applicationsCreated } from "../lib/metrics.js";

export const applicationsRouter = Router();

const citizenApplicationInclude = {
  residenceChange: true,
  dogTax: true,
  certificateOfConduct: true,
  documents: { select: publicDocumentSelect },
} as const;

applicationsRouter.use(requireAuth);

applicationsRouter.get("/", async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.userId },
    include: citizenApplicationInclude,
    orderBy: { createdAt: "desc" },
  });

  return res.json({ applications });
});

applicationsRouter.post("/residence-change", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Bürger können Anträge stellen" });
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
  applicationsCreated.inc({ type: application.type });

  return res.status(201).json({ application });
});

applicationsRouter.post("/dog-tax", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Bürger können Anträge stellen" });
  }

  const parsed = dogTaxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validierung fehlgeschlagen",
      details: parsed.error.flatten(),
    });
  }

  const { dogBirthDate, taxStartDate, ...data } = parsed.data;
  const application = await prisma.application.create({
    data: {
      type: "DOG_TAX",
      userId: req.user!.userId,
      dogTax: {
        create: {
          ...data,
          dogBirthDate: dogBirthDate
            ? new Date(`${dogBirthDate}T00:00:00.000Z`)
            : null,
          taxStartDate: new Date(`${taxStartDate}T00:00:00.000Z`),
        },
      },
    },
    include: { dogTax: true, documents: { select: publicDocumentSelect } },
  });
  applicationsCreated.inc({ type: application.type });

  return res.status(201).json({ application });
});

applicationsRouter.post("/certificate-of-conduct", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Bürger können Anträge stellen" });
  }

  const parsed = certificateOfConductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validierung fehlgeschlagen",
      details: parsed.error.flatten(),
    });
  }

  const application = await prisma.application.create({
    data: {
      type: "CERTIFICATE_OF_CONDUCT",
      userId: req.user!.userId,
      certificateOfConduct: {
        create: parsed.data,
      },
    },
    include: { certificateOfConduct: true, documents: { select: publicDocumentSelect } },
  });
  applicationsCreated.inc({ type: application.type });

  return res.status(201).json({ application });
});

applicationsRouter.patch("/:id", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Bürger können eigene Anträge bearbeiten" });
  }

  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!application) {
    return res.status(404).json({ error: "Antrag nicht gefunden" });
  }
  if (application.status !== "SUBMITTED") {
    return res.status(409).json({ error: "Antrag kann nicht mehr bearbeitet werden" });
  }

  if (application.type === "RESIDENCE_CHANGE") {
    const parsed = residenceChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validierung fehlgeschlagen",
        details: parsed.error.flatten(),
      });
    }
    const { moveDate, ...data } = parsed.data;
    await prisma.residenceChange.update({
      where: { applicationId: application.id },
      data: { ...data, moveDate: new Date(`${moveDate}T00:00:00.000Z`) },
    });
  } else if (application.type === "DOG_TAX") {
    const parsed = dogTaxSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validierung fehlgeschlagen",
        details: parsed.error.flatten(),
      });
    }
    const { dogBirthDate, taxStartDate, ...data } = parsed.data;
    await prisma.dogTax.update({
      where: { applicationId: application.id },
      data: {
        ...data,
        dogBirthDate: dogBirthDate ? new Date(`${dogBirthDate}T00:00:00.000Z`) : null,
        taxStartDate: new Date(`${taxStartDate}T00:00:00.000Z`),
      },
    });
  } else {
    const parsed = certificateOfConductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validierung fehlgeschlagen",
        details: parsed.error.flatten(),
      });
    }
    await prisma.certificateOfConduct.update({
      where: { applicationId: application.id },
      data: parsed.data,
    });
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { updatedAt: new Date() },
    include: citizenApplicationInclude,
  });
  return res.json({ application: updated });
});

applicationsRouter.post(
  "/:id/documents",
  async (req, res, next) => {
    if (req.user!.role !== "CITIZEN") {
      return res.status(403).json({ error: "Nur Bürger können Dokumente hochladen" });
    }
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!application) {
      return res.status(404).json({ error: "Antrag nicht gefunden" });
    }
    if (application.status !== "SUBMITTED") {
      return res.status(409).json({ error: "Dokumente können nicht mehr hinzugefügt werden" });
    }
    res.locals.applicationId = application.id;
    return next();
  },
  documentUpload.single("document"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "Kein Dokument ausgewählt" });
    }
    if (!(await hasValidDocumentSignature(req.file.path, req.file.mimetype))) {
      await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: "Dateiinhalt entspricht nicht dem Dateityp" });
    }
    try {
      await persistUploadedDocument(req.file);
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
      await deleteStoredDocument(req.file.filename).catch(() => undefined);
      return next(error);
    }
  }
);

applicationsRouter.put(
  "/:applicationId/documents/:documentId",
  async (req, res, next) => {
    if (req.user!.role !== "CITIZEN") {
      return res.status(403).json({ error: "Nur Bürger können Dokumente ersetzen" });
    }
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.documentId,
        applicationId: req.params.applicationId,
        application: { userId: req.user!.userId },
      },
      include: { application: { select: { status: true } } },
    });
    if (!document) {
      return res.status(404).json({ error: "Dokument nicht gefunden" });
    }
    if (document.application.status !== "SUBMITTED") {
      return res.status(409).json({ error: "Dokument kann nicht mehr ersetzt werden" });
    }
    res.locals.existingDocument = document;
    return next();
  },
  documentUpload.single("document"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "Kein Dokument ausgewählt" });
    }
    if (!(await hasValidDocumentSignature(req.file.path, req.file.mimetype))) {
      await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: "Dateiinhalt entspricht nicht dem Dateityp" });
    }

    const existingDocument = res.locals.existingDocument as {
      id: string;
      storedName: string;
    };
    try {
      await persistUploadedDocument(req.file);
      const document = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedAt: new Date(),
        },
        select: publicDocumentSelect,
      });
      await deleteStoredDocument(existingDocument.storedName).catch((error) => {
        console.error("Altes Dokument konnte nicht gelöscht werden", error);
      });
      return res.json({ document });
    } catch (error) {
      await deleteStoredDocument(req.file.filename).catch(() => undefined);
      return next(error);
    }
  }
);

applicationsRouter.delete("/:applicationId/documents/:documentId", async (req, res) => {
  if (req.user!.role !== "CITIZEN") {
    return res.status(403).json({ error: "Nur Bürger können Dokumente löschen" });
  }
  const document = await prisma.document.findFirst({
    where: {
      id: req.params.documentId,
      applicationId: req.params.applicationId,
      application: { userId: req.user!.userId },
    },
    include: { application: { select: { status: true } } },
  });
  if (!document) {
    return res.status(404).json({ error: "Dokument nicht gefunden" });
  }
  if (document.application.status !== "SUBMITTED") {
    return res.status(409).json({ error: "Dokument kann nicht mehr gelöscht werden" });
  }

  await deleteStoredDocument(document.storedName);
  await prisma.document.delete({ where: { id: document.id } });
  return res.status(204).send();
});

applicationsRouter.get("/:applicationId/documents/:documentId", async (req, res, next) => {
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

  try {
    const storedDocument = await openStoredDocument(document.storedName);
    if (req.query.inline === "true") {
      res.setHeader("Content-Disposition", "inline");
    } else {
      res.attachment(document.originalName);
    }
    res.type(document.mimeType);
    if (storedDocument.contentLength !== undefined) {
      res.setHeader("Content-Length", storedDocument.contentLength);
    }
    storedDocument.stream.on("error", next);
    return storedDocument.stream.pipe(res);
  } catch (error) {
    if (isDocumentNotFoundError(error)) {
      return res.status(404).json({ error: "Datei nicht gefunden" });
    }
    return next(error);
  }
});
