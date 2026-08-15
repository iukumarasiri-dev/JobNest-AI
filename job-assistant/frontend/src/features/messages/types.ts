export type ConversationParticipant = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

export type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  otherUser: ConversationParticipant;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
};
