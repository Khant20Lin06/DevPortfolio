"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SymbolIcon from "@/components/ui/SymbolIcon";
import {
  clearAuthToken,
  deleteAdminChatMessage,
  editAdminChatMessage,
  getAdminContent,
  getAdminPortfolioAnalytics,
  getAdminNotifications,
  getAdminChatMessages,
  getAdminChatThreads,
  getAuthToken,
  getMe,
  isAuthApiEnabled,
  reactAdminChatMessage,
  sendAdminChatMessage,
  uploadAsset,
  updateAdminContent,
} from "@/lib/authApi";
import { connectRealtime, disconnectRealtime } from "@/lib/realtime";
import { getPushReasonHint, initPushNotifications } from "@/lib/pushNotifications";
import { defaultPortfolioContent } from "@/data/portfolioData";
import { HERO_PROJECTS, INQUIRIES, NAV_ITEMS } from "./constants";
import { cloneJson, ensureArray, prettyJson } from "./utils";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import NotificationPanel from "./components/NotificationPanel";
import DashboardView from "./views/DashboardView";
import ProjectsView from "./views/ProjectsView";
import AssetsView from "./views/AssetsView";
import InquiriesView from "./views/InquiriesView";
import AdminChatView from "./views/AdminChatView";
import TechStackView from "./views/TechStackView";
import GithubSyncView from "./views/GithubSyncView";
import DefaultRightPanel from "./views/DefaultRightPanel";
import AssetsSettingsPanel from "./views/AssetsSettingsPanel";
import TechInsightsPanel from "./views/TechInsightsPanel";

const normalizeProject = (project) => ({
  title: String(project?.title ?? ""),
  description: String(project?.description ?? ""),
  image: String(project?.image ?? ""),
  githubUrl: String(project?.githubUrl ?? "").trim(),
  liveDemoUrl: String(project?.liveDemoUrl ?? "").trim(),
  tags: ensureArray(project?.tags)
    .map((tag) => String(tag).trim())
    .filter(Boolean),
});

