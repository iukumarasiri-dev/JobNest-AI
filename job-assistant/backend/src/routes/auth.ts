import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { createSession, destroySession, getUserFromRequest } from "../lib/session.js";
import { generateUniqueUsername } from "../lib/username.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  sendLoginNotificationEmail,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
} from "../lib/mail.js";

const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authRouter = Router();

const SignupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
    companyName: z.string().min(1).optional(),
    jobRole: z.string().max(120).optional().or(z.literal("")),
    location: z.string().max(120).optional().or(z.literal("")),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.role !== "EMPLOYER" || !!data.companyName?.trim(), {
    message: "Company name is required for employer accounts",
    path: ["companyName"],
  });

authRouter.post("/signup", async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, name, role, companyName, jobRole, location, birthDate } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const username = await generateUniqueUsername(name || email.split("@")[0]);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        role,
        jobRole: jobRole || undefined,
        location: location || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        lastLoginAt: new Date(),
      },
    });
    if (role === "EMPLOYER") {
      await tx.company.create({
        data: { ownerId: created.id, name: companyName!.trim() },
      });
    }
    return created;
  });
  await createSession(res, user.id);

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
  });
});

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(res, user.id);
  sendLoginNotificationEmail(user.email, user.name);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
  });
});

authRouter.post("/logout", async (req, res) => {
  await destroySession(req, res);
  res.json({ success: true });
});

async function getFollowCounts(userId: string) {
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followerCount, followingCount };
}

function serializeMe(user: {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  jobRole: string | null;
  location: string | null;
  birthDate: Date | null;
  role: string;
  createdAt: Date;
}, counts: { followerCount: number; followingCount: number }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    jobRole: user.jobRole,
    location: user.location,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    role: user.role,
    ...counts,
  };
}

authRouter.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const counts = await getFollowCounts(user.id);
  res.json(serializeMe(user, counts));
});

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|gif|webp);base64,/;
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000; // ~2MB decoded
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores")
    .optional(),
  avatarUrl: z.string().regex(IMAGE_DATA_URL).max(MAX_IMAGE_DATA_URL_LENGTH).optional().or(z.literal("")),
  bannerUrl: z.string().regex(IMAGE_DATA_URL).max(MAX_IMAGE_DATA_URL_LENGTH).optional().or(z.literal("")),
  jobRole: z.string().max(120).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  birthDate: z.string().regex(DATE_ONLY).optional().or(z.literal("")),
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { avatarUrl, bannerUrl, jobRole, location, birthDate, ...rest } = parsed.data;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...rest,
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl: bannerUrl || null } : {}),
        ...(jobRole !== undefined ? { jobRole: jobRole || null } : {}),
        ...(location !== undefined ? { location: location || null } : {}),
        ...(birthDate !== undefined ? { birthDate: birthDate ? new Date(birthDate) : null } : {}),
      },
    });

    const counts = await getFollowCounts(user.id);
    res.json(serializeMe(user, counts));
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return res.status(409).json({ error: "That handle is already taken" });
    }
    throw err;
  }
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = req.user!;
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  sendPasswordChangedEmail(user.email);
  res.json({ success: true });
});

const ForgotPasswordSchema = z.object({
  email: z.email(),
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashToken(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    sendPasswordResetEmail(user.email, resetUrl);
  }

  // Always respond the same way so we don't leak which emails are registered.
  res.json({ message: "If that email is registered, a reset link has been sent." });
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { token, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashToken(token) },
  });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired" });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  sendPasswordChangedEmail(user.email);
  res.json({ success: true });
});
