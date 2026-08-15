import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

const PARTICIPANT_SELECT = { id: true, name: true, username: true, avatarUrl: true } as const;

// Conversation rows always store the pair sorted (userAId < userBId) so a
// unique (userAId, userBId) constraint identifies the pair regardless of who
// started it.
function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

type Participant = { id: string; name: string | null; username: string; avatarUrl: string | null };

function otherParticipant(
  conversation: { userAId: string; userA: Participant; userBId: string; userB: Participant },
  viewerId: string
): Participant {
  return conversation.userAId === viewerId ? conversation.userB : conversation.userA;
}

function myLastReadAt(conversation: { userAId: string; userALastReadAt: Date | null; userBLastReadAt: Date | null }, viewerId: string) {
  return conversation.userAId === viewerId ? conversation.userALastReadAt : conversation.userBLastReadAt;
}

conversationsRouter.get("/", async (req, res) => {
  const viewerId = req.user!.id;
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: viewerId }, { userBId: viewerId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      userA: { select: PARTICIPANT_SELECT },
      userB: { select: PARTICIPANT_SELECT },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const results = await Promise.all(
    conversations.map(async (c) => {
      const lastReadAt = myLastReadAt(c, viewerId);
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: viewerId },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
      return {
        id: c.id,
        otherUser: otherParticipant(c, viewerId),
        lastMessage: c.messages[0] ?? null,
        unreadCount,
        updatedAt: c.updatedAt,
      };
    })
  );

  res.json(results);
});

conversationsRouter.post("/", async (req, res) => {
  const viewerId = req.user!.id;
  const targetId = req.body?.userId;

  if (typeof targetId !== "string" || !targetId) {
    return res.status(400).json({ error: "userId is required" });
  }
  if (targetId === viewerId) {
    return res.status(400).json({ error: "You can't message yourself" });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: PARTICIPANT_SELECT });
  if (!target) return res.status(404).json({ error: "Not found" });

  const [userAId, userBId] = sortedPair(viewerId, targetId);
  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    include: { userA: { select: PARTICIPANT_SELECT }, userB: { select: PARTICIPANT_SELECT } },
  });

  res.status(201).json({
    id: conversation.id,
    otherUser: otherParticipant(conversation, viewerId),
    updatedAt: conversation.updatedAt,
  });
});

async function loadConversationForParticipant(conversationId: string, viewerId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  if (conversation.userAId !== viewerId && conversation.userBId !== viewerId) return undefined;
  return conversation;
}

conversationsRouter.get("/:id/messages", async (req, res) => {
  const viewerId = req.user!.id;
  const conversation = await loadConversationForParticipant(req.params.id, viewerId);
  if (conversation === null) return res.status(404).json({ error: "Not found" });
  if (conversation === undefined) return res.status(403).json({ error: "Forbidden" });

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  const isUserA = conversation.userAId === viewerId;
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: isUserA ? { userALastReadAt: new Date() } : { userBLastReadAt: new Date() },
  });

  res.json(messages);
});

conversationsRouter.post("/:id/messages", async (req, res) => {
  const viewerId = req.user!.id;
  const conversation = await loadConversationForParticipant(req.params.id, viewerId);
  if (conversation === null) return res.status(404).json({ error: "Not found" });
  if (conversation === undefined) return res.status(403).json({ error: "Forbidden" });

  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body) return res.status(400).json({ error: "Message body is required" });
  if (body.length > 4000) return res.status(400).json({ error: "Message is too long" });

  const isUserA = conversation.userAId === viewerId;
  const now = new Date();
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId: conversation.id, senderId: viewerId, body },
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: isUserA ? { updatedAt: now, userALastReadAt: now } : { updatedAt: now, userBLastReadAt: now },
    });
    return created;
  });

  res.status(201).json({ id: message.id, senderId: message.senderId, body: message.body, createdAt: message.createdAt });
});
