import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

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
  }

  const followerCount = await prisma.follow.count({ where: { followingId: targetId } });
  res.json({ following: !existing, followerCount });
});
