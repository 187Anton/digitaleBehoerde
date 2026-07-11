import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { servicesRouter } from "./routes/services.routes.js";
import { applicationsRouter } from "./routes/applications.routes.js";
import { caseworkerRouter } from "./routes/caseworker.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { metricsRegistry, observeHttpRequest } from "./lib/metrics.js";

export function createApp() {
  const app = express();
  app.use(observeHttpRequest);
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
  app.get("/metrics", async (_req, res, next) => {
    try {
      res.setHeader("Content-Type", metricsRegistry.contentType);
      return res.send(await metricsRegistry.metrics());
    } catch (error) {
      return next(error);
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/caseworker", caseworkerRouter);
  app.use("/api/profile", profileRouter);
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof multer.MulterError) {
        const error = err.code === "LIMIT_FILE_SIZE"
          ? "Dokument darf maximal 5 MB groß sein."
          : "Nur PDF-, JPEG- und PNG-Dokumente sind erlaubt.";
        return res.status(400).json({ error });
      }
      console.error(err);
      res.status(500).json({ error: "Interner Serverfehler." });
    }
  );

  return app;
}
