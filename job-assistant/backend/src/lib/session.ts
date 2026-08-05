import type { Request, Response } from "express";
import { prisma } from "./db.js";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(res: Response, userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({ data: { userId, expiresAt } });

  res.cookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getUserFromRequest(req: Request) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession(req: Request, res: Response) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
