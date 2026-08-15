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
  res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: n.actor,
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
