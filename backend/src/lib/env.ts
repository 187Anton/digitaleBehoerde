export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  jwtSecret:
    process.env.JWT_SECRET ??
    "development-only-secret-change-before-production",
};

export const isProduction = env.nodeEnv === "production";
