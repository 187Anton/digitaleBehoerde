import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.routes.js";
export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "digitale-behoerde-backend" });
  });
  app.use("/api/auth", authRouter);
  return app;
}