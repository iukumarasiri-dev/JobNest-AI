import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const resumesRouter = Router();
resumesRouter.use(requireAuth);

const resumeSchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  rawText: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

resumesRouter.get("/", async (req, res) => {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(resumes);
});

resumesRouter.post("/", async (req, res) => {
  const parsed = resumeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const resume = await prisma.resume.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(resume);
});

resumesRouter.get("/:id", async (req, res) => {
  const resume = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!resume) return res.status(404).json({ error: "Not found" });
  res.json(resume);
});

resumesRouter.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.resume.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

resumesRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.resume.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
