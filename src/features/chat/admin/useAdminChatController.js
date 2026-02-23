"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteAdminChatMessage,
  deleteAdminChatThreadMessages,
  editAdminChatMessage,
  getAdminChatMessages,
  getAdminChatThreads,
  reactAdminChatMessage,
  sendAdminChatMessage,
} from "@/lib/authApi";
import { connectRealtime } from "@/lib/realtime";
import {
  applyReceiptToMessages,
  mapAdminMessage,
  mapAdminMessages,
  mapAdminThread,
  upsertAdminThread,
} from "./mappers";

export const useAdminChatController = ({
  enabled = false,
  token = "",
  currentAdminId = "",
  onUnauthorized,
  isOpen = true,
  resetToListOnOpen = false,
}) => {
  const [chatView, setChatView] = useState("threads");
  const [threads, setThreads] = useState([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [presenceByUser, setPresenceByUser] = useState({});
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendPending, setSendPending] = useState(false);
  const [threadDeletePendingId, setThreadDeletePendingId] = useState("");
  const [forceScrollTick, setForceScrollTick] = useState(0);
  const [error, setError] = useState("");

  const activeUserIdRef = useRef("");
  const chatViewRef = useRef("threads");
  const onUnauthorizedRef = useRef(onUnauthorized);
  const wasOpenRef = useRef(false);
  const lastDeliveredEmitRef = useRef("");

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
    chatViewRef.current = chatView;
    onUnauthorizedRef.current = onUnauthorized;
  }, [activeUserId, chatView, onUnauthorized]);

  const handleUnauthorized = useCallback(() => {
    if (typeof onUnauthorizedRef.current === "function") {
      onUnauthorizedRef.current();
    }
  }, []);

  const openList = useCallback(() => {
    setChatView("threads");
    setActiveUserId("");
    setMessages([]);
    setError("");
  }, []);

  const openThread = useCallback((userId) => {
    const nextUserId = String(userId ?? "").trim();
    if (!nextUserId) return;
    setChatView("thread");
    setActiveUserId(nextUserId);
    setMessages([]);
    setError("");
  }, []);

  const loadThreads = useCallback(
    async ({ resetSelection = false } = {}) => {
      if (!enabled || !token) return;
      if (resetSelection) {
        setChatView("threads");
        setActiveUserId("");
        setMessages([]);
      }
      setThreadsLoading(true);
      const response = await getAdminChatThreads(token);
      setThreadsLoading(false);
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        setError(response.data?.message || "Failed to load chat threads.");
        return;
      }

      const items = Array.isArray(response.data?.threads) ? response.data.threads : [];
      const mapped = items.map((item) => mapAdminThread(item)).filter((item) => item.userId);
      setThreads(mapped);
      setPresenceByUser((prev) => {
        const next = { ...prev };
        mapped.forEach((thread) => {
          if (!thread.userId) return;
          if (thread.userPresence) {
            next[thread.userId] = thread.userPresence;
          } else if (!Object.prototype.hasOwnProperty.call(next, thread.userId)) {
            next[thread.userId] = null;
          }
        });
        return next;
      });
      if (!resetSelection && mapped.length > 0 && !activeUserIdRef.current) {
        setActiveUserId(mapped[0].userId);
        setChatView("thread");
      }
      setError("");
    },
    [enabled, handleUnauthorized, token]
  );

  const loadMessages = useCallback(
    async (userId) => {
      const targetUserId = String(userId ?? "").trim();
      if (!enabled || !token || !targetUserId) return;
      setMessagesLoading(true);
      const response = await getAdminChatMessages({ token, userId: targetUserId });
      setMessagesLoading(false);
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }
        setError(response.data?.message || "Failed to load messages.");
        return;
      }

      const items = Array.isArray(response.data?.messages) ? response.data.messages : [];
      setMessages(mapAdminMessages(items));
      setForceScrollTick((tick) => tick + 1);
      setError("");
    },
    [enabled, handleUnauthorized, token]
  );

  useEffect(() => {
    if (!enabled || !token) return;
    void loadThreads();
  }, [enabled, loadThreads, token]);

  useEffect(() => {
    if (!enabled) return;
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (justOpened && resetToListOnOpen) {
      void loadThreads({ resetSelection: true });
      return;
    }
    void loadThreads();
  }, [enabled, isOpen, loadThreads, resetToListOnOpen]);

  useEffect(() => {
    if (!enabled || !token) return;
    if (chatView !== "thread" || !activeUserId) return;
    void loadMessages(activeUserId);
  }, [activeUserId, chatView, enabled, loadMessages, token]);

  useEffect(() => {
    if (!enabled) return;
    if (chatView !== "thread" || !activeUserId) return;
    const latestUndeliveredIncoming = [...messages]
      .reverse()
      .find((item) => item.senderRole === "user" && !item.deliveredAt);
    if (!latestUndeliveredIncoming?.id) return;
    const key = `${activeUserId}:${latestUndeliveredIncoming.id}`;
    if (lastDeliveredEmitRef.current === key) return;
    lastDeliveredEmitRef.current = key;
    const socket = connectRealtime();
    if (!socket) return;
    socket.emit("chat:admin_delivered", { userId: activeUserId }, () => {});
  }, [activeUserId, chatView, enabled, messages]);

  useEffect(() => {
    if (!enabled || !token) return undefined;

    const socket = connectRealtime();
    if (!socket) return undefined;

    const handleChatMessage = (payload) => {
      if (!payload?.userId || !payload?.message) return;
      setThreads((prev) => upsertAdminThread(prev, payload));
      if (payload?.senderRole === "user" && !payload?.deliveredAt) {
        socket.emit("chat:admin_delivered", { userId: payload.userId }, () => {});
      }
      if (chatViewRef.current !== "thread" || activeUserIdRef.current !== payload.userId) return;
      const mapped = mapAdminMessage(payload);
      setMessages((prev) => {
        if (mapped.id && prev.some((item) => item.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
      setForceScrollTick((tick) => tick + 1);
    };

    const handleChatReceipt = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      setThreads((prev) =>
        prev.map((thread) =>
          thread.userId === userId
            ? {
                ...thread,
                deliveredAt: payload?.deliveredAt ?? thread.deliveredAt ?? payload?.seenAt ?? null,
                seenAt: payload?.seenAt ?? thread.seenAt ?? null,
              }
            : thread
        )
      );
      if (chatViewRef.current !== "thread" || activeUserIdRef.current !== userId) return;
      setMessages((prev) => applyReceiptToMessages(prev, payload));
    };

    const handleChatUpdated = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId || !payload?.id) return;
      setThreads((prev) => upsertAdminThread(prev, payload));
      if (chatViewRef.current !== "thread" || activeUserIdRef.current !== userId) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                text: payload.message ?? item.text,
                reaction: payload.reaction ?? item.reaction ?? null,
                deliveredAt: payload.deliveredAt ?? item.deliveredAt ?? null,
                seenAt: payload.seenAt ?? item.seenAt ?? null,
              }
            : item
        )
      );
    };

    const handleChatReaction = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId || !payload?.id) return;
      if (chatViewRef.current !== "thread" || activeUserIdRef.current !== userId) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                reaction: payload.reaction ?? null,
              }
            : item
        )
      );
    };

    const handleChatDeleted = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId || !payload?.id) return;
      if (payload.deletedFor && payload.deletedFor !== "admin" && payload.deletedFor !== "both") return;
      if (chatViewRef.current !== "thread" || activeUserIdRef.current !== userId) return;
      setMessages((prev) => prev.filter((item) => item.id !== payload.id));
    };

    const handleThreadHidden = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      if (payload.deletedFor && payload.deletedFor !== "admin" && payload.deletedFor !== "both") return;
      setThreads((prev) => prev.filter((thread) => thread.userId !== userId));
      setPresenceByUser((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, userId)) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      if (activeUserIdRef.current === userId) {
        setChatView("threads");
        setActiveUserId("");
        setMessages([]);
      }
    };

    const handleUserPresence = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      const nextPresence = {
        isOnline: payload?.isOnline === true,
        lastActiveAt: payload?.lastActiveAt ?? null,
      };
      setPresenceByUser((prev) => ({
        ...prev,
        [userId]: nextPresence,
      }));
      setThreads((prev) =>
        prev.map((thread) =>
          thread.userId === userId
            ? {
                ...thread,
                userPresence: nextPresence,
              }
            : thread
        )
      );
    };

    socket.on("chat:message", handleChatMessage);
    socket.on("chat:receipt", handleChatReceipt);
    socket.on("chat:message_updated", handleChatUpdated);
    socket.on("chat:message_reaction", handleChatReaction);
    socket.on("chat:message_deleted", handleChatDeleted);
    socket.on("chat:thread_hidden", handleThreadHidden);
    socket.on("presence:user", handleUserPresence);

    return () => {
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:receipt", handleChatReceipt);
      socket.off("chat:message_updated", handleChatUpdated);
      socket.off("chat:message_reaction", handleChatReaction);
      socket.off("chat:message_deleted", handleChatDeleted);
      socket.off("chat:thread_hidden", handleThreadHidden);
      socket.off("presence:user", handleUserPresence);
    };
  }, [enabled, token]);

  const sendMessage = useCallback(
    async (userId, message) => {
      const targetUserId = String(userId ?? "").trim();
      const payloadMessage = String(message ?? "").trim();
      if (!enabled || !token || !targetUserId || !payloadMessage) {
        return { ok: false, message: "Message cannot be empty." };
      }

      setSendPending(true);
      const response = await sendAdminChatMessage({
        token,
        userId: targetUserId,
        message: payloadMessage,
      });
      setSendPending(false);

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return { ok: false, message: "Session expired." };
        }
        return { ok: false, message: response.data?.message || "Failed to send message." };
      }

      if (response.data) {
        const mapped = mapAdminMessage(response.data);
        setMessages((prev) =>
          mapped.id && prev.some((item) => item.id === mapped.id) ? prev : [...prev, mapped]
        );
        setThreads((prev) => upsertAdminThread(prev, response.data));
        setForceScrollTick((tick) => tick + 1);
      }
      setError("");
      return { ok: true };
    },
    [enabled, handleUnauthorized, token]
  );

  const editMessage = useCallback(
    async (userId, messageId, message) => {
      const targetUserId = String(userId ?? "").trim();
      const targetMessageId = String(messageId ?? "").trim();
      if (!enabled || !token || !targetUserId || !targetMessageId) {
        return { ok: false, message: "Message not found." };
      }

      const response = await editAdminChatMessage({
        token,
        userId: targetUserId,
        messageId: targetMessageId,
        message,
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return { ok: false, message: "Session expired." };
        }
        return { ok: false, message: response.data?.message || "Failed to edit message." };
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === targetMessageId
            ? {
                ...item,
                text: response.data?.message ?? item.text,
                reaction: response.data?.reaction ?? item.reaction ?? null,
                deliveredAt: response.data?.deliveredAt ?? item.deliveredAt ?? null,
                seenAt: response.data?.seenAt ?? item.seenAt ?? null,
              }
            : item
        )
      );
      if (response.data) {
        setThreads((prev) => upsertAdminThread(prev, response.data));
      }
      setError("");
      return { ok: true };
    },
    [enabled, handleUnauthorized, token]
  );

  const deleteMessage = useCallback(
    async (userId, messageId) => {
      const targetUserId = String(userId ?? "").trim();
      const targetMessageId = String(messageId ?? "").trim();
      if (!enabled || !token || !targetUserId || !targetMessageId) {
        return { ok: false, message: "Message not found." };
      }

      const response = await deleteAdminChatMessage({
        token,
        userId: targetUserId,
        messageId: targetMessageId,
      });
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return { ok: false, message: "Session expired." };
        }
        return { ok: false, message: response.data?.message || "Failed to delete message." };
      }

      setMessages((prev) => prev.filter((item) => item.id !== targetMessageId));
      setError("");
      return { ok: true };
    },
    [enabled, handleUnauthorized, token]
  );

  const reactMessage = useCallback(
    async (userId, messageId, emoji) => {
      const targetUserId = String(userId ?? "").trim();
      const targetMessageId = String(messageId ?? "").trim();
      if (!enabled || !token || !targetUserId || !targetMessageId) {
        return { ok: false, message: "Message not found." };
      }

      const response = await reactAdminChatMessage({
        token,
        userId: targetUserId,
        messageId: targetMessageId,
        emoji,
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return { ok: false, message: "Session expired." };
        }
        return { ok: false, message: response.data?.message || "Failed to react." };
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === targetMessageId
            ? {
                ...item,
                reaction: response.data?.reaction ?? null,
              }
            : item
        )
      );
      setError("");
      return { ok: true, reaction: response.data?.reaction ?? null };
    },
    [enabled, handleUnauthorized, token]
  );

  const deleteThreadMessages = useCallback(
    async (userId) => {
      const targetUserId = String(userId ?? "").trim();
      if (!enabled || !token || !targetUserId) {
        return { ok: false, message: "Conversation not found." };
      }
      setThreadDeletePendingId(targetUserId);
      const response = await deleteAdminChatThreadMessages({
        token,
        userId: targetUserId,
      });
      setThreadDeletePendingId("");
      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
          return { ok: false, message: "Session expired." };
        }
        return { ok: false, message: response.data?.message || "Failed to clear conversation." };
      }
      setThreads((prev) => prev.filter((thread) => thread.userId !== targetUserId));
      setPresenceByUser((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, targetUserId)) return prev;
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
      if (activeUserIdRef.current === targetUserId) {
        openList();
      }
      setError("");
      return { ok: true };
    },
    [enabled, handleUnauthorized, openList, token]
  );

  const markSeen = useCallback((userId) => {
    const targetUserId = String(userId ?? "").trim();
    if (!targetUserId) return;
    const socket = connectRealtime();
    if (!socket) return;
    socket.emit("chat:admin_seen", { userId: targetUserId }, () => {});
  }, []);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.userId === activeUserId) ?? null,
    [activeUserId, threads]
  );
  const activePresence =
    (activeUserId && presenceByUser[activeUserId]) || activeThread?.userPresence || null;
  const unreadCount = useMemo(
    () =>
      threads.reduce((count, thread) => {
        if (thread?.senderRole === "user" && !thread?.seenAt) return count + 1;
        return count;
      }, 0),
    [threads]
  );

  return {
    chatView,
    threads,
    activeUserId,
    messages,
    presenceByUser,
    activeThread,
    activePresence,
    unreadCount,
    threadsLoading,
    messagesLoading,
    sendPending,
    threadDeletePendingId,
    forceScrollTick,
    error,
    setError,
    openList,
    openThread,
    goBackToList: openList,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    deleteThreadMessages,
    markSeen,
  };
};
