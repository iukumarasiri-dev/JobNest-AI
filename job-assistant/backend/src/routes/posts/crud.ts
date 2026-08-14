import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { createPostSchema } from "./schemas.js";

const authorSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  role: true,
  company: { select: { name: true } },
} as const;

function formatAuthor(
  author: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
    role: string;
    company: { name: string } | null;
  },
  isFollowedByMe: boolean
) {
  return {
    id: author.id,
    name: author.name,
    username: author.username,
    avatarUrl: author.avatarUrl,
    role: author.role,
    companyName: author.company?.name ?? null,
    isFollowedByMe,
  };
}

async function fetchAndShapePosts(where: Record<string, unknown>, viewerId: string) {
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: viewerId }, select: { id: true } },
      savedBy: { where: { userId: viewerId }, select: { id: true } },
    },
  });

  const jobPostIds = posts.filter((p) => p.kind === "JOB").map((p) => p.id);
  const applied = jobPostIds.length
    ? await prisma.application.findMany({
        where: { userId: viewerId, postId: { in: jobPostIds } },
        select: { postId: true },
      })
    : [];
  const appliedPostIds = new Set(applied.map((a) => a.postId));

  const authorIds = [...new Set(posts.map((p) => p.author.id))];
  const follows = authorIds.length
    ? await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: authorIds } },
        select: { followingId: true },
      })
    : [];
  const followedAuthorIds = new Set(follows.map((f) => f.followingId));

  return posts.map((p) => ({
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
    author: formatAuthor(p.author, followedAuthorIds.has(p.author.id)),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
    savedByMe: p.savedBy.length > 0,
    appliedByMe: p.kind === "JOB" ? appliedPostIds.has(p.id) : undefined,
  }));
}

export async function listPosts(req: Request, res: Response) {
  res.json(await fetchAndShapePosts({}, req.user!.id));
}

export async function listMyPosts(req: Request, res: Response) {
  res.json(await fetchAndShapePosts({ authorId: req.user!.id }, req.user!.id));
}

export async function listSavedPosts(req: Request, res: Response) {
  const saved = await prisma.savedPost.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    select: { postId: true },
  });
  const postIds = saved.map((s) => s.postId);
  if (postIds.length === 0) return res.json([]);

  const shaped = await fetchAndShapePosts({ id: { in: postIds } }, req.user!.id);
  const savedOrder = new Map(postIds.map((id, i) => [id, i]));
  shaped.sort((a, b) => (savedOrder.get(a.id) ?? 0) - (savedOrder.get(b.id) ?? 0));
  res.json(shaped);
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

  const post = await prisma.post.create({ data: { ...data, authorId: req.user!.id } });
  const [shaped] = await fetchAndShapePosts({ id: post.id }, req.user!.id);
  res.status(201).json(shaped);
}

export async function getPost(req: Request, res: Response) {
  const [shaped] = await fetchAndShapePosts({ id: req.params.id }, req.user!.id);
  if (!shaped) return res.status(404).json({ error: "Not found" });
  res.json(shaped);
}

export async function deletePost(req: Request, res: Response) {
  const existing = await prisma.post.findFirst({
    where: { id: req.params.id, authorId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}
