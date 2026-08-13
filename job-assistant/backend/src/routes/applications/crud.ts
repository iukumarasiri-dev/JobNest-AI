import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { applicationSchema, updateSchema } from "./schemas.js";

export async function listApplications(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { resume: true },
  });
  res.json(applications);
}

export async function createApplication(req: Request, res: Response) {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const application = await prisma.application.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(application);
}

export async function getApplication(req: Request, res: Response) {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { resume: true, generatedContent: true },
  });
  if (!application) return res.status(404).json({ error: "Not found" });
  res.json(application);
}

export async function updateApplication(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      appliedDate: parsed.data.appliedDate ? new Date(parsed.data.appliedDate) : undefined,
      followUpDate:
        parsed.data.followUpDate === undefined
          ? undefined
          : parsed.data.followUpDate
          ? new Date(parsed.data.followUpDate)
          : null,
    },
  });
  res.json(updated);
}

export async function deleteApplication(req: Request, res: Response) {
  const existing = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.application.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

export async function listGeneratedContent(req: Request, res: Response) {
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!application) return res.status(404).json({ error: "Not found" });

  const content = await prisma.generatedContent.findMany({
    where: { applicationId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(content);
}
