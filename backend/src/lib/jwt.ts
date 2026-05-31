import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "./env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwtSecret, {
    ...options,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret);

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    !Object.values(Role).includes(payload.role as Role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as Role,
  };
}
