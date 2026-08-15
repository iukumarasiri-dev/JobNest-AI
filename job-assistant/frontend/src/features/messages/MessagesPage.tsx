"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/formatDate";
import { useMessages } from "./useMessages";

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("c");
  const {
    conversations,
    conversationsLoading,
    loadError,
    activeId,
    messages,
    messagesLoading,
    sending,
    actionError,
    selectConversation,
    sendMessage,
  } = useMessages(initialConversationId);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    await sendMessage(body);
  }

  if (conversationsLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="border border-border rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <div className="border border-border rounded-lg overflow-y-auto md:col-span-1">
        {conversations.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">
            No conversations yet — start one from someone&apos;s profile.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectConversation(c.id)}
            className={`flex w-full items-center gap-2.5 border-b border-border p-3 text-left transition-colors ${
              activeId === c.id ? "bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <Avatar src={c.otherUser.avatarUrl} name={c.otherUser.name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{c.otherUser.name || c.otherUser.username}</p>
                {c.unreadCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {c.unreadCount}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {c.lastMessage ? c.lastMessage.body : "No messages yet"}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col border border-border rounded-lg md:col-span-2">
        {!activeConversation ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-border p-3">
              <Avatar src={activeConversation.otherUser.avatarUrl} name={activeConversation.otherUser.name} size={32} />
              <div className="min-w-0">
                <Link
                  href={`/profile/${activeConversation.otherUser.username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {activeConversation.otherUser.name || activeConversation.otherUser.username}
                </Link>
                <p className="text-xs text-muted-foreground">@{activeConversation.otherUser.username}</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {messagesLoading && messages.length === 0 && (
                <p className="text-xs text-muted-foreground">Loading…</p>
              )}
              {messages.map((m) => {
                const mine = m.senderId !== activeConversation.otherUser.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatRelativeTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {actionError && <p className="px-3 pb-1 text-xs text-destructive">{actionError}</p>}

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}