export default function AdminPage() {
  const router = useRouter();
  const apiEnabled = useMemo(() => isAuthApiEnabled(), []);

  const [authStatus, setAuthStatus] = useState("checking");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  const [content, setContent] = useState(() => cloneJson(defaultPortfolioContent));
  const [keys, setKeys] = useState(Object.keys(defaultPortfolioContent));
  const [selectedKey, setSelectedKey] = useState("hero");
  const [editorText, setEditorText] = useState(prettyJson(defaultPortfolioContent.hero));
  const [editorMessage, setEditorMessage] = useState({ tone: "neutral", text: "" });
  const [contentLoading, setContentLoading] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState(INQUIRIES[0].id);
  const [projectDrafts, setProjectDrafts] = useState(() =>
    cloneJson(defaultPortfolioContent.projects)
  );
  const [projectSelectedIndex, setProjectSelectedIndex] = useState(0);
  const [projectDirty, setProjectDirty] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectUploadingIndex, setProjectUploadingIndex] = useState(-1);
  const [projectMessage, setProjectMessage] = useState({ tone: "neutral", text: "" });
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestNotice, setLatestNotice] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [totalPortfolioViews, setTotalPortfolioViews] = useState(0);
  const [pushStatus, setPushStatus] = useState("idle");
  const [pushHint, setPushHint] = useState("");
  const [chatThreads, setChatThreads] = useState([]);
  const [chatPresenceByUser, setChatPresenceByUser] = useState({});
  const [chatActiveUserId, setChatActiveUserId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSendPending, setChatSendPending] = useState(false);
  const [chatForceScrollTick, setChatForceScrollTick] = useState(0);
  const chatActiveUserIdRef = useRef("");

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!apiEnabled) {
        if (!mounted) return;
        setUser({ name: "Preview Admin", role: "admin" });
        setAuthStatus("ready");
        setEditorMessage({
          tone: "warn",
          text: "Preview mode: set NEXT_PUBLIC_API_BASE_URL to enable real admin API updates.",
        });
        return;
      }

      const savedToken = getAuthToken();
      setToken(savedToken);

      let currentUser = null;
      if (savedToken) {
        const meResponse = await getMe(savedToken);
        if (!mounted) return;
        if (meResponse.ok) {
          currentUser = meResponse.data?.user ?? null;
          setUser(currentUser);
        } else {
          clearAuthToken();
          setToken("");
        }
      }

      if (!currentUser || currentUser.role !== "admin") {
        if (!mounted) return;
        setAuthStatus("forbidden");
        return;
      }

      setAuthStatus("ready");

      setContentLoading(true);
      const adminContentResponse = await getAdminContent(savedToken);
      if (!mounted) return;
      setContentLoading(false);

      if (!adminContentResponse.ok) {
        setEditorMessage({
          tone: "error",
          text: adminContentResponse.data?.message ?? "Failed to load admin content.",
        });
        return;
      }

      const incomingContent = adminContentResponse.data?.content ?? {};
      const merged = {
        ...cloneJson(defaultPortfolioContent),
        ...incomingContent,
      };
      const incomingKeys = ensureArray(adminContentResponse.data?.keys);
      const resolvedKeys = incomingKeys.length ? incomingKeys : Object.keys(merged);
      const nextKey = resolvedKeys.includes("hero") ? "hero" : resolvedKeys[0];

      setContent(merged);
      setKeys(resolvedKeys);
      setSelectedKey(nextKey);
      setEditorText(prettyJson(merged[nextKey]));
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [apiEnabled, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view) {
      setActiveView(view);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingHint = sessionStorage.getItem("portfolio_push_init_hint");
    if (!pendingHint) return;
    setPushHint(pendingHint);
    sessionStorage.removeItem("portfolio_push_init_hint");
  }, []);

  useEffect(() => {
    if (authStatus === "forbidden") {
      router.replace("/");
    }
  }, [authStatus, router]);

  useEffect(() => {
    setEditorText(prettyJson(content[selectedKey]));
  }, [content, selectedKey]);

  useEffect(() => {
    if (projectDirty) return;
    const incoming = ensureArray(content.projects);
    const nextProjects = incoming.length
      ? cloneJson(incoming)
      : cloneJson(defaultPortfolioContent.projects);
    setProjectDrafts(nextProjects);
    setProjectSelectedIndex((prev) => Math.min(prev, Math.max(0, nextProjects.length - 1)));
  }, [content.projects, projectDirty]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!apiEnabled || !token || user?.role !== "admin") return;
      const response = await getAdminNotifications(token);
      if (!response.ok) return;
      const items = Array.isArray(response.data?.notifications) ? response.data.notifications : [];
      setNotifications(items);
      setNotificationCount(items.length);
    };

    void loadNotifications();
  }, [apiEnabled, token, user?.role]);

  useEffect(() => {
    if (!apiEnabled || !token || user?.role !== "admin") return undefined;
    let cancelled = false;

    const loadPortfolioAnalytics = async () => {
      const response = await getAdminPortfolioAnalytics(token);
      if (cancelled || !response.ok) return;
      const nextViews = Number(response.data?.totalViews);
      if (Number.isFinite(nextViews)) {
        setTotalPortfolioViews(nextViews);
      }
    };

    void loadPortfolioAnalytics();
    const timer = setInterval(() => {
      void loadPortfolioAnalytics();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiEnabled, token, user?.role]);

  useEffect(() => {
    const loadThreads = async () => {
      if (!apiEnabled || !token || user?.role !== "admin") return;
      const response = await getAdminChatThreads(token);
      if (!response.ok) return;
      const threads = Array.isArray(response.data?.threads) ? response.data.threads : [];
      setChatThreads(
        threads.map((thread) => ({
          userId: thread.userId,
          user: thread.user,
          message: thread.message,
          senderRole: thread.senderRole,
          senderId: thread.senderId,
          deliveredAt: thread.deliveredAt,
          seenAt: thread.seenAt,
          createdAt: thread.createdAt,
        }))
      );
      setChatPresenceByUser((prev) => {
        const next = { ...prev };
        threads.forEach((thread) => {
          next[thread.userId] = thread.userPresence ?? next[thread.userId] ?? null;
        });
        return next;
      });
      if (threads.length && !chatActiveUserId) {
        setChatActiveUserId(threads[0].userId);
      }
    };

    void loadThreads();
  }, [apiEnabled, token, user?.role, chatActiveUserId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!apiEnabled || !token || user?.role !== "admin" || !chatActiveUserId) return;
      setChatLoading(true);
      const response = await getAdminChatMessages({ token, userId: chatActiveUserId });
      setChatLoading(false);
      if (!response.ok) return;
      const items = Array.isArray(response.data?.messages) ? response.data.messages : [];
      setChatMessages(items.slice().reverse());
      setChatForceScrollTick((tick) => tick + 1);
    };

    void loadMessages();
  }, [apiEnabled, token, user?.role, chatActiveUserId]);

  useEffect(() => {
    chatActiveUserIdRef.current = chatActiveUserId;
  }, [chatActiveUserId]);

  useEffect(() => {
    if (!apiEnabled || !token || user?.role !== "admin") return;
    let cancelled = false;

    const syncPush = async () => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") {
        if (!cancelled) {
          setPushStatus("disabled");
          setPushHint("Click Enable Alerts to allow device notifications.");
        }
        return;
      }
      const result = await initPushNotifications({ interactive: false, audience: "admin" });
      if (cancelled) return;
      if (result.ok) {
        setPushStatus("enabled");
        setPushHint("");
        return;
      }
      setPushStatus("error");
      setPushHint(getPushReasonHint(result.reason));
    };

    void syncPush();
    return () => {
      cancelled = true;
    };
  }, [apiEnabled, token, user?.role]);

  useEffect(() => {
    if (!apiEnabled || !token || user?.role !== "admin") return;

    const socket = connectRealtime();
    if (!socket) return;

    const handleNotification = (payload) => {
      if (!payload) return;
      if (payload?.data?.metric === "portfolio_views") {
        const nextViews = Number(payload?.data?.totalViews);
        if (Number.isFinite(nextViews)) {
          setTotalPortfolioViews(nextViews);
        } else {
          setTotalPortfolioViews((prev) => (Number.isFinite(prev) ? prev + 1 : 1));
        }
      }
      setNotificationCount((prev) => prev + 1);
      setLatestNotice({
        id: payload.data?.contactId || payload.data?.messageId || String(Date.now()),
        title: payload.title || "New notification",
        body: payload.body || "",
        createdAt: payload.createdAt || new Date().toISOString(),
        type: payload.type || "general",
      });
      setNotifications((prev) => [
        {
          id: payload.data?.contactId || payload.data?.messageId || String(Date.now()),
          title: payload.title || "New notification",
          body: payload.body || "",
          createdAt: payload.createdAt || new Date().toISOString(),
          type: payload.type || "general",
        },
        ...prev,
      ]);
    };

    const handleChatReceipt = (payload) => {
      const ids = Array.isArray(payload?.messageIds) ? payload.messageIds : [];
      if (ids.length === 0) return;
      const target = new Set(ids);
      setChatMessages((prev) =>
        prev.map((item) => {
          if (!target.has(item.id)) return item;
          return {
            ...item,
            deliveredAt: payload.deliveredAt ?? item.deliveredAt ?? payload.seenAt ?? null,
            seenAt: payload.seenAt ?? item.seenAt ?? null,
          };
        })
      );
    };

    const handleUserPresence = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      setChatPresenceByUser((prev) => ({
        ...prev,
        [userId]: {
          isOnline: payload.isOnline === true,
          lastActiveAt: payload.lastActiveAt ?? null,
        },
      }));
    };

    const handleChatMessage = (payload) => {
      if (!payload?.userId) return;
      if (payload?.senderRole === "user" && !payload?.deliveredAt) {
        socket.emit("chat:admin_delivered", { userId: payload.userId }, () => {});
      }
      setChatThreads((prev) => {
        const existingIndex = prev.findIndex((thread) => thread.userId === payload.userId);
        const nextThread = {
          userId: payload.userId,
          user: payload.user ?? prev[existingIndex]?.user ?? null,
          message: payload.message,
          senderRole: payload.senderRole,
          senderId: payload.senderId,
          deliveredAt: payload.deliveredAt ?? null,
          seenAt: payload.seenAt ?? null,
          createdAt: payload.createdAt,
        };
        if (existingIndex === -1) {
          return [nextThread, ...prev];
        }
        const next = [...prev];
        next.splice(existingIndex, 1);
        return [nextThread, ...next];
      });

      if (payload.userId === chatActiveUserIdRef.current) {
        setChatMessages((prev) => [
          ...prev,
          ...(!payload.id || !prev.some((item) => item.id === payload.id)
            ? [
                {
                  id: payload.id ?? `${Date.now()}`,
                  message: payload.message,
                  reaction: payload.reaction ?? null,
                  senderRole: payload.senderRole,
                  senderId: payload.senderId,
                  deliveredAt: payload.deliveredAt ?? null,
                  seenAt: payload.seenAt ?? null,
                  createdAt: payload.createdAt ?? new Date().toISOString(),
                },
              ]
            : []),
        ]);
      }
    };

    const handleChatUpdated = (payload) => {
      if (!payload?.id || !payload?.userId) return;
      if (payload.userId !== chatActiveUserIdRef.current) return;
      setChatMessages((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                message: payload.message ?? item.message,
                reaction: payload.reaction ?? item.reaction ?? null,
                deliveredAt: payload.deliveredAt ?? item.deliveredAt ?? null,
                seenAt: payload.seenAt ?? item.seenAt ?? null,
              }
            : item
        )
      );
    };

    const handleChatReaction = (payload) => {
      if (!payload?.id || !payload?.userId) return;
      if (payload.userId !== chatActiveUserIdRef.current) return;
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
      if (!payload?.id || !payload?.userId) return;
      if (payload.deletedFor && payload.deletedFor !== "admin" && payload.deletedFor !== "both") return;
      if (payload.userId !== chatActiveUserIdRef.current) return;
      setChatMessages((prev) => prev.filter((item) => item.id !== payload.id));
    };

    const handleThreadHidden = (payload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;
      setChatThreads((prev) => prev.filter((thread) => thread.userId !== userId));
      setChatPresenceByUser((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, userId)) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      if (chatActiveUserIdRef.current === userId) {
        setChatActiveUserId("");
        setChatMessages([]);
      }
    };

    socket.on("notification:new", handleNotification);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:receipt", handleChatReceipt);
    socket.on("chat:message_updated", handleChatUpdated);
    socket.on("chat:message_reaction", handleChatReaction);
    socket.on("chat:message_deleted", handleChatDeleted);
    socket.on("chat:thread_hidden", handleThreadHidden);
    socket.on("presence:user", handleUserPresence);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:receipt", handleChatReceipt);
      socket.off("chat:message_updated", handleChatUpdated);
      socket.off("chat:message_reaction", handleChatReaction);
      socket.off("chat:message_deleted", handleChatDeleted);
      socket.off("chat:thread_hidden", handleThreadHidden);
      socket.off("presence:user", handleUserPresence);
    };
  }, [apiEnabled, token, user?.role]);

  const projects = useMemo(() => {
    const fromContent = ensureArray(content.projects).map((project, index) => ({
      ...HERO_PROJECTS[index % HERO_PROJECTS.length],
      ...project,
      version: HERO_PROJECTS[index % HERO_PROJECTS.length].version,
      category: HERO_PROJECTS[index % HERO_PROJECTS.length].category,
      visibility: HERO_PROJECTS[index % HERO_PROJECTS.length].visibility,
      status: HERO_PROJECTS[index % HERO_PROJECTS.length].status,
      views: HERO_PROJECTS[index % HERO_PROJECTS.length].views,
      perf: HERO_PROJECTS[index % HERO_PROJECTS.length].perf,
      updatedAt: HERO_PROJECTS[index % HERO_PROJECTS.length].updatedAt,
      by: HERO_PROJECTS[index % HERO_PROJECTS.length].by,
      image: project.image || HERO_PROJECTS[index % HERO_PROJECTS.length].image,
      tags: ensureArray(project.tags).length
        ? ensureArray(project.tags)
        : HERO_PROJECTS[index % HERO_PROJECTS.length].tags,
    }));
    return fromContent.length ? fromContent : HERO_PROJECTS;
  }, [content.projects]);

  const skills = useMemo(() => {
    const fromContent = ensureArray(content.skills);
    return fromContent.length ? fromContent : ensureArray(defaultPortfolioContent.skills);
  }, [content.skills]);

  const isReadOnlyUser = apiEnabled && (!user || user.role !== "admin");

  const handleProjectCreate = () => {
    const template = {
      title: "New Project",
      description: "",
      image: "/assets/project-shot-1.png",
      githubUrl: "",
      liveDemoUrl: "",
      tags: ["New"],
    };
    setProjectDrafts((prev) => {
      const next = [...ensureArray(prev), template];
      setProjectSelectedIndex(Math.max(0, next.length - 1));
      return next;
    });
    setProjectDirty(true);
    setProjectMessage({ tone: "neutral", text: "" });
  };

  const handleProjectChange = (index, patch) => {
    setProjectDrafts((prev) => {
      const next = cloneJson(prev);
      const current = next[index] ?? normalizeProject({});
      next[index] = { ...current, ...patch };
      return next;
    });
    setProjectDirty(true);
  };

  const handleProjectDelete = (index) => {
    setProjectDrafts((prev) => ensureArray(prev).filter((_, idx) => idx !== index));
    setProjectSelectedIndex((prev) => {
      if (prev > index) return prev - 1;
      if (prev === index) return Math.max(0, prev - 1);
      return prev;
    });
    setProjectDirty(true);
  };

  const handleProjectImageUpload = async (index, file) => {
    if (!file) return;
    if (!String(file.type ?? "").startsWith("image/")) {
      setProjectMessage({ tone: "error", text: "Please select an image file." });
      return;
    }
    if (!apiEnabled) {
      setProjectMessage({
        tone: "warn",
        text: "API disabled: set NEXT_PUBLIC_API_BASE_URL in frontend env for upload.",
      });
      return;
    }
    if (!token || user?.role !== "admin") {
      setProjectMessage({ tone: "error", text: "Admin role is required for image upload." });
      return;
    }

    setProjectUploadingIndex(index);
    setProjectMessage({ tone: "neutral", text: "Uploading image..." });
    const response = await uploadAsset({ token, file });
    setProjectUploadingIndex(-1);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      setProjectMessage({
        tone: "error",
        text: response.data?.message || "Failed to upload image.",
      });
      return;
    }

    const uploadedUrl = String(response.data?.url ?? "").trim();
    if (!uploadedUrl) {
      setProjectMessage({ tone: "error", text: "Upload succeeded but no URL returned." });
      return;
    }

    setProjectDrafts((prev) => {
      const next = cloneJson(prev);
      const current = next[index] ?? normalizeProject({});
      next[index] = {
        ...current,
        image: uploadedUrl,
      };
      return next;
    });
    setProjectDirty(true);
    setProjectMessage({
      tone: "success",
      text: "Image uploaded. Click Save Changes to publish.",
    });
  };

  const handleAdminChatSend = async (userId, message) => {
    if (!userId) return;
    if (!apiEnabled) return;
    if (!token || user?.role !== "admin") return;

    setChatSendPending(true);
    const response = await sendAdminChatMessage({ token, userId, message });
    setChatSendPending(false);

    if (!response.ok) return;
    setChatMessages((prev) => [
      ...prev,
      ...(!response.data?.id || !prev.some((item) => item.id === response.data.id)
        ? [
            {
              id: response.data?.id ?? `${Date.now()}`,
              message: response.data?.message ?? message,
              reaction: response.data?.reaction ?? null,
              senderRole: response.data?.senderRole ?? "admin",
              senderId: response.data?.senderId ?? user?.id,
              deliveredAt: response.data?.deliveredAt ?? null,
              seenAt: response.data?.seenAt ?? null,
              createdAt: response.data?.createdAt ?? new Date().toISOString(),
            },
          ]
        : []),
    ]);
    setChatForceScrollTick((tick) => tick + 1);
  };

  const handleAdminChatEdit = async (userId, messageId, message) => {
    if (!userId || !messageId) return { ok: false, message: "Message not found." };
    if (!apiEnabled) return { ok: false, message: "API is disabled." };
    if (!token || user?.role !== "admin") return { ok: false, message: "Admin login required." };

    const response = await editAdminChatMessage({
      token,
      userId,
      messageId,
      message,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      return { ok: false, message: response.data?.message || "Failed to edit message." };
    }

    setChatMessages((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              message: response.data?.message ?? message,
              reaction: response.data?.reaction ?? item.reaction ?? null,
              deliveredAt: response.data?.deliveredAt ?? item.deliveredAt ?? null,
              seenAt: response.data?.seenAt ?? item.seenAt ?? null,
            }
          : item
      )
    );
    return { ok: true };
  };

  const handleAdminChatDelete = async (userId, messageId) => {
    if (!userId || !messageId) return { ok: false, message: "Message not found." };
    if (!apiEnabled) return { ok: false, message: "API is disabled." };
    if (!token || user?.role !== "admin") return { ok: false, message: "Admin login required." };

    const response = await deleteAdminChatMessage({
      token,
      userId,
      messageId,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      return { ok: false, message: response.data?.message || "Failed to delete message." };
    }

    setChatMessages((prev) => prev.filter((item) => item.id !== messageId));
    return { ok: true };
  };

  const handleAdminChatReaction = async (userId, messageId, emoji) => {
    if (!userId || !messageId) return { ok: false, message: "Message not found." };
    if (!apiEnabled) return { ok: false, message: "API is disabled." };
    if (!token || user?.role !== "admin") return { ok: false, message: "Admin login required." };

    const response = await reactAdminChatMessage({
      token,
      userId,
      messageId,
      emoji,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      return { ok: false, message: response.data?.message || "Failed to react." };
    }

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
    return { ok: true, reaction: response.data?.reaction ?? null };
  };

  const handleProjectsSave = async () => {
    const payload = ensureArray(projectDrafts).map(normalizeProject);

    if (!apiEnabled) {
      setContent((prev) => ({ ...prev, projects: payload }));
      setProjectDirty(false);
      setProjectMessage({ tone: "success", text: "Projects saved in preview mode." });
      return;
    }

    if (!token || user?.role !== "admin") {
      setProjectMessage({ tone: "error", text: "Admin role is required to save projects." });
      return;
    }

    setProjectSaving(true);
    const response = await updateAdminContent({
      token,
      key: "projects",
      data: payload,
    });
    setProjectSaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      setProjectMessage({
        tone: "error",
        text: fieldMessage || response.data?.message || "Failed to save projects.",
      });
      return;
    }

    const nextData = response.data?.data ?? payload;
    setContent((prev) => ({ ...prev, projects: nextData }));
    setProjectDirty(false);
    setProjectMessage({ tone: "success", text: "Projects updated successfully." });
  };

  const handleSaveContent = async () => {
    let parsed;
    try {
      parsed = JSON.parse(editorText);
    } catch (_error) {
      setEditorMessage({ tone: "error", text: "JSON parse error: please fix invalid syntax before saving." });
      return;
    }

    if (!apiEnabled) {
      setContent((prev) => ({ ...prev, [selectedKey]: parsed }));
      setEditorMessage({
        tone: "success",
        text: `Preview updated for "${selectedKey}". API is disabled, so no server write happened.`,
      });
      return;
    }

    if (!token || user?.role !== "admin") {
      setEditorMessage({ tone: "error", text: "Admin role is required to save content." });
      return;
    }

    setSavePending(true);
    const response = await updateAdminContent({
      token,
      key: selectedKey,
      data: parsed,
    });
    setSavePending(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      setEditorMessage({
        tone: "error",
        text: fieldMessage || response.data?.message || "Failed to save content.",
      });
      return;
    }

    const nextData = response.data?.data ?? parsed;
    setContent((prev) => ({ ...prev, [selectedKey]: nextData }));
    setEditorMessage({
      tone: "success",
      text: `Saved "${selectedKey}" successfully.`,
    });
  };

  const handleLogout = () => {
    clearAuthToken();
    disconnectRealtime();
    router.push("/login");
  };

  const handleToggleNotifications = () => {
    setNotificationOpen((prev) => !prev);
    setNotificationCount(0);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setNotificationCount(0);
  };

  const handleEnablePush = async () => {
    setPushStatus("loading");
    setPushHint("");
    const result = await initPushNotifications({ interactive: true, audience: "admin" });
    if (result.ok) {
      setPushStatus("enabled");
      setPushHint("Device notifications enabled.");
      return;
    }
    if (result.reason === "denied") {
      setPushStatus("denied");
      setPushHint("Permission denied. Allow notifications in browser settings.");
      return;
    }
    if (result.reason === "ios_pwa_required") {
      setPushStatus("ios_pwa_required");
      setPushHint("iOS requires Add to Home Screen for push notifications.");
      return;
    }
    setPushStatus("error");
    setPushHint(getPushReasonHint(result.reason));
  };

  const handleAdminMarkSeen = (userId) => {
    if (!userId) return;
    const socket = connectRealtime();
    if (!socket) return;
    socket.emit("chat:admin_seen", { userId }, () => {});
  };

  if (authStatus === "checking") {
    return (
      <main className="flex h-screen items-center justify-center bg-[#05050a] text-slate-200">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a12] px-5 py-4">
          <SymbolIcon name="sync" className="h-5 w-5 animate-spin text-[#00f0ff]" />
          <span>Loading admin panel...</span>
        </div>
      </main>
    );
  }

  if (authStatus === "forbidden") {
    return null;
  }

  const showRightPanel =
    activeView !== "inquiries" && activeView !== "project-editor" && activeView !== "messages";

  return (
    <main className="h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="flex h-full">
        <AdminSidebar activeView={activeView} onSelect={setActiveView} user={user} onLogout={handleLogout} />

        <div className="flex flex-1 min-w-0">
          <section className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminHeader
              activeView={activeView}
              setActiveView={setActiveView}
              onSaveContent={handleSaveContent}
              savePending={savePending}
              selectedKey={selectedKey}
              onCreateProject={handleProjectCreate}
              onSaveProjects={handleProjectsSave}
              projectsSavePending={projectSaving}
              projectsDirty={projectDirty}
              isReadOnlyUser={isReadOnlyUser}
              notificationCount={notificationCount}
              onToggleNotifications={handleToggleNotifications}
              pushStatus={pushStatus}
              onEnablePush={handleEnablePush}
            />

            {pushHint ? (
              <div className="border-b border-white/5 bg-[#0a0a12] px-4 py-1.5 text-[11px] text-slate-400">
                {pushHint}
              </div>
            ) : null}

            {notificationOpen ? (
              <NotificationPanel
                notifications={notifications}
                onClose={handleToggleNotifications}
                onClear={handleClearNotifications}
              />
            ) : null}

            <div className="px-4 py-2 text-xs border-b border-white/5 text-slate-500 lg:hidden">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`whitespace-nowrap rounded-full border px-3 py-1 ${
                      activeView === item.id
                        ? "border-[#00f0ff]/30 bg-[#00f0ff]/20 text-[#00f0ff]"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {isReadOnlyUser ? (
              <div className="px-4 py-2 text-xs text-yellow-200 border-b border-yellow-500/20 bg-yellow-500/10">
                Read-only mode: your account role is `{user?.role}`. Admin role is required for save.
              </div>
            ) : null}

            {latestNotice ? (
              <div className="border-b border-[#00f0ff]/20 bg-[#00f0ff]/10 px-4 py-2 text-xs text-[#9ff7ff]">
                <span className="font-semibold text-white">{latestNotice.title}</span>
                {latestNotice.body ? <span className="ml-2 text-slate-300">{latestNotice.body}</span> : null}
              </div>
            ) : null}

            {activeView === "dashboard" ? (
              <DashboardView
                projects={projects}
                totalPortfolioViews={totalPortfolioViews}
                keys={keys}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
                editorText={editorText}
                setEditorText={setEditorText}
                onSave={handleSaveContent}
                savePending={savePending || isReadOnlyUser}
                editorMessage={editorMessage}
                contentLoading={contentLoading}
              />
            ) : null}

            {activeView === "projects" || activeView === "project-editor" ? (
              <ProjectsView
                projects={projectDrafts}
                selectedIndex={projectSelectedIndex}
                onSelectIndex={setProjectSelectedIndex}
                onProjectChange={handleProjectChange}
                onProjectImageUpload={handleProjectImageUpload}
                onProjectDelete={handleProjectDelete}
                onProjectCreate={handleProjectCreate}
                onSaveProjects={handleProjectsSave}
                savePending={projectSaving}
                uploadPendingIndex={projectUploadingIndex}
                isReadOnly={isReadOnlyUser}
                message={projectMessage}
                dirty={projectDirty}
              />
            ) : null}
            {activeView === "messages" ? (
              <AdminChatView
                enabled={apiEnabled && Boolean(token) && user?.role === "admin"}
                token={token}
                currentAdminId={user?.id ?? ""}
                onUnauthorized={() => {
                  clearAuthToken();
                  router.replace("/login");
                }}
                isReadOnly={isReadOnlyUser}
                mode="adminPage"
                isOpen={activeView === "messages"}
              />
            ) : null}
            {activeView === "assets" ? <AssetsView /> : null}
            {activeView === "inquiries" ? (
              <InquiriesView
                selectedInquiryId={selectedInquiryId}
                setSelectedInquiryId={setSelectedInquiryId}
              />
            ) : null}
            {activeView === "tech-stack" ? <TechStackView skills={skills} /> : null}
            {activeView === "github-sync" ? <GithubSyncView projects={projects} /> : null}
          </section>

          {showRightPanel && activeView !== "assets" && activeView !== "tech-stack" ? (
            <DefaultRightPanel />
          ) : null}
          {showRightPanel && activeView === "assets" ? <AssetsSettingsPanel /> : null}
          {showRightPanel && activeView === "tech-stack" ? <TechInsightsPanel projects={projects} /> : null}
        </div>
      </div>
    </main>
  );
}
