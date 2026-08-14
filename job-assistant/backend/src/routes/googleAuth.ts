import { Router } from "express";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/db.js";
import { hashPassword } from "../lib/password.js";
import { createSession } from "../lib/session.js";
import { generateUniqueUsername } from "../lib/username.js";

const STATE_COOKIE = "google_oauth_state";
const STATE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function frontendUrl(path: string) {
  return `${process.env.FRONTEND_URL ?? "http://localhost:3000"}${path}`;
}

function getClient() {
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
}

export const googleAuthRouter = Router();

googleAuthRouter.get("/", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: "Google sign-in is not configured" });
  }

  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_DURATION_MS,
    path: "/api/auth/google",
  });

  const client = getClient();
  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
  res.redirect(url);
});

googleAuthRouter.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const cookieState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { path: "/api/auth/google" });

  if (!code || typeof code !== "string" || !state || state !== cookieState) {
    return res.redirect(frontendUrl("/login?error=google_auth_failed"));
  }

  try {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error("No id_token returned from Google");

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      throw new Error("Google account has no verified email");
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const username = await generateUniqueUsername(payload.name || payload.email.split("@")[0]);
      user = await prisma.user.create({
        data: {
          email: payload.email,
          passwordHash: await hashPassword(randomPassword),
          name: payload.name ?? null,
          username,
          avatarUrl: payload.picture ?? null,
          role: "JOB_SEEKER",
          lastLoginAt: new Date(),
        },
      });
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    }

    await createSession(res, user.id);
    res.redirect(frontendUrl(user.role === "EMPLOYER" ? "/dashboard/company" : "/dashboard"));
  } catch (err) {
    console.error("Google sign-in failed:", err);
    res.redirect(frontendUrl("/login?error=google_auth_failed"));
  }
});
