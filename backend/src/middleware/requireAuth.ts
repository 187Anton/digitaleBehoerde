import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, verifyToken, type JwtPayload } from "../lib/auth.js";
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Ungueltiges oder abgelaufenes Token" });
  }
}

export function requireRole(role: JwtPayload["role"]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: "Keine Berechtigung" });
      return;
    }
    next();
  };
}
