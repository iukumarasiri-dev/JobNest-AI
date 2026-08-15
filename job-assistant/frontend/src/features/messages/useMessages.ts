import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ConversationSummary, Message } from "./types";

const POLL_INTERVAL_MS = 5000;

export function useMessages(initialConversationId?: string | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");

  // Polling/focus refreshes need the latest activeId without re-subscribing
  // the interval/listener on every conversation switch.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await apiFetch("/api/conversations"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load conversations.");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const data = await apiFetch(`/api/conversations/${conversationId}/messages`);
      if (activeIdRef.current === conversationId) setMessages(data);
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // No websockets in this app — poll for new messages/conversations, and
  // refresh immediately when the tab regains focus.
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }, POLL_INTERVAL_MS);
    function handleFocus() {
      loadConversations();
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadConversations, loadMessages]);

  function selectConversation(id: string) {
    setActiveId(id);
  }

  async function sendMessage(body: string) {
    const trimmed = body.trim();
    if (!activeId || !trimmed) return;
    setSending(true);
    setActionError("");
    try {
      const message: Message = await apiFetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed }),
      });
      setMessages((prev) => [...prev, message]);
      loadConversations();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return {
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
  };
}
