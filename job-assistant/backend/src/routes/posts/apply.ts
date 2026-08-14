import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { applySchema } from "./schemas.js";

class DuplicateApplicationError extends Error {}

export async function applyToPost(req: Request, res: Response) {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.kind !== "JOB") {
    return res.status(400).json({ error: "Only job posts can be applied to" });
  }

  try {
    const application = await prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: { userId: req.user!.id, postId: post.id },
      });
      if (existing) throw new DuplicateApplicationError();

      const company = await tx.company.findUnique({ where: { ownerId: post.authorId } });

      return tx.application.create({
        data: {
          userId: req.user!.id,
          postId: post.id,
          resumeId: parsed.data.resumeId,
          companyName: company?.name ?? "Unknown company",
          jobTitle: post.title!,
          jobDescription: post.description!,
          location: post.location,
          salaryRange: post.salaryRange,
          status: "applied",
        },
      });
    });

    res.status(201).json(application);
  } catch (err) {
    if (err instanceof DuplicateApplicationError) {
      return res.status(409).json({ error: "You already applied to this post" });
    }
    throw err;
  }
}

export async function listApplicants(req: Request, res: Response) {
  const post = await prisma.post.findFirst({
    where: { id: req.params.id, authorId: req.user!.id },
  });
  if (!post) return res.status(404).json({ error: "Not found" });

  const applications = await prisma.application.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      resume: { select: { id: true, title: true, rawText: true } },
    },
  });

  res.json(
    applications.map((a) => ({
      id: a.id,
      appliedDate: a.appliedDate,
      createdAt: a.createdAt,
      applicant: a.user,
      resume: a.resume,
    }))
  );
}
