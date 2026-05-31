import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  const [scheme, token] = authHeader?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentifizierung erforderlich." });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Token ist ungueltig oder abgelaufen." });
  }
}
