import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { createPostSchema } from "./schemas.js";

const authorSelect = {
  id: true,
  name: true,
  role: true,
  company: { select: { name: true } },
} as const;

function formatAuthor(author: { id: string; name: string | null; role: string; company: { name: string } | null }) {
  return {
    id: author.id,
    name: author.name,
    role: author.role,
    companyName: author.company?.name ?? null,
  };
}

export async function listPosts(req: Request, res: Response) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: req.user!.id }, select: { id: true } },
    },
  });

  const jobPostIds = posts.filter((p) => p.kind === "JOB").map((p) => p.id);
  const applied = jobPostIds.length
    ? await prisma.application.findMany({
        where: { userId: req.user!.id, postId: { in: jobPostIds } },
        select: { postId: true },
      })
    : [];
  const appliedPostIds = new Set(applied.map((a) => a.postId));

  res.json(
    posts.map((p) => ({
      id: p.id,
      kind: p.kind,
      body: p.body,
      title: p.title,
      description: p.description,
      location: p.location,
      salaryRange: p.salaryRange,
      videoUrl: p.videoUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: formatAuthor(p.author),
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      likedByMe: p.likes.length > 0,
      appliedByMe: p.kind === "JOB" ? appliedPostIds.has(p.id) : undefined,
    }))
  );
}

export async function createPost(req: Request, res: Response) {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (parsed.data.kind === "JOB" && req.user!.role !== "EMPLOYER") {
    return res.status(403).json({ error: "Employer account required to post a job" });
  }

  const data =
    parsed.data.kind === "JOB"
      ? {
          kind: "JOB" as const,
          title: parsed.data.title,
          description: parsed.data.description,
          location: parsed.data.location,
          salaryRange: parsed.data.salaryRange,
          videoUrl: parsed.data.videoUrl || undefined,
        }
      : {
          kind: "TEXT" as const,
          body: parsed.data.body,
          videoUrl: parsed.data.videoUrl || undefined,
        };

  const post = await prisma.post.create({
    data: { ...data, authorId: req.user!.id },
    include: { author: { select: authorSelect } },
  });

  res.status(201).json({
    id: post.id,
    kind: post.kind,
    body: post.body,
    title: post.title,
    description: post.description,
    location: post.location,
    salaryRange: post.salaryRange,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: formatAuthor(post.author),
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    appliedByMe: post.kind === "JOB" ? false : undefined,
  });
}

export async function getPost(req: Request, res: Response) {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: req.user!.id }, select: { id: true } },
    },
  });
  if (!post) return res.status(404).json({ error: "Not found" });

  let appliedByMe: boolean | undefined;
  if (post.kind === "JOB") {
    const existing = await prisma.application.findFirst({
      where: { userId: req.user!.id, postId: post.id },
    });
    appliedByMe = !!existing;
  }

  res.json({
    id: post.id,
    kind: post.kind,
    body: post.body,
    title: post.title,
    description: post.description,
    location: post.location,
    salaryRange: post.salaryRange,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: formatAuthor(post.author),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    appliedByMe,
  });
}

export async function deletePost(req: Request, res: Response) {
  const existing = await prisma.post.findFirst({
    where: { id: req.params.id, authorId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}
