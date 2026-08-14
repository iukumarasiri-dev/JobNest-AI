import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { commentSchema } from "./schemas.js";

export async function toggleLike(req: Request, res: Response) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Not found" });

  const existing = await prisma.postLike.findFirst({
    where: { postId: post.id, userId: req.user!.id },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId: post.id, userId: req.user!.id } });
  }

  const likeCount = await prisma.postLike.count({ where: { postId: post.id } });
  res.json({ liked: !existing, likeCount });
}

export async function listComments(req: Request, res: Response) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Not found" });

  const comments = await prisma.postComment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, role: true } } },
  });
  res.json(comments);
}

export async function createComment(req: Request, res: Response) {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Not found" });

  const comment = await prisma.postComment.create({
    data: { postId: post.id, userId: req.user!.id, body: parsed.data.body },
    include: { user: { select: { id: true, name: true, role: true } } },
  });
  res.status(201).json(comment);
}
