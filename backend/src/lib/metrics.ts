import type { NextFunction, Request, Response } from "express";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

export const metricsRegistry = new Registry();
metricsRegistry.setDefaultLabels({ service: "digitale-behoerde-backend" });

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: "digitale_behoerde_",
});

const httpRequests = new Counter({
  name: "digitale_behoerde_http_requests_total",
  help: "Anzahl verarbeiteter HTTP-Anfragen.",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "digitale_behoerde_http_request_duration_seconds",
  help: "Dauer der HTTP-Anfragen in Sekunden.",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const applicationsCreated = new Counter({
  name: "digitale_behoerde_applications_created_total",
  help: "Anzahl neu eingereichter Antraege.",
  labelNames: ["type"] as const,
  registers: [metricsRegistry],
});

export const applicationStatusChanges = new Counter({
  name: "digitale_behoerde_application_status_changes_total",
  help: "Anzahl erfolgreicher Statuswechsel von Antraegen.",
  labelNames: ["from", "to"] as const,
  registers: [metricsRegistry],
});

const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

function normalizedRoute(req: Request) {
  return req.originalUrl.split("?", 1)[0].replace(uuidPattern, ":id");
}

export function observeHttpRequest(req: Request, res: Response, next: NextFunction) {
  const stopTimer = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: normalizedRoute(req),
      status_code: String(res.statusCode),
    };
    httpRequests.inc(labels);
    stopTimer(labels);
  });
  next();
}
