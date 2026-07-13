import path from "node:path";

const DEVELOPMENT_JWT_SECRET = "development-only-secret-change-before-production";

export function resolveJwtSecret(
  nodeEnv: string,
  configuredSecret: string | undefined
): string {
  if (configuredSecret?.trim()) {
    return configuredSecret;
  }
  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET muss in Produktion gesetzt sein.");
  }
  return DEVELOPMENT_JWT_SECRET;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),
  documentStorage: process.env.DOCUMENT_STORAGE ?? "local",
  azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  azureStorageContainer: process.env.AZURE_STORAGE_CONTAINER ?? "application-documents",
  jwtSecret: resolveJwtSecret(nodeEnv, process.env.JWT_SECRET),
};

export const isProduction = env.nodeEnv === "production";
