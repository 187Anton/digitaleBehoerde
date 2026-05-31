import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Role } from "@prisma/client";
import { createApp } from "../src/app.js";

type TestUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
};

const { prismaMock, users } = vi.hoisted(() => {
  const users: TestUser[] = [];

  function selectFields(user: TestUser, select?: Record<string, boolean>) {
    if (!select) {
      return user;
    }

    return Object.fromEntries(
      Object.entries(select)
        .filter(([, enabled]) => enabled)
        .map(([key]) => [key, user[key as keyof TestUser]])
    );
  }

  return {
    users,
    prismaMock: {
      user: {
        findUnique: vi.fn(
          async ({
            where,
            select,
          }: {
            where: { email: string };
            select?: Record<string, boolean>;
          }) => {
            const user = users.find((entry) => entry.email === where.email);
            return user ? selectFields(user, select) : null;
          }
        ),
        create: vi.fn(
          async ({
            data,
            select,
          }: {
            data: {
              email: string;
              passwordHash: string;
              firstName?: string;
              lastName?: string;
            };
            select?: Record<string, boolean>;
          }) => {
            const user: TestUser = {
              id: `user-${users.length + 1}`,
              email: data.email,
              passwordHash: data.passwordHash,
              role: "CITIZEN",
              firstName: data.firstName ?? null,
              lastName: data.lastName ?? null,
              createdAt: new Date("2026-01-01T00:00:00.000Z"),
            };

            users.push(user);
            return selectFields(user, select);
          }
        ),
      },
    },
  };
});

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

const app = createApp();

describe("Auth-Endpunkte", () => {
  beforeEach(() => {
    users.length = 0;
    vi.clearAllMocks();
  });

  it("registriert Nutzer mit gehashtem Passwort und gibt ein Token zurueck", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "Buerger@example.com",
      password: "sicheres-passwort",
      firstName: "Bea",
      lastName: "Buerger",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      id: "user-1",
      email: "buerger@example.com",
      role: "CITIZEN",
      firstName: "Bea",
      lastName: "Buerger",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(users[0].passwordHash).not.toBe("sicheres-passwort");
  });

  it("meldet registrierte Nutzer mit korrektem Passwort an", async () => {
    await request(app).post("/api/auth/register").send({
      email: "buerger@example.com",
      password: "sicheres-passwort",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "buerger@example.com",
      password: "sicheres-passwort",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      id: "user-1",
      email: "buerger@example.com",
      role: "CITIZEN",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("schuetzt /me und erlaubt Zugriff nur mit gueltigem Bearer-Token", async () => {
    const blocked = await request(app).get("/api/auth/me");
    expect(blocked.status).toBe(401);

    const registered = await request(app).post("/api/auth/register").send({
      email: "buerger@example.com",
      password: "sicheres-passwort",
    });

    const allowed = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registered.body.token}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body.user).toMatchObject({
      id: "user-1",
      email: "buerger@example.com",
      role: "CITIZEN",
    });
  });
});
