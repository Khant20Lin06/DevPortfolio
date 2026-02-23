"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { useSmartChatScroll } from "@/hooks/useSmartChatScroll";
import {
  QUICK_EMOJIS,
  buildMessageWithReply,
  formatAbsoluteTime,
  formatRelativeTime,
  getOutgoingStatusText,
  getPresenceLabel,
  parseMessageText,
  toReplyPreview,
} from "./mappers";

const initials = (value) =>
  String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

export default function AdminMessengerPanel({
  controller,
  currentAdminId = "",
  isReadOnly = false,
  mode = "adminPage",
  onClose,
  pushStatus = "",
  pushHint = "",
  onEnableNotifications,
}) {
  const {
    chatView,
    threads,
    activeUserId,
    activeThread,
    activePresence,
    messages,
    threadsLoading,
    messagesLoading,
    sendPending,
    threadDeletePendingId,
    forceScrollTick,
    error,
    setError,
    openThread,
    goBackToList,
    sendMessage,
    editMessage,
    deleteMessage,
    reactMessage,
    deleteThreadMessages,
    markSeen,
  } = controller;

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [localError, setLocalError] = useState("");
  const [activeActionId, setActiveActionId] = useState("");
  const [moreMenuId, setMoreMenuId] = useState("");
  const [emojiPickerId, setEmojiPickerId] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [reactions, setReactions] = useState({});
  const [isHoverDevice, setIsHoverDevice] = useState(true);
  const [, setRelativeTimeTick] = useState(0);
  const seenEmitRef = useRef("");

  const isHeaderMode = mode === "header";
  const isThreadView = chatView === "thread";
  const panelError = localError || error || "";

  const latestOutgoingIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.senderRole === "admin") return i;
    }
    return -1;
  }, [messages]);

  const latestSeenOutgoingIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.senderRole === "admin" && messages[i]?.seenAt) return i;
    }
    return -1;
  }, [messages]);

  const showSeparateSeen =
    latestOutgoingIndex >= 0 &&
    latestSeenOutgoingIndex >= 0 &&
    latestSeenOutgoingIndex !== latestOutgoingIndex &&
    !messages[latestOutgoingIndex]?.seenAt;

  const {
    containerRef,
    isPinnedToBottom,
    pendingNewCount,
    jumpToLatest,
    onContainerScroll,
  } = useSmartChatScroll({
    items: messages,
    isOpen: true,
    forceScrollSignal: forceScrollTick,
  });

  const setCombinedError = (value) => {
    setLocalError(value);
    if (typeof setError === "function") {
      setError(value);
    }
  };

  const clearCombinedError = () => {
    setLocalError("");
    if (typeof setError === "function") {
      setError("");
    }
  };

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
    const timer = setInterval(() => {
      setRelativeTimeTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDraft("");
    setEditingId("");
    setEditingText("");
    setPendingId("");
    setLocalError("");
    setActiveActionId("");
    setMoreMenuId("");
    setEmojiPickerId("");
    setReplyTarget(null);
    setReactions({});
    seenEmitRef.current = "";
  }, [activeUserId, chatView]);

  useEffect(() => {
    const next = {};
    messages.forEach((item) => {
      if (item?.reaction) {
        next[item.id] = item.reaction;
      }
    });
    setReactions(next);
  }, [messages]);

  useEffect(() => {
    if (!isThreadView || !activeUserId || !isPinnedToBottom) return;
    const latestIncoming = [...messages]
      .reverse()
      .find((item) => item.senderRole === "user" && !item.seenAt);
    if (!latestIncoming?.id) return;
    const key = `${activeUserId}:${latestIncoming.id}`;
    if (seenEmitRef.current === key) return;
    seenEmitRef.current = key;
    markSeen(activeUserId);
  }, [activeUserId, isPinnedToBottom, isThreadView, markSeen, messages]);

  const getStatusMeta = (item, index) => {
    const showLatest = index === latestOutgoingIndex;
    const showSeenFallback = showSeparateSeen && index === latestSeenOutgoingIndex;
    if (!showLatest && !showSeenFallback) return { show: false, seenDot: false, text: "" };
    const seenDot = showSeenFallback || Boolean(item?.seenAt);
    return { show: true, seenDot, text: seenDot ? "" : getOutgoingStatusText(item) };
  };

  const actionVisibleClass = (messageId) =>
    isHoverDevice
      ? "opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
      : activeActionId === messageId
        ? "opacity-100"
        : "opacity-0 pointer-events-none";

  const handleTap = (messageId) => {
    if (isHoverDevice) return;
    setActiveActionId((current) => (current === messageId ? "" : messageId));
    setMoreMenuId("");
    setEmojiPickerId("");
  };

  const handleToggleEmojiPicker = (messageId) => {
    setEmojiPickerId((current) => (current === messageId ? "" : messageId));
    setMoreMenuId("");
    if (!isHoverDevice) setActiveActionId(messageId);
  };

  const handlePickEmoji = async (messageId, emoji) => {
    const current = reactions[messageId] ?? "";
    const nextEmoji = current === emoji ? "" : emoji;
    setPendingId(messageId);
    const response = await reactMessage(activeUserId, messageId, nextEmoji);
    setPendingId("");
    if (!response?.ok) {
      setCombinedError(response?.message || "Failed to react.");
      return;
    }
    setReactions((prev) => {
      const next = { ...prev };
      if (response?.reaction) {
        next[messageId] = response.reaction;
      } else if (Object.prototype.hasOwnProperty.call(next, messageId)) {
        delete next[messageId];
      }
      return next;
    });
    clearCombinedError();
    setEmojiPickerId("");
  };

  const handleReply = (item) => {
    const parsed = parseMessageText(item.text);
    setReplyTarget({
      id: item.id,
      text: toReplyPreview(parsed.body),
      senderRole: item.senderRole,
    });
    clearCombinedError();
    setMoreMenuId("");
    setEmojiPickerId("");
  };

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !activeUserId) return;
    const payload = buildMessageWithReply({ body: trimmed, reply: replyTarget });
    const response = await sendMessage(activeUserId, payload);
    if (!response?.ok) {
      setCombinedError(response?.message || "Failed to send message.");
      return;
    }
    setDraft("");
    setReplyTarget(null);
    setActiveActionId("");
    setMoreMenuId("");
    setEmojiPickerId("");
    clearCombinedError();
  };

  const handleStartEdit = (item) => {
    if (!item?.id || isReadOnly || item.senderRole !== "admin" || item.senderId !== currentAdminId) {
      return;
    }
    const parsed = parseMessageText(item.text);
    setEditingId(item.id);
    setEditingText(parsed.body ?? "");
    clearCombinedError();
    setMoreMenuId("");
    setEmojiPickerId("");
  };

  const handleSaveEdit = async (messageId) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setCombinedError("Message cannot be empty.");
      return;
    }
    const current = messages.find((item) => item.id === messageId);
    if (!current) return;
    const parsed = parseMessageText(current.text);
    const payload = buildMessageWithReply({ body: trimmed, reply: parsed.reply });
    setPendingId(messageId);
    const response = await editMessage(activeUserId, messageId, payload);
    setPendingId("");
    if (!response?.ok) {
      setCombinedError(response?.message || "Failed to edit message.");
      return;
    }
    setEditingId("");
    setEditingText("");
    clearCombinedError();
  };

  const handleDeleteMessage = async (messageId) => {
    setPendingId(messageId);
    const response = await deleteMessage(activeUserId, messageId);
    setPendingId("");
    if (!response?.ok) {
      setCombinedError(response?.message || "Failed to delete message.");
      return;
    }
    setEditingId((current) => (current === messageId ? "" : current));
    setEditingText("");
    setReplyTarget((current) => (current?.id === messageId ? null : current));
    clearCombinedError();
  };

  const handleDeleteThread = async (userId) => {
    const response = await deleteThreadMessages(userId);
    if (!response?.ok) {
      setCombinedError(response?.message || "Failed to clear conversation.");
      return;
    }
    clearCombinedError();
  };

  return (
    <div className="flex h-full min-h-0 flex-col text-slate-100">
      <div className={`${isHeaderMode ? "px-4 py-3" : "px-5 py-4"} flex items-center justify-between border-b border-white/10`}>
        <div className="flex min-w-0 items-center gap-2">
          {isThreadView ? (
            <button
              type="button"
              onClick={goBackToList}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-[#00f0ff]/50 hover:text-[#00f0ff]"
              aria-label="Back to list"
            >
              <SymbolIcon name="arrow_back" className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[#00f0ff]">
              <SymbolIcon name="message" className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            {isThreadView ? (
              <>
                <p className="truncate text-sm font-semibold text-white">
                  {activeThread?.user?.name || activeThread?.user?.email || "Conversation"}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {activeThread?.user?.email || getPresenceLabel(activePresence)}
                  {activeThread?.user?.email ? ` \u00B7 ${getPresenceLabel(activePresence)}` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">Messenger</p>
                <p className="text-[11px] text-slate-400">User conversations</p>
              </>
            )}
          </div>
        </div>
        <div className="ml-2 flex items-center gap-2">
          {typeof onEnableNotifications === "function" ? (
            pushStatus !== "enabled" ? (
              <button
                type="button"
                onClick={onEnableNotifications}
                disabled={pushStatus === "loading"}
                className="rounded-md border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pushStatus === "loading" ? "Enabling..." : "Enable Notifications"}
              </button>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                Alerts On
              </span>
            )
          ) : null}
          {typeof onClose === "function" ? (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 transition-colors hover:text-white"
              aria-label="Close chat"
            >
              <SymbolIcon name="close" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {pushHint ? <div className="border-b border-white/10 px-4 py-2 text-[11px] text-slate-400">{pushHint}</div> : null}

      <div className="relative min-h-0 flex-1">
        {chatView === "threads" ? (
          <div className="h-full overflow-y-auto px-2 py-2">
            {threadsLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading conversations...</div>
            ) : threads.length === 0 ? (
              <div className="m-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-slate-500">No chat messages yet.</div>
            ) : (
              <div className="space-y-1">
                {threads.map((thread) => {
                  const preview = parseMessageText(thread.message).body || "No message";
                  const unread = thread.senderRole === "user" && !thread.seenAt;
                  return (
                    <div key={thread.userId} className="relative">
                      <button
                        type="button"
                        onClick={() => openThread(thread.userId)}
                        className="w-full rounded-xl border border-[#00f0ff]/25 bg-[#0c1323]/65 px-3 py-2.5 pr-11 text-left transition-colors hover:border-[#00f0ff]/50 hover:bg-[#0f1930]"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[11px] font-semibold text-[#8cecff]">
                            {initials(thread.user?.name || thread.user?.email || thread.userId) || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-white">{thread.user?.name || thread.user?.email || thread.userId}</p>
                              <div className="flex flex-shrink-0 items-center gap-1">
                                {unread ? <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" /> : null}
                                <span className="text-[10px] text-slate-400">{formatRelativeTime(thread.createdAt)}</span>
                              </div>
                            </div>
                            <p className="truncate text-[11px] text-slate-400">{thread.user?.email || ""}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                              {thread.senderRole === "admin" ? (thread.senderId === currentAdminId ? "You: " : "Admin: ") : ""}
                              {preview}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteThread(thread.userId);
                        }}
                        disabled={threadDeletePendingId === thread.userId}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#0a0f1d]/80 text-slate-400 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete thread for admin"
                      >
                        <SymbolIcon name="delete" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {panelError ? <p className="px-2 pt-2 text-[11px] text-red-300">{panelError}</p> : null}
          </div>
        ) : (
          <>
            <div ref={containerRef} onScroll={onContainerScroll} className={`${isHeaderMode ? "px-4 py-3 pb-14 text-xs" : "px-5 py-4 pb-16 text-sm"} h-full space-y-3 overflow-y-auto`}>
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading messages...</div>
              ) : messages.map((item, index) => {
                const parsed = parseMessageText(item.text);
                const reaction = reactions[item.id] ?? "";
                const status = getStatusMeta(item, index);
                const incoming = item.senderRole !== "admin";
                if (incoming) {
                  return (
                    <div key={item.id} className="group flex items-start gap-2" onClick={() => handleTap(item.id)}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300">{initials(activeThread?.user?.name || activeThread?.user?.email || "U")}</div>
                      <div className="max-w-[84%]">
                        <div className="flex items-end gap-1">
                          <div className="rounded-lg bg-[#0d1222] px-3 py-2 text-slate-200">
                            {parsed.reply ? <div className="mb-1 rounded border-l-2 border-slate-400/50 bg-white/5 px-2 py-1 text-[10px] text-slate-400">{parsed.reply.text}</div> : null}
                            <p className="whitespace-pre-wrap break-words">{parsed.body}</p>
                          </div>
                          <div className={`relative flex items-center gap-1 ${actionVisibleClass(item.id)}`}>
                            <button type="button" onClick={(event) => { event.stopPropagation(); handleReply(item); }} className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><SymbolIcon name="rotate_right" className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); handleToggleEmojiPicker(item.id); }} className="inline-flex h-6 w-6 items-center justify-center rounded text-[14px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white">{"\u{1F60A}"}</button>
                            {emojiPickerId === item.id ? <div className="absolute bottom-full right-0 z-30 mb-1 flex w-10 flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#0a0a12] px-1 py-2">{QUICK_EMOJIS.map((emoji) => <button key={`${item.id}-${emoji}`} type="button" onClick={(event) => { event.stopPropagation(); void handlePickEmoji(item.id, emoji); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-transform hover:scale-110 hover:bg-white/10">{emoji}</button>)}</div> : null}
                          </div>
                        </div>
                        {reaction ? <div className="ml-2 mt-1 text-base leading-none">{reaction}</div> : null}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="group relative flex justify-end" onClick={() => handleTap(item.id)}>
                    <div className="max-w-[88%]">
                      {editingId === item.id ? (
                        <div className="rounded-lg border border-[#00f0ff]/35 bg-[#0d1222] px-3 py-2">
                          <input value={editingText} onChange={(event) => setEditingText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleSaveEdit(item.id); } if (event.key === "Escape") { event.preventDefault(); setEditingId(""); setEditingText(""); } }} className={`${isHeaderMode ? "text-xs" : "text-sm"} w-full bg-transparent text-[#00f0ff] outline-none placeholder:text-slate-500`} />
                          <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
                            <button type="button" onClick={() => { setEditingId(""); setEditingText(""); }} className="rounded border border-white/20 px-2 py-0.5 text-slate-300 transition-colors hover:text-white">Cancel</button>
                            <button type="button" onClick={() => void handleSaveEdit(item.id)} disabled={pendingId === item.id} className="rounded border border-[#00f0ff]/40 bg-[#00f0ff]/15 px-2 py-0.5 text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/25 disabled:cursor-not-allowed disabled:opacity-60">{pendingId === item.id ? "Saving..." : "Save"}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end justify-end gap-1">
                            <div className={`relative flex items-center gap-1 ${actionVisibleClass(item.id)}`}>
                              <button type="button" onClick={(event) => { event.stopPropagation(); setMoreMenuId((current) => (current === item.id ? "" : item.id)); setEmojiPickerId(""); }} disabled={isReadOnly || item.senderId !== currentAdminId} className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"><SymbolIcon name="more_vert" className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={(event) => { event.stopPropagation(); handleReply(item); }} className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><SymbolIcon name="rotate_right" className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={(event) => { event.stopPropagation(); handleToggleEmojiPicker(item.id); }} className="inline-flex h-6 w-6 items-center justify-center rounded text-[14px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white">{"\u{1F60A}"}</button>
                              {moreMenuId === item.id ? <div className="absolute bottom-full left-0 z-20 mb-1 w-28 rounded-md border border-white/10 bg-[#0a0a12] p-1"><button type="button" onClick={(event) => { event.stopPropagation(); handleStartEdit(item); }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-slate-200 transition-colors hover:bg-white/10"><SymbolIcon name="edit" className="h-3 w-3" />Edit</button><button type="button" onClick={(event) => { event.stopPropagation(); void handleDeleteMessage(item.id); }} className="mt-0.5 flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-red-300 transition-colors hover:bg-white/10"><SymbolIcon name="delete" className="h-3 w-3" />Delete</button></div> : null}
                              {emojiPickerId === item.id ? <div className="absolute bottom-full left-0 z-30 mb-1 flex w-10 flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#0a0a12] px-1 py-2">{QUICK_EMOJIS.map((emoji) => <button key={`${item.id}-${emoji}`} type="button" onClick={(event) => { event.stopPropagation(); void handlePickEmoji(item.id, emoji); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-transform hover:scale-110 hover:bg-white/10">{emoji}</button>)}</div> : null}
                            </div>
                            <div className="rounded-lg bg-[#00f0ff]/15 px-3 py-2 text-[#00f0ff]">
                              {parsed.reply ? <div className="mb-1 rounded border-l-2 border-[#00f0ff]/50 bg-[#00f0ff]/10 px-2 py-1 text-[10px] text-[#8cecff]">{parsed.reply.text}</div> : null}
                              <p className="whitespace-pre-wrap break-words">{parsed.body}</p>
                            </div>
                            {status.show ? (status.seenDot ? <span className="mb-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300" title={item.seenAt ? `Seen ${formatRelativeTime(item.seenAt)}` : "Seen"} /> : <span className="mb-1 text-[10px] text-slate-400">{status.text}</span>) : null}
                          </div>
                          {reaction ? <div className="mt-1 flex justify-end pr-2 text-base leading-none">{reaction}</div> : null}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!isPinnedToBottom && pendingNewCount > 0 ? <button type="button" onClick={jumpToLatest} className="absolute bottom-3 right-3 rounded-md border border-[#00f0ff]/50 bg-[#00f0ff]/15 px-3 py-1 text-[11px] font-semibold text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-colors hover:bg-[#00f0ff]/25">Jump to latest ({pendingNewCount} new)</button> : null}
          </>
        )}
      </div>

      {isThreadView ? (
        <div className={`${isHeaderMode ? "px-4 py-3" : "px-5 py-4"} border-t border-white/10`}>
          {replyTarget ? (
            <div className="mb-2 flex items-center justify-between rounded-md border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-2.5 py-1.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7fe9f7]">Replying to {replyTarget.senderRole === "admin" ? "yourself" : "user"}</p>
                <p className="truncate text-[11px] text-slate-300">{replyTarget.text}</p>
              </div>
              <button type="button" onClick={() => setReplyTarget(null)} className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:bg-white/10 hover:text-white"><SymbolIcon name="close" className="h-3.5 w-3.5" /></button>
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1222] px-3 py-2">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleSend(); } }} className={`${isHeaderMode ? "text-xs" : "text-sm"} flex-1 bg-transparent text-slate-200 outline-none placeholder:text-slate-500`} placeholder={isReadOnly ? "Admin login required to reply." : "Type a reply..."} disabled={isReadOnly} />
            <button type="button" onClick={() => void handleSend()} disabled={isReadOnly || sendPending || !activeUserId} className="text-[#00f0ff] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"><SymbolIcon name="send" className="h-4 w-4" /></button>
          </div>
          {panelError ? <p className="mt-2 text-[11px] text-red-300">{panelError}</p> : null}
        </div>
      ) : null}

      {!isThreadView && activeThread ? (
        <div className={`${isHeaderMode ? "px-4 py-2" : "px-5 py-2"} border-t border-white/10 text-[10px] text-slate-500`}>
          Last active thread: {activeThread.user?.name || activeThread.user?.email || activeThread.userId}
          {activeThread.createdAt ? ` \u00B7 ${formatAbsoluteTime(activeThread.createdAt)}` : ""}
        </div>
      ) : null}
    </div>
  );
}
