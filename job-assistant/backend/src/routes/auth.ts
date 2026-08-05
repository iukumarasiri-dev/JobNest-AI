import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { createSession, destroySession, getUserFromRequest } from "../lib/session.js";

export const authRouter = Router();

const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  await createSession(res, user.id);

  res.status(201).json({ id: user.id, email: user.email, name: user.name });
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

  await createSession(res, user.id);
  res.json({ id: user.id, email: user.email, name: user.name });
});

authRouter.post("/logout", async (req, res) => {
  await destroySession(req, res);
  res.json({ success: true });
});

authRouter.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ id: user.id, email: user.email, name: user.name });
});
