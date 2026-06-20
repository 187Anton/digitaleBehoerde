import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { open } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { env } from "./env.js";

const extensionsByMimeType: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

mkdirSync(env.uploadDir, { recursive: true });

export const documentUpload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extensionsByMimeType[file.mimetype]}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!extensionsByMimeType[file.mimetype]) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
});

export const publicDocumentSelect = {
  id: true,
  applicationId: true,
  originalName: true,
  mimeType: true,
  size: true,
  uploadedAt: true,
} satisfies Prisma.DocumentSelect;

const signaturesByMimeType: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

export async function hasValidDocumentSignature(filePath: string, mimeType: string) {
  const signature = signaturesByMimeType[mimeType];
  if (!signature) {
    return false;
  }
  const file = await open(filePath, "r");
  try {
    const header = Buffer.alloc(signature.length);
    const { bytesRead } = await file.read(header, 0, signature.length, 0);
    return bytesRead === signature.length && signature.every((byte, index) => header[index] === byte);
  } finally {
    await file.close();
  }
}
