import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const recipientId = req.user!.id;
  const notifications = await prisma.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  const actorIds = [...new Set(notifications.map((n) => n.actorId))];
  const followedByMe = await prisma.follow.findMany({
    where: { followerId: recipientId, followingId: { in: actorIds } },
    select: { followingId: true },
  });
  const followedSet = new Set(followedByMe.map((f) => f.followingId));

  res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: { ...n.actor, isFollowedByMe: followedSet.has(n.actor.id) },
      createdAt: n.createdAt,
      read: n.readAt !== null,
    }))
  );
});

notificationsRouter.post("/read-all", async (req, res) => {
  const recipientId = req.user!.id;
  await prisma.notification.updateMany({
    where: { recipientId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
});
