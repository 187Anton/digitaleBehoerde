import { createReadStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import type { Express } from "express";
import { env } from "./env.js";

type StoredDocument = {
  stream: Readable;
  contentLength?: number;
};

let blobServiceClient: BlobServiceClient | undefined;

function useAzureStorage() {
  return env.documentStorage === "azure";
}

function getContainerClient() {
  if (!env.azureStorageAccount) {
    throw new Error("AZURE_STORAGE_ACCOUNT fehlt fuer den Azure-Dokumentenspeicher");
  }
  blobServiceClient ??= new BlobServiceClient(
    `https://${env.azureStorageAccount}.blob.core.windows.net`,
    new ManagedIdentityCredential()
  );
  return blobServiceClient.getContainerClient(env.azureStorageContainer);
}

export async function persistUploadedDocument(file: Express.Multer.File) {
  if (!useAzureStorage()) {
    return;
  }
  const blob = getContainerClient().getBlockBlobClient(file.filename);
  try {
    await blob.uploadFile(file.path, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });
  } finally {
    await unlink(file.path).catch(() => undefined);
  }
}

export async function deleteStoredDocument(storedName: string) {
  if (useAzureStorage()) {
    await getContainerClient().deleteBlob(storedName, { deleteSnapshots: "include" }).catch(
      (error: unknown) => {
        if (!isDocumentNotFoundError(error)) {
          throw error;
        }
      }
    );
    return;
  }
  await unlink(path.join(env.uploadDir, storedName)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

export async function openStoredDocument(storedName: string): Promise<StoredDocument> {
  if (useAzureStorage()) {
    const response = await getContainerClient().getBlobClient(storedName).download();
    if (!response.readableStreamBody) {
      throw new Error("Azure Blob Storage hat keinen Datenstrom geliefert");
    }
    return {
      stream: response.readableStreamBody as Readable,
      contentLength: response.contentLength,
    };
  }

  const filePath = path.join(env.uploadDir, storedName);
  const fileStat = await stat(filePath);
  return { stream: createReadStream(filePath), contentLength: fileStat.size };
}

export function isDocumentNotFoundError(error: unknown) {
  if (error instanceof Error) {
    const storageError = error as Error & { code?: string; statusCode?: number };
    return storageError.code === "ENOENT"
      || storageError.code === "BlobNotFound"
      || storageError.statusCode === 404;
  }
  return false;
}
