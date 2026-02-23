"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultPortfolioContent, navLinks } from "@/data/portfolioData";
import SymbolIcon from "@/components/ui/SymbolIcon";
import {
  deleteAdminChatThreadMessages,
  clearAuthToken,
  deleteAdminChatMessage,
  deleteUserChatThreadMessages,
  deleteUserChatMessage,
  editAdminChatMessage,
  editUserChatMessage,
  getAdminChatMessages,
  getAdminChatThreads,
  getAuthToken,
  getMe,
  getUserChatMessages,
  isAuthApiEnabled,
  reactAdminChatMessage,
  reactUserChatMessage,
  sendAdminChatMessage,
} from "@/lib/authApi";
import { connectRealtime, disconnectRealtime } from "@/lib/realtime";
import {
  getPushReasonHint,
  initPushNotifications,
  requiresIosPwaForPush,
} from "@/lib/pushNotifications";
import { API_BASE_URL } from "@/lib/apiBase";
import { useSmartChatScroll } from "@/hooks/useSmartChatScroll";
import AdminChatView from "@/app/admin/views/AdminChatView";

const navOrder = ["about", "skills", "experience", "projects", "contact"];
const visibleNav = navLinks
  .filter((item) => navOrder.includes(item.id))
  .sort((a, b) => navOrder.indexOf(a.id) - navOrder.indexOf(b.id));

const GUEST_CHAT_KEY = "portfolio_guest_chat_history";
const WELCOME_SESSION_KEY = "portfolio_chat_welcome_shown";

