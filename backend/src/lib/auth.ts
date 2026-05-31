import jwt from "jsonwebtoken";
import { env } from "./env.js";
export interface JwtPayload {
  userId: string;
  role: "CITIZEN" | "CASEWORKER";
}
const TOKEN_TTL = "2h";
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL });
}
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
export const AUTH_COOKIE = "token";