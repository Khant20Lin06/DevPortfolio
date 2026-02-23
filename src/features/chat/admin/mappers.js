export const QUICK_EMOJIS = [
  "\u2764\uFE0F",
  "\u{1F44D}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F525}",
  "\u{1F44F}",
  "\u{1F60A}",
];

const REPLY_REGEX = /^\[reply:([^:\]]+):([^\]]*)\]\s*/;

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

export const toReplyPreview = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);

export const parseMessageText = (rawText) => {
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

export const buildMessageWithReply = ({ body, reply }) => {
  if (!reply?.id || !reply?.text) return body;
  const encodedId = encodeURIComponent(String(reply.id));
  const encodedText = encodeURIComponent(toReplyPreview(reply.text));
  return `[reply:${encodedId}:${encodedText}] ${body}`;
};

export const formatRelativeTime = (value) => {
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

export const formatAbsoluteTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return String(value);
  }
};

export const getPresenceLabel = (presence) => {
  if (presence?.isOnline) return "Active now";
  if (presence?.lastActiveAt) return `Active ${formatRelativeTime(presence.lastActiveAt)}`;
  return "Offline";
};

export const getOutgoingStatusText = (item) => {
  if (item?.seenAt) return "";
  if (item?.deliveredAt) return `Delivered ${formatRelativeTime(item.deliveredAt)}`;
  return "Sent";
};

export const mapAdminThread = (thread) => ({
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

export const mapAdminMessage = (msg) => ({
  id: String(msg?.id ?? `${Date.now()}`),
  userId: String(msg?.userId ?? ""),
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
});

export const mapAdminMessages = (items) =>
  (Array.isArray(items) ? items.slice().reverse() : []).map((item) => mapAdminMessage(item));

export const buildReactionMap = (items) => {
  const map = {};
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item?.reaction && item?.id) {
      map[item.id] = item.reaction;
    }
  });
  return map;
};

export const applyReceiptToMessages = (messages, payload) => {
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

export const upsertAdminThread = (threads, payload, fallbackUser = null) => {
  const userId = String(payload?.userId ?? "").trim();
  if (!userId) return Array.isArray(threads) ? threads : [];

  const source = Array.isArray(threads) ? threads : [];
  const existingIndex = source.findIndex((thread) => thread.userId === userId);
  const existing = existingIndex >= 0 ? source[existingIndex] : null;
  const nextThread = {
    userId,
    user: payload?.user ?? fallbackUser ?? existing?.user ?? null,
    message: String(payload?.message ?? existing?.message ?? ""),
    senderRole: payload?.senderRole ?? existing?.senderRole ?? "user",
    senderId: String(payload?.senderId ?? existing?.senderId ?? ""),
    deliveredAt: payload?.deliveredAt ?? existing?.deliveredAt ?? null,
    seenAt: payload?.seenAt ?? existing?.seenAt ?? null,
    createdAt: payload?.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    userPresence: payload?.userPresence ?? existing?.userPresence ?? null,
  };

  if (existingIndex === -1) return [nextThread, ...source];
  const next = [...source];
  next.splice(existingIndex, 1);
  return [nextThread, ...next];
};

