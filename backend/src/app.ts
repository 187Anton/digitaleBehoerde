import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { servicesRouter } from "./routes/services.routes.js";

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
  app.use("/api/services", servicesRouter);
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: "Interner Serverfehler." });
    }
  );

  return app;
}
