import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const FOLLOW_LIST_SELECT = { id: true, name: true, username: true, avatarUrl: true, role: true } as const;

usersRouter.get("/me/following", async (req, res) => {
  const viewerId = req.user!.id;
  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    orderBy: { createdAt: "desc" },
    include: { following: { select: FOLLOW_LIST_SELECT } },
  });
  res.json(rows.map((r) => ({ ...r.following, isFollowedByMe: true })));
});

usersRouter.get("/me/followers", async (req, res) => {
  const viewerId = req.user!.id;
  const rows = await prisma.follow.findMany({
    where: { followingId: viewerId },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: FOLLOW_LIST_SELECT } },
  });
  const followedByMe = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: rows.map((r) => r.follower.id) } },
    select: { followingId: true },
  });
  const followedSet = new Set(followedByMe.map((f) => f.followingId));
  res.json(rows.map((r) => ({ ...r.follower, isFollowedByMe: followedSet.has(r.follower.id) })));
});

usersRouter.post("/:id/follow", async (req, res) => {
  const targetId = req.params.id;
  const viewerId = req.user!.id;

  if (targetId === viewerId) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return res.status(404).json({ error: "Not found" });

  const existing = await prisma.follow.findFirst({
    where: { followerId: viewerId, followingId: targetId },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: viewerId, followingId: targetId } });
    await prisma.notification.create({
      data: { recipientId: targetId, actorId: viewerId, type: "FOLLOW" },
    });
  }

  const followerCount = await prisma.follow.count({ where: { followingId: targetId } });
  res.json({ following: !existing, followerCount });
});
