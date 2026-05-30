import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "digitale-behoerde-backend" });
  });

  return app;
}