import path from "node:path";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),
  documentStorage: process.env.DOCUMENT_STORAGE ?? "local",
  azureStorageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  azureStorageContainer: process.env.AZURE_STORAGE_CONTAINER ?? "application-documents",
  jwtSecret:
    process.env.JWT_SECRET ??
    "development-only-secret-change-before-production",
};

export const isProduction = env.nodeEnv === "production";