const resolveAssetUrl = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${input}`;
  }
  return input;
};

const normalizeMailHref = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("mailto:")) return input;
  if (input.includes("@")) return `mailto:${input}`;
  return input;
};

const normalizeProfile = (value) => {
  const fallback = defaultPortfolioContent.profile ?? {};
  const social = value?.social ?? {};
  const resumeUrl = resolveAssetUrl(value?.resumeUrl ?? fallback?.resumeUrl ?? "");
  return {
    aboutImageUrl: resolveAssetUrl(value?.aboutImageUrl ?? fallback?.aboutImageUrl ?? ""),
    profileImageUrl: resolveAssetUrl(value?.profileImageUrl ?? fallback?.profileImageUrl ?? ""),
    resumeUrl,
    social: {
      linkedin: String(social?.linkedin ?? fallback?.social?.linkedin ?? ""),
      github: String(social?.github ?? fallback?.social?.github ?? ""),
      telegram: String(social?.telegram ?? fallback?.social?.telegram ?? ""),
      gmail: normalizeMailHref(social?.gmail ?? fallback?.social?.gmail ?? ""),
    },
  };
};

const hasWelcomeShown = (key) => {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(key) === "1";
};

const markWelcomeShown = (key) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, "1");
};

const buildWelcomeMessage = () => ({
  id: `welcome-${Date.now()}`,
  sender: "admin",
  text: "Hi! How can I help you today?",
  createdAt: new Date().toISOString(),
  ephemeral: true,
});

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const getPresenceLabel = (presence) => {
  if (presence?.isOnline) return "Active now";
  if (presence?.lastActiveAt) return `Active ${formatRelativeTime(presence.lastActiveAt)}`;
  return "Offline";
};

const applyReceiptToMessages = (messages, payload) => {
  const ids = Array.isArray(payload?.messageIds) ? payload.messageIds : [];
  if (ids.length === 0) return messages;
  const target = new Set(ids);

  return messages.map((item) => {
    if (!target.has(item.id)) return item;
    return {
      ...item,
      deliveredAt: payload.deliveredAt ?? item.deliveredAt ?? payload.seenAt ?? null,
      seenAt: payload.seenAt ?? item.seenAt ?? null,
    };
  });
};

const getOutgoingStatusText = (item) => {
  if (item?.seenAt) return "";
  if (item?.deliveredAt) return `Delivered ${formatRelativeTime(item.deliveredAt)}`;
  return "Sent";
};

const REPLY_REGEX = /^\[reply:([^:\]]+):([^\]]*)\]\s*/;
const QUICK_EMOJIS = [
  "\u2764\uFE0F",
  "\u{1F44D}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F525}",
  "\u{1F44F}",
  "\u{1F60A}",
];

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const toReplyPreview = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);

const parseMessageText = (rawText) => {
  const text = String(rawText ?? "");
  const match = text.match(REPLY_REGEX);
  if (!match) {
    return {
      body: text,
      reply: null,
    };
  }

  const replyId = safeDecode(match[1]);
  const replyText = safeDecode(match[2]);
  return {
    body: text.replace(REPLY_REGEX, "").trimStart(),
    reply: {
      id: replyId,
      text: replyText,
    },
  };
};

const buildMessageWithReply = ({ body, reply }) => {
  if (!reply?.id || !reply?.text) return body;
  const encodedId = encodeURIComponent(String(reply.id));
  const encodedText = encodeURIComponent(toReplyPreview(reply.text));
  return `[reply:${encodedId}:${encodedText}] ${body}`;
};

const mapApiMessageToPanelMessage = (msg, viewerId = "") => {
  const senderRole = msg?.senderRole === "admin" ? "admin" : "user";
  const senderId = String(msg?.senderId ?? "");
  const senderName =
    msg?.senderName ??
    msg?.sender?.name ??
    (senderRole === "user" ? msg?.user?.name ?? null : null);
  const senderEmail =
    msg?.senderEmail ??
    msg?.sender?.email ??
    (senderRole === "user" ? msg?.user?.email ?? null : null);
  const isOwnAdminMessage = senderRole === "admin" && viewerId && senderId === viewerId;
  return {
    id: msg?.id ?? `${Date.now()}`,
    userId: msg?.userId ?? "",
    sender: senderRole === "user" ? "user" : isOwnAdminMessage ? "you" : "admin",
    senderRole,
    senderId,
    senderName: senderName ?? null,
    senderEmail: senderEmail ?? null,
    text: String(msg?.message ?? ""),
    reaction: msg?.reaction ?? null,
    createdAt: msg?.createdAt ?? new Date().toISOString(),
    deliveredAt: msg?.deliveredAt ?? null,
    seenAt: msg?.seenAt ?? null,
    ephemeral: false,
  };
};

const mapApiThread = (thread) => ({
  userId: String(thread?.userId ?? ""),
  user: thread?.user ?? null,
  message: String(thread?.message ?? ""),
  senderRole: thread?.senderRole ?? "user",
  senderId: String(thread?.senderId ?? ""),
  deliveredAt: thread?.deliveredAt ?? null,
  seenAt: thread?.seenAt ?? null,
  createdAt: thread?.createdAt ?? new Date().toISOString(),
  userPresence: thread?.userPresence ?? null,
});

const formatUnreadCount = (count) => {
  if (!Number.isFinite(count) || count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
};

const mapUserApiMessageToPanelMessage = (msg) => ({
  id: msg?.id ?? `${Date.now()}`,
  sender: msg?.senderRole === "admin" ? "admin" : "you",
  senderRole: msg?.senderRole === "admin" ? "admin" : "user",
  senderId: String(msg?.senderId ?? ""),
  senderName:
    msg?.senderName ??
    msg?.sender?.name ??
    (msg?.senderRole === "user" ? msg?.user?.name ?? null : null),
  senderEmail:
    msg?.senderEmail ??
    msg?.sender?.email ??
    (msg?.senderRole === "user" ? msg?.user?.email ?? null : null),
  text: String(msg?.message ?? ""),
  reaction: msg?.reaction ?? null,
  createdAt: msg?.createdAt ?? new Date().toISOString(),
  deliveredAt: msg?.deliveredAt ?? null,
  seenAt: msg?.seenAt ?? null,
  ephemeral: false,
});

const mapUserApiMessagesToPanel = (items) => {
  const ordered = Array.isArray(items) ? items.slice().reverse() : [];
  const mapped = ordered.map((msg) => mapUserApiMessageToPanelMessage(msg));
  const nextReactions = {};
  mapped.forEach((item) => {
    if (item.reaction) nextReactions[item.id] = item.reaction;
  });
  return { mapped, nextReactions };
};

export default function Header({ profile = defaultPortfolioContent.profile }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingMessageText, setEditingMessageText] = useState("");
  const [chatActionPendingId, setChatActionPendingId] = useState("");
  const [activeActionMessageId, setActiveActionMessageId] = useState("");
  const [openMoreMenuId, setOpenMoreMenuId] = useState("");
  const [openEmojiPickerId, setOpenEmojiPickerId] = useState("");
  const [messageReactions, setMessageReactions] = useState({});
  const [replyTarget, setReplyTarget] = useState(null);
  const [isHoverDevice, setIsHoverDevice] = useState(true);
  const [chatForceScrollTick, setChatForceScrollTick] = useState(0);
  const [adminPresence, setAdminPresence] = useState({
    isOnline: false,
    lastActiveAt: null,
  });
  const [userChatView, setUserChatView] = useState("threads");
  const [adminChatView, setAdminChatView] = useState("threads");
  const [adminThreads, setAdminThreads] = useState([]);
  const [adminPresenceByUser, setAdminPresenceByUser] = useState({});
  const [adminActiveUserId, setAdminActiveUserId] = useState("");
  const [adminThreadsLoading, setAdminThreadsLoading] = useState(false);
  const [adminMessagesLoading, setAdminMessagesLoading] = useState(false);
  const [adminThreadDeletePendingId, setAdminThreadDeletePendingId] = useState("");
  const [userThreadDeletePending, setUserThreadDeletePending] = useState(false);
  const [pushStatus, setPushStatus] = useState("idle");
  const [pushHint, setPushHint] = useState("");
  const [, setRelativeTimeTick] = useState(0);
  const lastSeenEmitRef = useRef("");
  const lastDeliveredEmitRef = useRef("");
  const adminActiveUserIdRef = useRef("");
  const adminChatViewRef = useRef("threads");
  const authUserIdRef = useRef("");
  const isAdmin = authUser?.role === "admin";
  const profileSettings = useMemo(() => normalizeProfile(profile), [profile]);
  const resumeHref = profileSettings.resumeUrl || "#contact";
  const resumeOpensNewTab = Boolean(profileSettings.resumeUrl && !resumeHref.startsWith("#"));
  const profileAvatarUrl = profileSettings.profileImageUrl;

  const nonEphemeralChatMessages = useMemo(
    () => chatMessages.filter((item) => !item.ephemeral),
    [chatMessages]
  );
  const latestUserThreadMessage = useMemo(() => {
    const source = nonEphemeralChatMessages.length ? nonEphemeralChatMessages : chatMessages;
    if (source.length === 0) return null;
    return source[source.length - 1];
  }, [chatMessages, nonEphemeralChatMessages]);
  const latestAdminSenderProfile = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i -= 1) {
      const item = chatMessages[i];
      if (item?.sender !== "admin") continue;
      const email = String(item?.senderEmail ?? "").trim();
      const name = String(item?.senderName ?? "").trim();
      if (!email && !name) continue;
      return {
        name: name || "Admin Support",
        email,
      };
    }
    return null;
  }, [chatMessages]);
  const adminDisplayName = latestAdminSenderProfile?.name || "Admin Support";
  const adminDisplayEmail = latestAdminSenderProfile?.email || "";
  const adminDisplayMeta = adminDisplayEmail
    ? `${adminDisplayEmail} \u00B7 ${getPresenceLabel(adminPresence)}`
    : getPresenceLabel(adminPresence);
  const userThreadPreview = useMemo(() => {
    if (!latestUserThreadMessage) {
      return authUser ? "Start a conversation with admin." : "Login to start chatting.";
    }
    return parseMessageText(latestUserThreadMessage.text).body || "No message";
  }, [authUser, latestUserThreadMessage]);
  const userThreadUnread = useMemo(
    () => nonEphemeralChatMessages.some((item) => item.sender === "admin" && !item.seenAt),
    [nonEphemeralChatMessages]
  );
  const showThreadList = isAdmin ? adminChatView === "threads" : userChatView === "threads";
  const unreadCount = useMemo(() => {
    if (isAdmin) {
      return adminThreads.reduce((total, thread) => {
        if (thread?.senderRole === "user" && !thread?.seenAt) return total + 1;
        return total;
      }, 0);
    }
    return nonEphemeralChatMessages.reduce((total, item) => {
      if (item?.sender === "admin" && !item?.seenAt) return total + 1;
      return total;
    }, 0);
  }, [adminThreads, isAdmin, nonEphemeralChatMessages]);
  const unreadBadgeText = formatUnreadCount(unreadCount);

  const {
    containerRef: chatListRef,
    isPinnedToBottom,
    pendingNewCount,
    jumpToLatest,
    onContainerScroll,
  } = useSmartChatScroll({
    items: chatMessages,
    isOpen: messageOpen,
    forceScrollSignal: chatForceScrollTick,
  });

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!isAuthApiEnabled()) {
        if (active) setAuthUser(null);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        if (active) setAuthUser(null);
        return;
      }

      const meResponse = await getMe(token);
      if (!active) return;
      if (meResponse.ok) {
        setAuthUser(meResponse.data?.user ?? null);
        return;
      }
      clearAuthToken();
      setAuthUser(null);
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setIsHoverDevice(media.matches);
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    adminActiveUserIdRef.current = adminActiveUserId;
    adminChatViewRef.current = adminChatView;
    authUserIdRef.current = authUser?.id ?? "";
  }, [adminActiveUserId, adminChatView, authUser?.id]);

  useEffect(() => {
    if (!isAuthApiEnabled()) return undefined;

    const socket = connectRealtime();
    if (!socket) return undefined;

    const upsertAdminThread = (payload, fallbackUser = null) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      setAdminThreads((prev) => {
        const existingIndex = prev.findIndex((thread) => thread.userId === userId);
        const existing = existingIndex >= 0 ? prev[existingIndex] : null;
        const nextThread = {
          userId,
          user: payload?.user ?? fallbackUser ?? existing?.user ?? null,
          message: String(payload?.message ?? existing?.message ?? ""),
          senderRole: payload?.senderRole ?? existing?.senderRole ?? "user",
          senderId: String(payload?.senderId ?? existing?.senderId ?? ""),
          deliveredAt: payload?.deliveredAt ?? existing?.deliveredAt ?? null,
          seenAt: payload?.seenAt ?? existing?.seenAt ?? null,
          createdAt: payload?.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
          userPresence: existing?.userPresence ?? null,
        };
        if (existingIndex === -1) return [nextThread, ...prev];
        const next = [...prev];
        next.splice(existingIndex, 1);
        return [nextThread, ...next];
      });
    };

    const handleChatMessage = (payload) => {
      if (!payload?.message) return;
      if (isAdmin) {
        const userId = String(payload?.userId ?? "").trim();
        if (!userId) return;
        upsertAdminThread(payload);
        if (adminChatViewRef.current !== "thread" || adminActiveUserIdRef.current !== userId) return;
        setChatMessages((prev) => {
          if (payload?.id && prev.some((item) => item.id === payload.id)) return prev;
          return [...prev, mapApiMessageToPanelMessage(payload, authUserIdRef.current)];
        });
        if (payload?.id) {
          setMessageReactions((prev) => {
            const next = { ...prev };
            if (payload.reaction) {
              next[payload.id] = payload.reaction;
            } else if (Object.prototype.hasOwnProperty.call(next, payload.id)) {
              delete next[payload.id];
            }
            return next;
          });
        }
        return;
      }

      const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
      if (!viewerUserId) return;
      const payloadUserId = String(payload?.userId ?? "").trim();
      if (payloadUserId && payloadUserId !== viewerUserId) return;
      const mapped = mapUserApiMessageToPanelMessage(payload);
      setChatMessages((prev) => {
        if (mapped.id && prev.some((item) => item.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
      if (mapped.sender === "admin" && !payload?.deliveredAt) {
        socket.emit("chat:delivered", {}, () => {});
      }
      if (payload?.id) {
        setMessageReactions((prev) => {
          const next = { ...prev };
          if (payload.reaction) {
            next[payload.id] = payload.reaction;
          } else if (Object.prototype.hasOwnProperty.call(next, payload.id)) {
            delete next[payload.id];
          }
          return next;
        });
      }
    };

    const handleChatReceipt = (payload) => {
      if (isAdmin) {
        const userId = String(payload?.userId ?? "").trim();
        if (!userId) return;
        setAdminThreads((prev) =>
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
        if (userId !== adminActiveUserIdRef.current) return;
        setChatMessages((prev) => applyReceiptToMessages(prev, payload));
        return;
      }
      const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
      if (!viewerUserId) return;
      const payloadUserId = String(payload?.userId ?? "").trim();
      if (payloadUserId && payloadUserId !== viewerUserId) return;
      setChatMessages((prev) => applyReceiptToMessages(prev, payload));
    };

    const handleChatUpdated = (payload) => {
      if (!payload?.id) return;
      if (isAdmin) {
        const userId = String(payload?.userId ?? "").trim();
        if (!userId) return;
        upsertAdminThread(payload);
        if (adminChatViewRef.current !== "thread" || adminActiveUserIdRef.current !== userId) return;
        setChatMessages((prev) =>
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
        setMessageReactions((prev) => {
          const next = { ...prev };
          if (payload.reaction) {
            next[payload.id] = payload.reaction;
          } else if (Object.prototype.hasOwnProperty.call(next, payload.id)) {
            delete next[payload.id];
          }
          return next;
        });
        return;
      }

      const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
      if (!viewerUserId) return;
      const payloadUserId = String(payload?.userId ?? "").trim();
      if (payloadUserId && payloadUserId !== viewerUserId) return;
      setChatMessages((prev) =>
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
      setMessageReactions((prev) => {
        const next = { ...prev };
        if (payload.reaction) {
          next[payload.id] = payload.reaction;
        } else if (Object.prototype.hasOwnProperty.call(next, payload.id)) {
          delete next[payload.id];
        }
        return next;
      });
    };

    const handleChatReaction = (payload) => {
      if (!payload?.id) return;
      if (isAdmin) {
        const userId = String(payload?.userId ?? "").trim();
        if (!userId || adminChatViewRef.current !== "thread" || adminActiveUserIdRef.current !== userId) return;
      } else {
        const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
        if (!viewerUserId) return;
        const payloadUserId = String(payload?.userId ?? "").trim();
        if (payloadUserId && payloadUserId !== viewerUserId) return;
      }
      setMessageReactions((prev) => {
        const next = { ...prev };
        if (payload.reaction) {
          next[payload.id] = payload.reaction;
        } else if (Object.prototype.hasOwnProperty.call(next, payload.id)) {
          delete next[payload.id];
        }
        return next;
      });
      setChatMessages((prev) =>
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
      if (!payload?.id) return;
      if (isAdmin) {
        if (payload.deletedFor && payload.deletedFor !== "admin" && payload.deletedFor !== "both") return;
        const userId = String(payload?.userId ?? "").trim();
        if (!userId || adminChatViewRef.current !== "thread" || adminActiveUserIdRef.current !== userId) return;
        setChatMessages((prev) => prev.filter((item) => item.id !== payload.id));
        setEditingMessageId((current) => (current === payload.id ? "" : current));
        setEditingMessageText("");
        setActiveActionMessageId((current) => (current === payload.id ? "" : current));
        setOpenMoreMenuId((current) => (current === payload.id ? "" : current));
        setOpenEmojiPickerId((current) => (current === payload.id ? "" : current));
        setMessageReactions((prev) => {
          if (!Object.prototype.hasOwnProperty.call(prev, payload.id)) return prev;
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
        setReplyTarget((current) => (current?.id === payload.id ? null : current));
        return;
      }

      if (payload.deletedFor && payload.deletedFor !== "user" && payload.deletedFor !== "both") return;
      const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
      if (!viewerUserId) return;
      const payloadUserId = String(payload?.userId ?? "").trim();
      if (payloadUserId && payloadUserId !== viewerUserId) return;
      setChatMessages((prev) => prev.filter((item) => item.id !== payload.id));
      setEditingMessageId((current) => (current === payload.id ? "" : current));
      setEditingMessageText("");
      setActiveActionMessageId((current) => (current === payload.id ? "" : current));
      setOpenMoreMenuId((current) => (current === payload.id ? "" : current));
      setOpenEmojiPickerId((current) => (current === payload.id ? "" : current));
      setMessageReactions((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, payload.id)) return prev;
        const next = { ...prev };
        delete next[payload.id];
        return next;
      });
      setReplyTarget((current) => (current?.id === payload.id ? null : current));
    };

    const handleAdminPresence = (payload) => {
      if (!payload) return;
      setAdminPresence({
        isOnline: payload.isOnline === true,
        lastActiveAt: payload.lastActiveAt ?? null,
      });
    };

    const handleUserPresence = (payload) => {
      if (!isAdmin) return;
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      const nextPresence = {
        isOnline: payload?.isOnline === true,
        lastActiveAt: payload?.lastActiveAt ?? null,
      };
      setAdminPresenceByUser((prev) => ({
        ...prev,
        [userId]: nextPresence,
      }));
      setAdminThreads((prev) =>
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

    const handleThreadHidden = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;

      if (isAdmin) {
        if (payload.deletedFor && payload.deletedFor !== "admin" && payload.deletedFor !== "both") {
          return;
        }
        setAdminThreads((prev) => prev.filter((thread) => thread.userId !== userId));
        setAdminPresenceByUser((prev) => {
          if (!Object.prototype.hasOwnProperty.call(prev, userId)) return prev;
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        if (adminActiveUserIdRef.current === userId) {
          setAdminChatView("threads");
          setAdminActiveUserId("");
          setChatMessages([]);
          setMessageReactions({});
          setReplyTarget(null);
          setChatInput("");
          setChatError("");
        }
        return;
      }

      if (payload.deletedFor && payload.deletedFor !== "user" && payload.deletedFor !== "both") {
        return;
      }
      const viewerUserId = authUserIdRef.current || String(authUser?.id ?? "");
      if (!viewerUserId) return;
      if (userId !== viewerUserId) return;
      setChatMessages([]);
      setMessageReactions({});
      setReplyTarget(null);
      setChatInput("");
      setChatError("");
      setEditingMessageId("");
      setEditingMessageText("");
      setActiveActionMessageId("");
      setOpenMoreMenuId("");
      setOpenEmojiPickerId("");
      setUserChatView("threads");
      if (!authUser) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(GUEST_CHAT_KEY);
        }
      }
    };

    socket.on("chat:message", handleChatMessage);
    socket.on("chat:receipt", handleChatReceipt);
    socket.on("chat:message_updated", handleChatUpdated);
    socket.on("chat:message_reaction", handleChatReaction);
    socket.on("chat:message_deleted", handleChatDeleted);
    socket.on("presence:user", handleUserPresence);
    socket.on("chat:thread_hidden", handleThreadHidden);
    if (!isAdmin) {
      socket.on("presence:admin", handleAdminPresence);
    }

    return () => {
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:receipt", handleChatReceipt);
      socket.off("chat:message_updated", handleChatUpdated);
      socket.off("chat:message_reaction", handleChatReaction);
      socket.off("chat:message_deleted", handleChatDeleted);
      socket.off("presence:user", handleUserPresence);
      socket.off("chat:thread_hidden", handleThreadHidden);
      if (!isAdmin) {
        socket.off("presence:admin", handleAdminPresence);
      }
    };
  }, [authUser?.id, authUser?.role, isAdmin]);

  useEffect(() => {
    if (!isAuthApiEnabled()) return;
    let cancelled = false;
    const audience = authUser?.role === "admin" ? "admin" : authUser ? "user" : "guest";

    const syncPush = async () => {
      if (requiresIosPwaForPush()) {
        if (!cancelled) {
          setPushStatus("ios_pwa_required");
          setPushHint("iOS requires Add to Home Screen for notifications.");
        }
        return;
      }

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const result = await initPushNotifications({ interactive: false, audience });
        if (cancelled) return;
        if (result.ok) {
          setPushStatus("enabled");
          setPushHint("");
          return;
        }
        setPushStatus("error");
        setPushHint(getPushReasonHint(result.reason));
        return;
      }

      if (!cancelled) {
        setPushStatus("disabled");
        setPushHint("Enable notifications to get message alerts.");
      }
    };

    void syncPush();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (authUser) {
      setChatError("");
    }
  }, [authUser]);

  useEffect(() => {
    if (!messageOpen) return undefined;
    const timer = setInterval(() => {
      setRelativeTimeTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, [messageOpen]);

  useEffect(() => {
    if (messageOpen) return;
    lastSeenEmitRef.current = "";
    lastDeliveredEmitRef.current = "";
    setActiveActionMessageId("");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
    setEditingMessageId("");
    setEditingMessageText("");
    setReplyTarget(null);
    setChatInput("");
    setUserThreadDeletePending(false);
    setUserChatView("threads");
    if (isAdmin) {
      setAdminChatView("threads");
      setAdminActiveUserId("");
      setAdminMessagesLoading(false);
      setChatMessages([]);
      setMessageReactions({});
    }
  }, [isAdmin, messageOpen]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!isAuthApiEnabled()) return;
      if (!authUser) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(GUEST_CHAT_KEY);
        }
        setMessageReactions({});
        const welcomeKey = `${WELCOME_SESSION_KEY}:guest`;
        const shouldShow = !hasWelcomeShown(welcomeKey);
        if (shouldShow) {
          const welcome = buildWelcomeMessage();
          setChatMessages([welcome]);
          markWelcomeShown(welcomeKey);
        } else {
          setChatMessages([]);
        }
        return;
      }

      const token = getAuthToken();
      if (!token) return;

      const response = await getUserChatMessages(token);
      if (!response.ok) return;

      const items = Array.isArray(response.data?.messages) ? response.data.messages : [];
      const { mapped, nextReactions } = mapUserApiMessagesToPanel(items);
      setMessageReactions(nextReactions);
      if (authUser?.role === "admin") {
        setChatMessages([]);
        setMessageReactions({});
        setReplyTarget(null);
        return;
      }
      const welcomeKey = `${WELCOME_SESSION_KEY}:user:${authUser.id ?? "me"}`;
      const shouldShow = !hasWelcomeShown(welcomeKey);
      if (shouldShow) {
        const welcome = buildWelcomeMessage();
        setChatMessages([...mapped, welcome]);
        markWelcomeShown(welcomeKey);
      } else {
        setChatMessages(mapped);
      }
    };

    void loadMessages();
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (!isAuthApiEnabled() || !authUser || isAdmin || !messageOpen) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    const syncUserMessages = async () => {
      const response = await getUserChatMessages(token);
      if (cancelled) return;
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
        }
        return;
      }

      const items = Array.isArray(response.data?.messages) ? response.data.messages : [];
      const { mapped, nextReactions } = mapUserApiMessagesToPanel(items);
      setMessageReactions(nextReactions);
      const welcomeKey = `${WELCOME_SESSION_KEY}:user:${authUser.id ?? "me"}`;
      const shouldShow = !hasWelcomeShown(welcomeKey);
      if (shouldShow) {
        const welcome = buildWelcomeMessage();
        setChatMessages([...mapped, welcome]);
        markWelcomeShown(welcomeKey);
      } else {
        setChatMessages(mapped);
      }
      setChatError("");
    };

    void syncUserMessages();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isAdmin, messageOpen]);

  useEffect(() => {
    if (!isAuthApiEnabled() || !isAdmin || !messageOpen) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    const loadThreads = async () => {
      setAdminChatView("threads");
      setAdminActiveUserId("");
      setChatMessages([]);
      setMessageReactions({});
      setReplyTarget(null);
      setChatInput("");
      setChatError("");
      setAdminThreadsLoading(true);
      const response = await getAdminChatThreads(token);
      if (cancelled) return;
      setAdminThreadsLoading(false);
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        setChatError(response.data?.message || "Failed to load chat threads.");
        return;
      }

      const items = Array.isArray(response.data?.threads) ? response.data.threads : [];
      setAdminThreads(items.map((item) => mapApiThread(item)).filter((item) => item.userId));
      setAdminPresenceByUser((prev) => {
        const next = { ...prev };
        items.forEach((item) => {
          if (!item?.userId || !item?.userPresence) return;
          next[item.userId] = item.userPresence;
        });
        return next;
      });
    };

    void loadThreads();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isAdmin, messageOpen]);

  useEffect(() => {
    if (!isAuthApiEnabled() || !isAdmin || !messageOpen) return;
    if (adminChatView !== "thread" || !adminActiveUserId) return;

    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    const loadThreadMessages = async () => {
      setAdminMessagesLoading(true);
      const response = await getAdminChatMessages({ token, userId: adminActiveUserId });
      if (cancelled) return;
      setAdminMessagesLoading(false);
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        setChatError(response.data?.message || "Failed to load messages.");
        return;
      }

      const items = Array.isArray(response.data?.messages) ? response.data.messages : [];
      const mapped = items
        .slice()
        .reverse()
        .map((item) => mapApiMessageToPanelMessage(item, authUser?.id));
      const nextReactions = {};
      mapped.forEach((item) => {
        if (item.reaction) nextReactions[item.id] = item.reaction;
      });
      setMessageReactions(nextReactions);
      setChatMessages(mapped);
      setChatForceScrollTick((tick) => tick + 1);
      setChatError("");
    };

    void loadThreadMessages();
    return () => {
      cancelled = true;
    };
  }, [adminActiveUserId, adminChatView, authUser?.id, isAdmin, messageOpen]);

  useEffect(() => {
    if (authUser || typeof window === "undefined") return;
    localStorage.removeItem(GUEST_CHAT_KEY);
  }, [authUser]);

  useEffect(() => {
    if (!profileOpen && !messageOpen && !mobileOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMessageOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profileOpen, messageOpen, mobileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") === "1") {
      setMessageOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!messageOpen) return;
    if (!isAdmin) {
      setUserChatView("threads");
    }
    setChatForceScrollTick((tick) => tick + 1);
  }, [isAdmin, messageOpen]);

  useEffect(() => {
    if (!editingMessageId) return;
    const exists = chatMessages.some((item) => item.id === editingMessageId);
    if (exists) return;
    setEditingMessageId("");
    setEditingMessageText("");
    setChatActionPendingId("");
  }, [chatMessages, editingMessageId]);

  useEffect(() => {
    if (!authUser || !messageOpen || !isPinnedToBottom) return;
    const socket = connectRealtime();
    if (!socket) return;

    if (isAdmin) {
      if (adminChatView !== "thread" || !adminActiveUserId) return;
      const latestIncoming = [...chatMessages]
        .reverse()
        .find((item) => item.senderRole === "user" && !item.seenAt);
      if (!latestIncoming?.id) return;
      const seenKey = `${adminActiveUserId}:${latestIncoming.id}`;
      if (lastSeenEmitRef.current === seenKey) return;
      lastSeenEmitRef.current = seenKey;
      socket.emit("chat:admin_seen", { userId: adminActiveUserId }, () => {});
      return;
    }

    if (userChatView !== "thread") return;

    const latestIncoming = [...chatMessages]
      .reverse()
      .find((item) => item.sender === "admin" && !item.seenAt);
    if (!latestIncoming?.id) return;
    if (lastSeenEmitRef.current === latestIncoming.id) return;
    lastSeenEmitRef.current = latestIncoming.id;
    socket.emit("chat:seen", {}, () => {});
  }, [adminActiveUserId, adminChatView, authUser, chatMessages, isAdmin, isPinnedToBottom, messageOpen, userChatView]);

  useEffect(() => {
    if (!authUser || isAdmin || !messageOpen) return;
    if (userChatView !== "thread") return;
    const socket = connectRealtime();
    if (!socket) return;

    const latestUndeliveredIncoming = [...chatMessages]
      .reverse()
      .find((item) => item.sender === "admin" && !item.deliveredAt);
    if (!latestUndeliveredIncoming?.id) return;
    if (lastDeliveredEmitRef.current === latestUndeliveredIncoming.id) return;
    lastDeliveredEmitRef.current = latestUndeliveredIncoming.id;
    socket.emit("chat:delivered", {}, () => {});
  }, [authUser, chatMessages, isAdmin, messageOpen, userChatView]);

  function handleLogout() {
    clearAuthToken();
    disconnectRealtime();
    lastSeenEmitRef.current = "";
    lastDeliveredEmitRef.current = "";
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_CHAT_KEY);
    }
    setAuthUser(null);
    setChatMessages([]);
    setMessageReactions({});
    setUserChatView("threads");
    setAdminChatView("threads");
    setAdminActiveUserId("");
    setEditingMessageId("");
    setEditingMessageText("");
    setChatActionPendingId("");
    setActiveActionMessageId("");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
    setReplyTarget(null);
    setProfileOpen(false);
    setMessageOpen(false);
    setMobileOpen(false);
  }

  const updateAdminThreadPreview = (payload, fallbackUser = null) => {
    const userId = String(payload?.userId ?? "").trim();
    if (!userId) return;
    setAdminThreads((prev) => {
      const existingIndex = prev.findIndex((thread) => thread.userId === userId);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const nextThread = {
        userId,
        user: payload?.user ?? fallbackUser ?? existing?.user ?? null,
        message: String(payload?.message ?? existing?.message ?? ""),
        senderRole: payload?.senderRole ?? existing?.senderRole ?? "user",
        senderId: String(payload?.senderId ?? existing?.senderId ?? ""),
        deliveredAt: payload?.deliveredAt ?? existing?.deliveredAt ?? null,
        seenAt: payload?.seenAt ?? existing?.seenAt ?? null,
        createdAt: payload?.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
        userPresence:
          existing?.userPresence ?? adminPresenceByUser[userId] ?? null,
      };
      if (existingIndex === -1) return [nextThread, ...prev];
      const next = [...prev];
      next.splice(existingIndex, 1);
      return [nextThread, ...next];
    });
  };

  const handleOpenAdminThread = (userId) => {
    if (!userId) return;
    setAdminActiveUserId(userId);
    setAdminChatView("thread");
    setChatMessages([]);
    setMessageReactions({});
    setReplyTarget(null);
    setChatInput("");
    setChatError("");
  };

  const handleOpenUserThread = () => {
    setUserChatView("thread");
    setChatError("");
    setChatForceScrollTick((tick) => tick + 1);
  };

  const handleBackToUserThreads = () => {
    setUserChatView("threads");
    setChatInput("");
    setChatError("");
    setEditingMessageId("");
    setEditingMessageText("");
    setActiveActionMessageId("");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
    setReplyTarget(null);
  };

  const handleBackToAdminThreads = () => {
    setAdminChatView("threads");
    setAdminActiveUserId("");
    setChatMessages([]);
    setMessageReactions({});
    setReplyTarget(null);
    setChatInput("");
    setChatError("");
    setEditingMessageId("");
    setEditingMessageText("");
    setActiveActionMessageId("");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
  };

  const handleDeleteAdminThreadMessages = async (userId) => {
    if (!isAdmin) return;
    const targetUserId = String(userId ?? "").trim();
    if (!targetUserId) return;

    const token = getAuthToken();
    if (!token) {
      setChatError("Please login again.");
      return;
    }

    setAdminThreadDeletePendingId(targetUserId);
    const response = await deleteAdminChatThreadMessages({
      token,
      userId: targetUserId,
    });
    setAdminThreadDeletePendingId("");

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setChatError(response.data?.message || "Failed to clear conversation.");
      return;
    }

    setAdminThreads((prev) => prev.filter((thread) => thread.userId !== targetUserId));
    setAdminPresenceByUser((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, targetUserId)) return prev;
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });

    if (adminActiveUserId === targetUserId) {
      handleBackToAdminThreads();
    }
    setChatError("");
  };

  const handleDeleteUserThreadMessages = async () => {
    if (!authUser) {
      setChatMessages([]);
      setMessageReactions({});
      setReplyTarget(null);
      setChatInput("");
      setChatError("");
      setEditingMessageId("");
      setEditingMessageText("");
      setActiveActionMessageId("");
      setOpenMoreMenuId("");
      setOpenEmojiPickerId("");
      setUserChatView("threads");
      if (typeof window !== "undefined") {
        localStorage.removeItem(GUEST_CHAT_KEY);
      }
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setChatError("Please login again.");
      return;
    }

    setUserThreadDeletePending(true);
    const response = await deleteUserChatThreadMessages(token);
    setUserThreadDeletePending(false);

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setChatError(response.data?.message || "Failed to clear conversation.");
      return;
    }

    setChatMessages([]);
    setMessageReactions({});
    setReplyTarget(null);
    setChatInput("");
    setChatError("");
    setEditingMessageId("");
    setEditingMessageText("");
    setActiveActionMessageId("");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
    setUserChatView("threads");
  };

  const handleChatSend = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    if (!authUser) {
      setChatError("Login required to send messages.");
      return;
    }

    if (isAdmin) {
      if (!adminActiveUserId || adminChatView !== "thread") {
        setChatError("Select a user thread first.");
        return;
      }
      const token = getAuthToken();
      if (!token) {
        setChatError("Please login again.");
        return;
      }
      setChatActionPendingId(`send:${adminActiveUserId}`);
      const messagePayload = buildMessageWithReply({
        body: trimmed,
        reply: replyTarget,
      });
      const response = await sendAdminChatMessage({
        token,
        userId: adminActiveUserId,
        message: messagePayload,
      });
      setChatActionPendingId("");
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        setChatError(response.data?.message || "Failed to send message.");
        return;
      }
      if (response.data) {
        const mapped = mapApiMessageToPanelMessage(response.data, authUser?.id);
        setChatMessages((prev) =>
          mapped.id && prev.some((item) => item.id === mapped.id)
            ? prev
            : [...prev, mapped]
        );
        if (mapped.reaction && mapped.id) {
          setMessageReactions((prev) => ({
            ...prev,
            [mapped.id]: mapped.reaction,
          }));
        }
        updateAdminThreadPreview(response.data);
      }
      setChatInput("");
      setReplyTarget(null);
      setActiveActionMessageId("");
      setOpenEmojiPickerId("");
      setOpenMoreMenuId("");
      setChatError("");
      setChatForceScrollTick((tick) => tick + 1);
      return;
    }

    setChatError("");
    const messagePayload = buildMessageWithReply({
      body: trimmed,
      reply: replyTarget,
    });
    const socket = connectRealtime();
    if (!socket) {
      setChatError("Realtime connection unavailable.");
      return;
    }
    socket.emit("chat:send", { message: messagePayload }, (ack) => {
      if (!ack?.ok) {
        setChatError(ack?.error || "Failed to send message.");
        return;
      }
      if (ack?.data) {
        const mapped = mapUserApiMessageToPanelMessage(ack.data);
        setChatMessages((prev) => {
          if (mapped.id && prev.some((item) => item.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
        if (mapped.id) {
          setMessageReactions((prev) => {
            if (mapped.reaction) {
              return {
                ...prev,
                [mapped.id]: mapped.reaction,
              };
            }
            if (!Object.prototype.hasOwnProperty.call(prev, mapped.id)) {
              return prev;
            }
            const next = { ...prev };
            delete next[mapped.id];
            return next;
          });
        }
      }
      setChatInput("");
      setReplyTarget(null);
      setActiveActionMessageId("");
      setOpenEmojiPickerId("");
      setOpenMoreMenuId("");
      setChatForceScrollTick((tick) => tick + 1);
    });
  };

  const handleStartEditMessage = (item) => {
    if (!item?.id || item?.sender !== "you") return;
    if (!authUser) return;
    const parsed = parseMessageText(item.text);
    setChatError("");
    setEditingMessageId(item.id);
    setEditingMessageText(parsed.body ?? "");
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
    setChatForceScrollTick((tick) => tick + 1);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId("");
    setEditingMessageText("");
    setChatError("");
  };

  const handleSaveEditMessage = async (messageId) => {
    if (!authUser || !messageId) return;
    const token = getAuthToken();
    if (!token) {
      setChatError("Please login again.");
      return;
    }
    if (isAdmin && !adminActiveUserId) {
      setChatError("Select a user thread first.");
      return;
    }

    const trimmed = editingMessageText.trim();
    if (!trimmed) {
      setChatError("Message cannot be empty.");
      return;
    }

    const current = chatMessages.find((item) => item.id === messageId);
    if (!current) {
      setEditingMessageId("");
      setEditingMessageText("");
      return;
    }
    const parsedCurrent = parseMessageText(current.text);
    if (trimmed === parsedCurrent.body) {
      setEditingMessageId("");
      setEditingMessageText("");
      return;
    }
    const nextMessageValue = buildMessageWithReply({
      body: trimmed,
      reply: parsedCurrent.reply,
    });

    setChatActionPendingId(messageId);
    const response = isAdmin
      ? await editAdminChatMessage({
          token,
          userId: adminActiveUserId,
          messageId,
          message: nextMessageValue,
        })
      : await editUserChatMessage({
          token,
          messageId,
          message: nextMessageValue,
        });
    setChatActionPendingId("");

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setChatError(response.data?.message || "Failed to edit message.");
      return;
    }

    setChatMessages((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              text: response.data?.message ?? nextMessageValue,
              deliveredAt: response.data?.deliveredAt ?? item.deliveredAt ?? null,
              seenAt: response.data?.seenAt ?? item.seenAt ?? null,
            }
          : item
      )
    );
    if (isAdmin && response.data) {
      updateAdminThreadPreview(response.data);
    }
    setEditingMessageId("");
    setEditingMessageText("");
    setChatError("");
    setChatForceScrollTick((tick) => tick + 1);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!authUser || !messageId) return;
    const token = getAuthToken();
    if (!token) {
      setChatError("Please login again.");
      return;
    }
    if (isAdmin && !adminActiveUserId) {
      setChatError("Select a user thread first.");
      return;
    }

    setChatActionPendingId(messageId);
    const response = isAdmin
      ? await deleteAdminChatMessage({
          token,
          userId: adminActiveUserId,
          messageId,
        })
      : await deleteUserChatMessage({
          token,
          messageId,
        });
    setChatActionPendingId("");

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setChatError(response.data?.message || "Failed to delete message.");
      return;
    }

    setChatMessages((prev) => prev.filter((item) => item.id !== messageId));
    if (editingMessageId === messageId) {
      setEditingMessageId("");
      setEditingMessageText("");
    }
    if (activeActionMessageId === messageId) {
      setActiveActionMessageId("");
    }
    if (openMoreMenuId === messageId) {
      setOpenMoreMenuId("");
    }
    if (openEmojiPickerId === messageId) {
      setOpenEmojiPickerId("");
    }
    setMessageReactions((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, messageId)) return prev;
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
    if (replyTarget?.id === messageId) {
      setReplyTarget(null);
    }
    setChatError("");
    setChatForceScrollTick((tick) => tick + 1);
  };

  const handleMessageTap = (messageId) => {
    if (isHoverDevice) return;
    setActiveActionMessageId((current) => (current === messageId ? "" : messageId));
    setOpenMoreMenuId("");
    setOpenEmojiPickerId("");
  };

  const handleToggleMoreMenu = (messageId) => {
    setOpenMoreMenuId((current) => (current === messageId ? "" : messageId));
    setOpenEmojiPickerId("");
    if (!isHoverDevice) {
      setActiveActionMessageId(messageId);
    }
  };

  const handleToggleEmojiPicker = (messageId) => {
    setOpenEmojiPickerId((current) => (current === messageId ? "" : messageId));
    setOpenMoreMenuId("");
    if (!isHoverDevice) {
      setActiveActionMessageId(messageId);
    }
  };

  const handlePickEmoji = async (messageId, emoji) => {
    if (!authUser) {
      setChatError("Login required to react.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setChatError("Please login again.");
      return;
    }
    if (isAdmin && !adminActiveUserId) {
      setChatError("Select a user thread first.");
      return;
    }

    const current = messageReactions[messageId] ?? "";
    const nextEmoji = current === emoji ? "" : emoji;

    setChatActionPendingId(messageId);
    const response = isAdmin
      ? await reactAdminChatMessage({
          token,
          userId: adminActiveUserId,
          messageId,
          emoji: nextEmoji,
        })
      : await reactUserChatMessage({
          token,
          messageId,
          emoji: nextEmoji,
        });
    setChatActionPendingId("");

    if (!response.ok) {
      if (response.status === 401) {
        handleLogout();
        return;
      }
      setChatError(response.data?.message || "Failed to react.");
      return;
    }

    setMessageReactions((prev) => {
      const next = { ...prev };
      if (response.data?.reaction) {
        next[messageId] = response.data.reaction;
      } else if (Object.prototype.hasOwnProperty.call(next, messageId)) {
        delete next[messageId];
      }
      return next;
    });
    setChatMessages((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              reaction: response.data?.reaction ?? null,
            }
          : item
      )
    );
    setOpenEmojiPickerId("");
    if (!isHoverDevice) {
      setActiveActionMessageId(messageId);
    }
  };

  const handleReplyToMessage = (item) => {
    if (!item?.id) return;
    const parsed = parseMessageText(item.text);
    setReplyTarget({
      id: item.id,
      text: toReplyPreview(parsed.body),
      sender: item.sender,
    });
    setOpenEmojiPickerId("");
    setOpenMoreMenuId("");
    if (!isHoverDevice) {
      setActiveActionMessageId("");
    }
  };

  const handleEnableNotifications = async () => {
    setPushStatus("loading");
    setPushHint("");
    const audience = authUser?.role === "admin" ? "admin" : authUser ? "user" : "guest";
    const result = await initPushNotifications({ interactive: true, audience });
    if (result.ok) {
      setPushStatus("enabled");
      setPushHint("Device notifications enabled.");
      return;
    }

    if (result.reason === "denied") {
      setPushStatus("denied");
      setPushHint("Notification permission denied. Allow it in browser settings.");
      return;
    }
    if (result.reason === "ios_pwa_required") {
      setPushStatus("ios_pwa_required");
      setPushHint("iOS requires Add to Home Screen for notifications.");
      return;
    }
    setPushStatus("error");
    setPushHint(getPushReasonHint(result.reason));
  };

  const activeAdminThread = useMemo(
    () => adminThreads.find((thread) => thread.userId === adminActiveUserId) ?? null,
    [adminActiveUserId, adminThreads]
  );
  const activeAdminPresence =
    (adminActiveUserId && adminPresenceByUser[adminActiveUserId]) ||
    activeAdminThread?.userPresence ||
    null;
  const latestOutgoingIndex = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i -= 1) {
      if (chatMessages[i]?.sender === "you") return i;
    }
    return -1;
  }, [chatMessages]);
  const latestSeenOutgoingIndex = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i -= 1) {
      if (chatMessages[i]?.sender === "you" && chatMessages[i]?.seenAt) return i;
    }
    return -1;
  }, [chatMessages]);
  const showSeparateSeenRow =
    latestOutgoingIndex >= 0 &&
    latestSeenOutgoingIndex >= 0 &&
    latestSeenOutgoingIndex !== latestOutgoingIndex &&
    !chatMessages[latestOutgoingIndex]?.seenAt;
  const getOutgoingStatusMeta = (item, index) => {
    const showForLatest = index === latestOutgoingIndex;
    const showForSeenFallback = showSeparateSeenRow && index === latestSeenOutgoingIndex;
    if (!showForLatest && !showForSeenFallback) {
      return { show: false, seenDot: false, text: "" };
    }
    const seenDot = showForSeenFallback || Boolean(item?.seenAt);
    return {
      show: true,
      seenDot,
      text: seenDot ? "" : getOutgoingStatusText(item),
    };
  };

  return (
    <header className="glass-nav fixed left-0 right-0 top-0 z-50 px-4 py-3 transition-all duration-300 md:px-10">
      <div className="layout-container mx-auto flex max-w-[1200px] items-center justify-between">
        <a href="#home" className="flex items-center gap-3 text-white">
          <div className="relative flex size-10 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-lg bg-[#00f0ff]/20 [transform:rotate(3deg)]" />
            <div className="absolute inset-0 rounded-lg border border-[#00f0ff]/50 [transform:rotate(-3deg)]" />
            <SymbolIcon
              name="terminal"
              className="relative z-10 h-7 w-7 text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              strokeWidth={2.2}
            />
          </div>
          <h2 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-bold leading-tight tracking-[-0.015em] text-transparent">
            Dev<span className="text-[#00f0ff]">Portfolio</span>
          </h2>
        </a>

        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center gap-6">
            {visibleNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm font-medium text-slate-300 transition-all hover:text-[#00f0ff] hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMessageOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center text-[#00f0ff] transition-all hover:text-white"
              aria-label="Open messages"
              aria-expanded={messageOpen}
            >
              <SymbolIcon name="message" className="h-5 w-5" strokeWidth={2.2} />
            </button>
            {unreadBadgeText ? (
              <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]">
                {unreadBadgeText}
              </span>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setMessageOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center text-[#00f0ff] transition-all hover:text-white"
              aria-label="Open profile"
              aria-expanded={profileOpen}
            >
              <SymbolIcon name="person" className="h-5 w-5" strokeWidth={2.2} />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-xl border border-white/10 bg-[#0a0a12] p-4 text-slate-100 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Profile</h3>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="text-slate-400 transition-colors hover:text-white"
                    aria-label="Close profile panel"
                  >
                    <SymbolIcon name="close" className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d1222] p-3">
                  {profileAvatarUrl ? (
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-[#00f0ff]/35 bg-[#0a0a12]">
                      <img src={profileAvatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[#00f0ff]">
                      <SymbolIcon name="person" className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {authUser?.name || "Alex Developer"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {authUser?.email || "admin@example.com"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {authUser ? (
                    isAdmin ? (
                      <>
                        <a href="/admin" className="btn-secondary text-center text-xs">
                          Admin Panel
                        </a>
                        <button type="button" onClick={handleLogout} className="btn-primary text-xs">
                          Logout
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={handleLogout} className="btn-primary text-xs">
                        Logout
                      </button>
                    )
                  ) : (
                    <>
                      <a href="/login" className="btn-secondary text-center text-xs">
                        Login
                      </a>
                      <a href="/login?mode=register" className="btn-primary text-center text-xs">
                        Register
                      </a>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <a
            href={resumeHref}
            target={resumeOpensNewTab ? "_blank" : undefined}
            rel={resumeOpensNewTab ? "noreferrer" : undefined}
            className="group relative flex h-9 items-center justify-center overflow-hidden rounded-lg border border-[#00f0ff]/50 bg-transparent px-4 text-sm font-bold leading-none text-[#00f0ff] transition-all hover:bg-[#00f0ff]/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <span className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              <span>Resume</span>
              <SymbolIcon name="download" className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => {
              setMessageOpen((prev) => !prev);
              setMobileOpen(false);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center text-[#00f0ff] transition-all hover:text-white"
            aria-label="Open messages"
            aria-expanded={messageOpen}
          >
            <SymbolIcon name="message" className="h-5 w-5" strokeWidth={2.2} />
            {unreadBadgeText ? (
              <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]">
                {unreadBadgeText}
              </span>
            ) : null}
          </button>
          <button
            className="text-white"
            type="button"
            aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => {
              setMobileOpen((prev) => !prev);
              setProfileOpen(false);
              setMessageOpen(false);
            }}
          >
            <SymbolIcon name={mobileOpen ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
      </div>

            {messageOpen ? (
        isAdmin ? (
        <div className="fixed bottom-6 right-4 z-[70] flex h-[520px] w-[calc(100%-32px)] max-w-[360px] flex-col rounded-xl border border-white/10 bg-[#0a0a12] text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
          <AdminChatView
            enabled={Boolean(authUser?.id) && isAuthApiEnabled()}
            token={getAuthToken()}
            currentAdminId={authUser?.id ?? ""}
            onUnauthorized={handleLogout}
            isReadOnly={false}
            mode="header"
            isOpen={messageOpen}
            resetToListOnOpen
            onClose={() => setMessageOpen(false)}
            pushStatus={pushStatus}
            pushHint={pushHint}
            onEnableNotifications={handleEnableNotifications}
          />
        </div>
      ) : (
        <div className="fixed bottom-6 right-4 z-[70] flex h-[520px] w-[calc(100%-32px)] max-w-[360px] flex-col rounded-xl border border-white/10 bg-[#0a0a12] text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {(isAdmin && adminChatView === "thread") || (!isAdmin && userChatView === "thread") ? (
                <button
                  type="button"
                  onClick={isAdmin ? handleBackToAdminThreads : handleBackToUserThreads}
                  className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-[#00f0ff]/50 hover:text-[#00f0ff]"
                  aria-label="Back to message list"
                >
                  <SymbolIcon name="arrow_back" className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[#00f0ff]">
                  <SymbolIcon name="message" className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                {isAdmin && adminChatView === "thread" ? (
                  <>
                    <p className="truncate text-sm font-semibold text-white">
                      {activeAdminThread?.user?.name || activeAdminThread?.user?.email || "Conversation"}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {activeAdminThread?.user?.email || getPresenceLabel(activeAdminPresence)}
                      {activeAdminThread?.user?.email ? ` \u00B7 ${getPresenceLabel(activeAdminPresence)}` : ""}
                    </p>
                  </>
                ) : isAdmin ? (
                  <>
                    <p className="text-sm font-semibold text-white">Messenger</p>
                    <p className="text-[11px] text-slate-400">User conversations</p>
                  </>
                ) : userChatView === "thread" ? (
                  <>
                    <p className="text-sm font-semibold text-white">{adminDisplayName}</p>
                    <p className="text-[11px] text-slate-400">{adminDisplayMeta}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-white">Messenger</p>
                    <p className="text-[11px] text-slate-400">Admin conversation</p>
                  </>
                )}
              </div>
            </div>
            <div className="mr-2">
              {pushStatus !== "enabled" ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={pushStatus === "loading"}
                  className="rounded-md border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pushStatus === "loading" ? "Enabling..." : "Enable Notifications"}
                </button>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                  Alerts On
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMessageOpen(false)}
              className="text-slate-400 transition-colors hover:text-white"
              aria-label="Close chat"
            >
              <SymbolIcon name="close" className="h-4 w-4" />
            </button>
          </div>
          {pushHint ? (
            <div className="border-b border-white/10 px-4 py-2 text-[11px] text-slate-400">
              {pushHint}
            </div>
          ) : null}

          <div className="relative flex-1 min-h-0">
            {showThreadList ? (
              <div className="h-full overflow-y-auto px-2 py-2">
                {isAdmin ? (
                  adminThreadsLoading ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Loading conversations...
                    </div>
                  ) : adminThreads.length === 0 ? (
                    <div className="m-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-slate-500">
                      No chat messages yet.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {adminThreads.map((thread) => {
                        const preview = parseMessageText(thread.message).body || "No message";
                        const unread = thread.senderRole === "user" && !thread.seenAt;
                        return (
                          <div
                            key={thread.userId}
                            className="relative"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenAdminThread(thread.userId)}
                              className="w-full rounded-xl border border-[#00f0ff]/25 bg-[#0c1323]/65 px-3 py-2.5 pr-11 text-left transition-colors hover:border-[#00f0ff]/50 hover:bg-[#0f1930]"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[11px] font-semibold text-[#8cecff]">
                                  {(
                                    thread.user?.name ||
                                    thread.user?.email ||
                                    thread.userId
                                  )
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-semibold text-white">
                                      {thread.user?.name || thread.user?.email || thread.userId}
                                    </p>
                                    <div className="flex flex-shrink-0 items-center gap-1">
                                      {unread ? <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" /> : null}
                                      <span className="text-[10px] text-slate-400">
                                        {formatRelativeTime(thread.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="truncate text-[11px] text-slate-400">{thread.user?.email || ""}</p>
                                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                                    {thread.senderRole === "admin"
                                      ? thread.senderId && thread.senderId === authUser?.id
                                        ? "You: "
                                        : "Admin: "
                                      : ""}
                                    {preview}
                                  </p>
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteAdminThreadMessages(thread.userId);
                              }}
                              disabled={adminThreadDeletePendingId === thread.userId}
                              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#0a0f1d]/80 text-slate-400 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Delete all messages from admin view"
                              title="Delete all messages for admin"
                            >
                              <SymbolIcon
                                name="delete"
                                className="h-3.5 w-3.5"
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleOpenUserThread}
                        className="w-full rounded-xl border border-[#00f0ff]/25 bg-[#0c1323]/65 px-3 py-2.5 pr-11 text-left transition-colors hover:border-[#00f0ff]/50 hover:bg-[#0f1930]"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[11px] font-semibold text-[#8cecff]">
                            AD
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-white">{adminDisplayName}</p>
                              <div className="flex flex-shrink-0 items-center gap-1">
                                {userThreadUnread ? <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" /> : null}
                                <span className="text-[10px] text-slate-400">
                                  {latestUserThreadMessage?.createdAt
                                    ? formatRelativeTime(latestUserThreadMessage.createdAt)
                                    : ""}
                                </span>
                              </div>
                            </div>
                            <p className="truncate text-[11px] text-slate-400">{adminDisplayMeta}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                              {latestUserThreadMessage?.sender === "you" ? "You: " : ""}
                              {userThreadPreview}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteUserThreadMessages();
                        }}
                        disabled={userThreadDeletePending}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#0a0f1d]/80 text-slate-400 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete all messages from your view"
                        title="Delete all messages for you"
                      >
                        <SymbolIcon name="delete" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {chatError ? (
                  <p className="px-2 pt-2 text-[11px] text-red-300">{chatError}</p>
                ) : null}
              </div>
            ) : (
              <>
                <div
                  ref={chatListRef}
                  onScroll={onContainerScroll}
                  className="h-full space-y-3 overflow-y-auto px-4 py-3 pb-14 text-xs"
                >
                  {adminMessagesLoading ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Loading messages...
                    </div>
                  ) : (
                    chatMessages.map((item, index) => {
                const parsed = parseMessageText(item.text);
                const reaction = messageReactions[item.id] ?? "";
                const actionVisibleClass =
                  isHoverDevice
                    ? "opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
                    : activeActionMessageId === item.id
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none";
                const isIncomingMessage = isAdmin
                  ? item.senderRole === "user" || (item.senderRole === "admin" && item.sender !== "you")
                  : item.sender !== "you";

                if (isIncomingMessage) {
                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-2"
                      onClick={() => handleMessageTap(item.id)}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300">
                        {isAdmin
                          ? (
                              (activeAdminThread?.user?.name ||
                                activeAdminThread?.user?.email ||
                                "U")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "U"
                            )
                          : "AD"}
                      </div>
                      <div className="max-w-[84%]">
                        <div className="flex items-end gap-1">
                          <div className="rounded-lg bg-[#0d1222] px-3 py-2 text-slate-200">
                            {parsed.reply ? (
                              <div className="mb-1 rounded border-l-2 border-slate-400/50 bg-white/5 px-2 py-1 text-[10px] text-slate-400">
                                {parsed.reply.text}
                              </div>
                            ) : null}
                            <p className="whitespace-pre-wrap break-words">{parsed.body}</p>
                          </div>
                          <div className={`relative flex items-center gap-1 ${actionVisibleClass}`}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleReplyToMessage(item);
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label="Reply"
                              title="Reply"
                            >
                              <SymbolIcon name="rotate_right" className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleToggleEmojiPicker(item.id);
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded text-[14px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                              aria-label="React"
                              title="React"
                            >
                              {"\u{1F60A}"}
                            </button>
                            {openEmojiPickerId === item.id ? (
                              <div className="absolute bottom-full right-0 z-30 mb-1 flex w-10 flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#0a0a12] px-1 py-2 shadow-[0_0_16px_rgba(0,0,0,0.35)]">
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                    key={`${item.id}-${emoji}`}
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handlePickEmoji(item.id, emoji);
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-transform hover:scale-110 hover:bg-white/10"
                                    aria-label={`React ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {reaction ? <div className="ml-2 mt-1 text-base leading-none">{reaction}</div> : null}
                      </div>
                    </div>
                  );
                }

                const status = getOutgoingStatusMeta(item, index);
                return (
                  <div
                    key={item.id}
                    className="group relative flex justify-end"
                    onClick={() => handleMessageTap(item.id)}
                  >
                    <div className="max-w-[88%]">
                      {editingMessageId === item.id ? (
                        <div className="rounded-lg border border-[#00f0ff]/35 bg-[#0d1222] px-3 py-2">
                          <input
                            value={editingMessageText}
                            onChange={(event) => setEditingMessageText(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleSaveEditMessage(item.id);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                handleCancelEditMessage();
                              }
                            }}
                            className="w-full bg-transparent text-xs text-[#00f0ff] outline-none placeholder:text-slate-500"
                            placeholder="Edit message..."
                          />
                          <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={handleCancelEditMessage}
                              disabled={chatActionPendingId === item.id}
                              className="rounded border border-white/20 px-2 py-0.5 text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveEditMessage(item.id)}
                              disabled={chatActionPendingId === item.id}
                              className="rounded border border-[#00f0ff]/40 bg-[#00f0ff]/15 px-2 py-0.5 text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {chatActionPendingId === item.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end justify-end gap-1">
                            <div className={`relative flex items-center gap-1 ${actionVisibleClass}`}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleMoreMenu(item.id);
                                }}
                                disabled={chatActionPendingId === item.id}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="More options"
                                title="More options"
                              >
                                <SymbolIcon name="more_vert" className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleReplyToMessage(item);
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label="Reply"
                                title="Reply"
                              >
                                <SymbolIcon name="rotate_right" className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleEmojiPicker(item.id);
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[14px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label="React"
                                title="React"
                              >
                                {"\u{1F60A}"}
                              </button>
                              {openMoreMenuId === item.id ? (
                                <div className="absolute bottom-full left-0 z-20 mb-1 w-28 rounded-md border border-white/10 bg-[#0a0a12] p-1 shadow-[0_0_16px_rgba(0,0,0,0.35)]">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleStartEditMessage(item);
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-slate-200 transition-colors hover:bg-white/10"
                                  >
                                    <SymbolIcon name="edit" className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeleteMessage(item.id);
                                    }}
                                    disabled={chatActionPendingId === item.id}
                                    className="mt-0.5 flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-red-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <SymbolIcon name="delete" className="h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                              {openEmojiPickerId === item.id ? (
                                <div className="absolute bottom-full left-0 z-30 mb-1 flex w-10 flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#0a0a12] px-1 py-2 shadow-[0_0_16px_rgba(0,0,0,0.35)]">
                                  {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                      key={`${item.id}-${emoji}`}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void handlePickEmoji(item.id, emoji);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-transform hover:scale-110 hover:bg-white/10"
                                      aria-label={`React ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div className="rounded-lg bg-[#00f0ff]/15 px-3 py-2 text-[#00f0ff]">
                              {parsed.reply ? (
                                <div className="mb-1 rounded border-l-2 border-[#00f0ff]/50 bg-[#00f0ff]/10 px-2 py-1 text-[10px] text-[#8cecff]">
                                  {parsed.reply.text}
                                </div>
                              ) : null}
                              <p className="whitespace-pre-wrap break-words">{parsed.body}</p>
                            </div>
                            {status.show ? (
                              status.seenDot ? (
                                <span
                                  className="mb-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300"
                                  aria-label="Seen"
                                  title={item.seenAt ? `Seen ${formatRelativeTime(item.seenAt)}` : "Seen"}
                                />
                              ) : (
                                <span className="mb-1 text-[10px] text-slate-400">{status.text}</span>
                              )
                            ) : null}
                          </div>
                          {reaction ? (
                            <div className="mt-1 flex justify-end pr-2 text-base leading-none">{reaction}</div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                );
                    })
                  )}
                </div>

                {!isPinnedToBottom && pendingNewCount > 0 ? (
                  <button
                    type="button"
                    onClick={jumpToLatest}
                    className="absolute bottom-3 right-3 rounded-md border border-[#00f0ff]/50 bg-[#00f0ff]/15 px-3 py-1 text-[11px] font-semibold text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-colors hover:bg-[#00f0ff]/25"
                    aria-label="Jump to latest messages"
                  >
                    Jump to latest ({pendingNewCount} new)
                  </button>
                ) : null}
              </>
            )}
          </div>

          {showThreadList ? null : (
            <div className="border-t border-white/10 px-4 py-3">
            {replyTarget ? (
              <div className="mb-2 flex items-center justify-between rounded-md border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7fe9f7]">
                    Replying to{" "}
                    {replyTarget.sender === "you"
                      ? "yourself"
                      : isAdmin
                        ? replyTarget.sender === "admin"
                          ? "admin"
                          : "user"
                        : "admin"}
                  </p>
                  <p className="truncate text-[11px] text-slate-300">{replyTarget.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Cancel reply"
                >
                  <SymbolIcon name="close" className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1222] px-3 py-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleChatSend();
                  }
                }}
                className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                placeholder={isAdmin ? "Type a reply..." : "Type a message..."}
              />
              <button
                type="button"
                onClick={() => void handleChatSend()}
                disabled={
                  (isAdmin && chatActionPendingId.startsWith("send:")) ||
                  (isAdmin && !adminActiveUserId)
                }
                className="text-[#00f0ff] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SymbolIcon name="send" className="h-4 w-4" />
              </button>
            </div>
            {chatError ? <p className="mt-2 text-[11px] text-red-300">{chatError}</p> : null}
            </div>
          )}
        </div>
      )
      ) : null}
      {mobileOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div
            id="mobile-nav"
            className="fixed left-4 right-4 top-[72px] z-50 rounded-2xl border border-white/10 bg-[#0a0a12] p-5 text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Navigation</p>
                <p className="text-sm font-semibold text-white">Explore Sections</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 transition-colors hover:text-white"
                aria-label="Close menu"
              >
                <SymbolIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {visibleNav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-[#00f0ff]/40 hover:text-[#00f0ff]"
                >
                  <span>{item.label}</span>
                  <SymbolIcon name="arrow_forward" className="h-4 w-4" />
                </a>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-[#0d1222] p-4">
              <div className="flex items-center gap-3">
                {profileAvatarUrl ? (
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-[#00f0ff]/35 bg-[#0a0a12]">
                    <img src={profileAvatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[#00f0ff]">
                    <SymbolIcon name="person" className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">
                    {authUser?.name || "Alex Developer"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {authUser?.email || "admin@example.com"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {authUser ? (
                  isAdmin ? (
                    <>
                      <a
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="btn-secondary text-center text-xs"
                      >
                        Admin Panel
                      </a>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="btn-primary text-xs"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn-primary text-xs"
                    >
                      Logout
                    </button>
                  )
                ) : (
                  <>
                    <a
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary text-center text-xs"
                    >
                      Login
                    </a>
                    <a
                      href="/login?mode=register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary text-center text-xs"
                    >
                      Register
                    </a>
                  </>
                )}
              </div>
            </div>

            <a
              href={resumeHref}
              target={resumeOpensNewTab ? "_blank" : undefined}
              rel={resumeOpensNewTab ? "noreferrer" : undefined}
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-4 py-3 text-sm font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20"
            >
              Resume
              <SymbolIcon name="download" className="h-4 w-4" />
            </a>
          </div>
        </div>
      ) : null}

    </header>
  );
}



