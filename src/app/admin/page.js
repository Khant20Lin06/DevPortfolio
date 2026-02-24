"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SymbolIcon from "@/components/ui/SymbolIcon";
import {
  clearAuthToken,
  createAdminInquiry,
  deleteAdminChatMessage,
  deleteAdminInquiry,
  editAdminChatMessage,
  getAdminContent,
  getAdminInquiries,
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
  updateAdminInquiry,
  updateAdminContent,
} from "@/lib/authApi";
import { connectRealtime, disconnectRealtime } from "@/lib/realtime";
import { getPushReasonHint, initPushNotifications } from "@/lib/pushNotifications";
import { defaultPortfolioContent } from "@/data/portfolioData";
import { HERO_PROJECTS, NAV_ITEMS } from "./constants";
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
import ProfileView from "./views/ProfileView";
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

const normalizeSkillRow = (row) => ({
  label: String(row?.label ?? ""),
  level: Math.min(100, Math.max(0, Number(row?.level) || 0)),
});

const normalizeSkillGroup = (group) => ({
  title: String(group?.title ?? ""),
  accent: String(group?.accent ?? "#00dcff"),
  rows: ensureArray(group?.rows).map(normalizeSkillRow),
});

const normalizeInquiry = (item) => {
  const message = String(item?.message ?? item?.preview ?? "").trim();
  const body = ensureArray(item?.body).length
    ? ensureArray(item.body).map((line) => String(line))
    : message
      ? message.split(/\r?\n+/).filter(Boolean)
      : [];

  return {
    id: String(item?.id ?? `${Date.now()}`),
    sender: String(item?.sender ?? item?.name ?? "Visitor"),
    email: String(item?.email ?? ""),
    location: String(item?.location ?? "Portfolio Contact"),
    subject: String(item?.subject ?? "Portfolio Contact Inquiry"),
    preview: String(item?.preview ?? message),
    message,
    body,
    tags: ensureArray(item?.tags).length ? ensureArray(item.tags) : ["New Contact"],
    unread: item?.unread !== false,
    createdAt: item?.createdAt ?? new Date().toISOString(),
  };
};

const normalizeProfile = (value) => {
  const social = value?.social ?? {};
  return {
    aboutImageUrl: String(value?.aboutImageUrl ?? defaultPortfolioContent.profile?.aboutImageUrl ?? ""),
    profileImageUrl: String(value?.profileImageUrl ?? defaultPortfolioContent.profile?.profileImageUrl ?? ""),
    resumeUrl: String(value?.resumeUrl ?? defaultPortfolioContent.profile?.resumeUrl ?? ""),
    social: {
      linkedin: String(social?.linkedin ?? defaultPortfolioContent.profile?.social?.linkedin ?? ""),
      github: String(social?.github ?? defaultPortfolioContent.profile?.social?.github ?? ""),
      telegram: String(social?.telegram ?? defaultPortfolioContent.profile?.social?.telegram ?? ""),
      gmail: String(social?.gmail ?? defaultPortfolioContent.profile?.social?.gmail ?? ""),
      location: String(social?.location ?? defaultPortfolioContent.profile?.social?.location ?? ""),
    },
  };
};

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
  const [profileDraft, setProfileDraft] = useState(() =>
    normalizeProfile(defaultPortfolioContent.profile)
  );
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploadingField, setProfileUploadingField] = useState("");
  const [profileMessage, setProfileMessage] = useState({ tone: "neutral", text: "" });
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquirySaving, setInquirySaving] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState({ tone: "neutral", text: "" });
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [projectDrafts, setProjectDrafts] = useState(() =>
    cloneJson(defaultPortfolioContent.projects)
  );
  const [projectSelectedIndex, setProjectSelectedIndex] = useState(0);
  const [projectDirty, setProjectDirty] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectUploadingIndex, setProjectUploadingIndex] = useState(-1);
  const [projectMessage, setProjectMessage] = useState({ tone: "neutral", text: "" });
  const [skillDrafts, setSkillDrafts] = useState(() => cloneJson(defaultPortfolioContent.skills));
  const [skillDirty, setSkillDirty] = useState(false);
  const [skillSaving, setSkillSaving] = useState(false);
  const [skillMessage, setSkillMessage] = useState({ tone: "neutral", text: "" });
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
    const rawView = String(params.get("view") ?? "").trim();
    if (rawView) {
      const nextView = rawView === "project-editor" ? "projects" : rawView;
      if (NAV_ITEMS.some((item) => item.id === nextView)) {
        setActiveView(nextView);
      }
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
    if (skillDirty) return;
    const incoming = ensureArray(content.skills);
    const nextSkills = incoming.length
      ? cloneJson(incoming)
      : cloneJson(defaultPortfolioContent.skills);
    setSkillDrafts(nextSkills);
  }, [content.skills, skillDirty]);

  useEffect(() => {
    if (profileDirty) return;
    setProfileDraft(normalizeProfile(content.profile ?? defaultPortfolioContent.profile));
  }, [content.profile, profileDirty]);

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
    const loadInquiries = async () => {
      if (!apiEnabled || !token || user?.role !== "admin") return;
      setInquiriesLoading(true);
      const response = await getAdminInquiries(token);
      setInquiriesLoading(false);
      if (!response.ok) return;
      const items = ensureArray(response.data?.inquiries).map(normalizeInquiry);
      setInquiries(items);
      if (!selectedInquiryId && items.length) {
        setSelectedInquiryId(items[0].id);
      }
    };

    void loadInquiries();
  }, [apiEnabled, token, user?.role]);

  useEffect(() => {
    if (!inquiries.length) return;
    const exists = inquiries.some((item) => item.id === selectedInquiryId);
    if (!exists) {
      setSelectedInquiryId(inquiries[0].id);
    }
  }, [inquiries, selectedInquiryId]);

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
    let cancelled = false;

    const loadThreads = async () => {
      if (!apiEnabled || !token || user?.role !== "admin") return;
      const response = await getAdminChatThreads(token);
      if (cancelled || !response.ok) return;
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
    const timer = setInterval(() => {
      void loadThreads();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
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

    const handleContactNew = (payload) => {
      const incoming = normalizeInquiry({
        ...payload,
        subject: "Portfolio Contact Inquiry",
        location: "Portfolio Contact",
        tags: ["New Contact"],
        unread: true,
      });

      setInquiries((prev) => [incoming, ...prev.filter((item) => item.id !== incoming.id)]);
      setSelectedInquiryId((prev) => prev || incoming.id);
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
    socket.on("contact:new", handleContactNew);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:receipt", handleChatReceipt);
    socket.on("chat:message_updated", handleChatUpdated);
    socket.on("chat:message_reaction", handleChatReaction);
    socket.on("chat:message_deleted", handleChatDeleted);
    socket.on("chat:thread_hidden", handleThreadHidden);
    socket.on("presence:user", handleUserPresence);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("contact:new", handleContactNew);
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
    const fromDraft = ensureArray(skillDrafts);
    return fromDraft.length ? fromDraft : ensureArray(defaultPortfolioContent.skills);
  }, [skillDrafts]);

  const totalSkillCount = useMemo(
    () =>
      skills.reduce((count, group) => count + ensureArray(group?.rows).length, 0),
    [skills]
  );

  const chatUnreadCount = useMemo(
    () =>
      chatThreads.reduce(
        (count, thread) =>
          count + (thread?.senderRole === "user" && !thread?.seenAt ? 1 : 0),
        0
      ),
    [chatThreads]
  );

  const inquiriesUnreadCount = useMemo(
    () => inquiries.reduce((count, item) => count + (item?.unread ? 1 : 0), 0),
    [inquiries]
  );

  const isReadOnlyUser = apiEnabled && (!user || user.role !== "admin");

  const handleProfileChange = (patch) => {
    setProfileDraft((prev) => ({
      ...normalizeProfile(prev),
      ...patch,
    }));
    setProfileDirty(true);
    setProfileMessage({ tone: "neutral", text: "" });
  };

  const handleProfileSocialChange = (field, value) => {
    setProfileDraft((prev) => {
      const current = normalizeProfile(prev);
      return {
        ...current,
        social: {
          ...current.social,
          [field]: String(value ?? ""),
        },
      };
    });
    setProfileDirty(true);
    setProfileMessage({ tone: "neutral", text: "" });
  };

  const handleProfileUpload = async (field, file) => {
    if (!file) return;

    const isImageField = field === "aboutImageUrl" || field === "profileImageUrl";
    if (isImageField && !String(file.type ?? "").startsWith("image/")) {
      setProfileMessage({ tone: "error", text: "Please select an image file." });
      return;
    }

    if (!apiEnabled) {
      setProfileMessage({
        tone: "warn",
        text: "API disabled: set NEXT_PUBLIC_API_BASE_URL in frontend env for upload.",
      });
      return;
    }

    if (!token || user?.role !== "admin") {
      setProfileMessage({ tone: "error", text: "Admin role is required for upload." });
      return;
    }

    setProfileUploadingField(field);
    setProfileMessage({ tone: "neutral", text: "Uploading file..." });
    const response = await uploadAsset({ token, file });
    setProfileUploadingField("");

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      setProfileMessage({ tone: "error", text: response.data?.message || "Failed to upload file." });
      return;
    }

    const uploadedUrl = String(response.data?.url ?? "").trim();
    if (!uploadedUrl) {
      setProfileMessage({ tone: "error", text: "Upload succeeded but no URL returned." });
      return;
    }

    const nextProfile = normalizeProfile({
      ...normalizeProfile(profileDraft),
      [field]: uploadedUrl,
    });
    setProfileDraft(nextProfile);
    setProfileDirty(true);
    setProfileSaving(true);
    setProfileMessage({ tone: "neutral", text: "Upload complete. Saving profile..." });

    const saveResponse = await updateAdminContent({
      token,
      key: "profile",
      data: nextProfile,
    });
    setProfileSaving(false);

    if (!saveResponse.ok) {
      if (saveResponse.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = saveResponse.data?.fieldErrors
        ? Object.values(saveResponse.data.fieldErrors).join(" ")
        : "";
      setProfileMessage({
        tone: "error",
        text:
          fieldMessage ||
          saveResponse.data?.message ||
          "Upload succeeded but profile save failed. Click Save Profile to retry.",
      });
      return;
    }

    const persisted = normalizeProfile(saveResponse.data?.data ?? nextProfile);
    setContent((prev) => ({ ...prev, profile: persisted }));
    setProfileDraft(persisted);
    setProfileDirty(false);
    setProfileMessage({
      tone: "success",
      text: "File uploaded and saved.",
    });
  };

  const handleProfileSave = async () => {
    const payload = normalizeProfile(profileDraft);

    if (!apiEnabled) {
      setContent((prev) => ({ ...prev, profile: payload }));
      setProfileDirty(false);
      setProfileMessage({ tone: "success", text: "Profile saved in preview mode." });
      return;
    }

    if (!token || user?.role !== "admin") {
      setProfileMessage({ tone: "error", text: "Admin role is required to save profile." });
      return;
    }

    setProfileSaving(true);
    const response = await updateAdminContent({
      token,
      key: "profile",
      data: payload,
    });
    setProfileSaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      setProfileMessage({
        tone: "error",
        text: fieldMessage || response.data?.message || "Failed to save profile settings.",
      });
      return;
    }

    const nextData = normalizeProfile(response.data?.data ?? payload);
    setContent((prev) => ({ ...prev, profile: nextData }));
    setProfileDraft(nextData);
    setProfileDirty(false);
    setProfileMessage({ tone: "success", text: "Profile settings updated successfully." });
  };

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

  const handleSelectInquiry = (inquiryId) => {
    setSelectedInquiryId(inquiryId);
    setInquiryMessage({ tone: "neutral", text: "" });
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === inquiryId
          ? {
              ...item,
              unread: false,
              tags: ensureArray(item.tags).filter((tag) => tag !== "New Contact"),
            }
          : item
      )
    );
  };

  const handleCreateInquiry = async (payload) => {
    const cleanPayload = {
      name: String(payload?.name ?? "").trim(),
      email: String(payload?.email ?? "").trim(),
      message: String(payload?.message ?? "").trim(),
    };

    if (!apiEnabled) {
      const local = normalizeInquiry({
        id: `local-${Date.now()}`,
        ...cleanPayload,
        createdAt: new Date().toISOString(),
      });
      setInquiries((prev) => [local, ...prev]);
      setSelectedInquiryId(local.id);
      setInquiryMessage({ tone: "success", text: "Inquiry created in preview mode." });
      return { ok: true, inquiry: local };
    }

    if (!token || user?.role !== "admin") {
      setInquiryMessage({ tone: "error", text: "Admin role is required." });
      return { ok: false, message: "Admin role is required." };
    }

    setInquirySaving(true);
    const response = await createAdminInquiry({ token, payload: cleanPayload });
    setInquirySaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      const message = fieldMessage || response.data?.message || "Failed to create inquiry.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    const incoming = normalizeInquiry(response.data?.inquiry ?? cleanPayload);
    setInquiries((prev) => [incoming, ...prev.filter((item) => item.id !== incoming.id)]);
    setSelectedInquiryId(incoming.id);
    setInquiryMessage({ tone: "success", text: "Inquiry created." });
    return { ok: true, inquiry: incoming };
  };

  const handleUpdateInquiry = async (inquiryId, payload) => {
    const cleanPayload = {
      name: String(payload?.name ?? "").trim(),
      email: String(payload?.email ?? "").trim(),
      message: String(payload?.message ?? "").trim(),
    };

    if (!inquiryId) {
      const message = "Inquiry id is required.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    if (!apiEnabled) {
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiryId ? normalizeInquiry({ ...item, ...cleanPayload }) : item
        )
      );
      setInquiryMessage({ tone: "success", text: "Inquiry updated in preview mode." });
      return { ok: true };
    }

    if (!token || user?.role !== "admin") {
      const message = "Admin role is required.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    setInquirySaving(true);
    const response = await updateAdminInquiry({
      token,
      inquiryId,
      payload: cleanPayload,
    });
    setInquirySaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      const message = fieldMessage || response.data?.message || "Failed to update inquiry.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    const incoming = normalizeInquiry(response.data?.inquiry ?? { id: inquiryId, ...cleanPayload });
    setInquiries((prev) => prev.map((item) => (item.id === inquiryId ? incoming : item)));
    setInquiryMessage({ tone: "success", text: "Inquiry updated." });
    return { ok: true, inquiry: incoming };
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!inquiryId) {
      const message = "Inquiry id is required.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    if (!apiEnabled) {
      setInquiries((prev) => prev.filter((item) => item.id !== inquiryId));
      setInquiryMessage({ tone: "success", text: "Inquiry deleted in preview mode." });
      return { ok: true };
    }

    if (!token || user?.role !== "admin") {
      const message = "Admin role is required.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    setInquirySaving(true);
    const response = await deleteAdminInquiry({ token, inquiryId });
    setInquirySaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return { ok: false, message: "Session expired." };
      }
      const message = response.data?.message || "Failed to delete inquiry.";
      setInquiryMessage({ tone: "error", text: message });
      return { ok: false, message };
    }

    setInquiries((prev) => prev.filter((item) => item.id !== inquiryId));
    setInquiryMessage({ tone: "success", text: "Inquiry deleted." });
    return { ok: true };
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

    const nextDrafts = cloneJson(projectDrafts);
    const current = nextDrafts[index] ?? normalizeProject({});
    nextDrafts[index] = {
      ...current,
      image: uploadedUrl,
    };

    const payload = ensureArray(nextDrafts).map(normalizeProject);

    setProjectDrafts(nextDrafts);
    setProjectDirty(true);
    setProjectSaving(true);
    setProjectMessage({ tone: "neutral", text: "Upload complete. Saving project..." });

    const saveResponse = await updateAdminContent({
      token,
      key: "projects",
      data: payload,
    });

    setProjectSaving(false);

    if (!saveResponse.ok) {
      if (saveResponse.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = saveResponse.data?.fieldErrors
        ? Object.values(saveResponse.data.fieldErrors).join(" ")
        : "";
      setProjectMessage({
        tone: "error",
        text:
          fieldMessage ||
          saveResponse.data?.message ||
          "Upload succeeded but project save failed. Click Save Changes to retry.",
      });
      return;
    }

    const persisted = ensureArray(saveResponse.data?.data ?? payload).map(normalizeProject);
    setContent((prev) => ({ ...prev, projects: persisted }));
    setProjectDrafts(persisted);
    setProjectDirty(false);
    setProjectMessage({
      tone: "success",
      text: "Project image uploaded and saved.",
    });
  };

  const handleSkillGroupCreate = () => {
    const nextGroup = {
      title: "New Group",
      accent: "#00dcff",
      rows: [{ label: "New Skill", level: 60 }],
    };
    setSkillDrafts((prev) => [...ensureArray(prev), nextGroup]);
    setSkillDirty(true);
    setSkillMessage({ tone: "neutral", text: "" });
  };

  const handleSkillGroupChange = (groupIndex, patch) => {
    setSkillDrafts((prev) => {
      const next = cloneJson(prev);
      const current = normalizeSkillGroup(next[groupIndex]);
      next[groupIndex] = { ...current, ...patch };
      return next;
    });
    setSkillDirty(true);
  };

  const handleSkillGroupDelete = (groupIndex) => {
    setSkillDrafts((prev) => ensureArray(prev).filter((_, index) => index !== groupIndex));
    setSkillDirty(true);
  };

  const handleSkillCreate = (groupIndex) => {
    setSkillDrafts((prev) => {
      const next = cloneJson(prev);
      const current = normalizeSkillGroup(next[groupIndex]);
      const rows = [...ensureArray(current.rows), { label: "New Skill", level: 50 }];
      next[groupIndex] = { ...current, rows };
      return next;
    });
    setSkillDirty(true);
  };

  const handleSkillChange = (groupIndex, rowIndex, patch) => {
    setSkillDrafts((prev) => {
      const next = cloneJson(prev);
      const current = normalizeSkillGroup(next[groupIndex]);
      const rows = ensureArray(current.rows).map((row, index) =>
        index === rowIndex ? { ...normalizeSkillRow(row), ...patch } : normalizeSkillRow(row)
      );
      next[groupIndex] = { ...current, rows };
      return next;
    });
    setSkillDirty(true);
  };

  const handleSkillDelete = (groupIndex, rowIndex) => {
    setSkillDrafts((prev) => {
      const next = cloneJson(prev);
      const current = normalizeSkillGroup(next[groupIndex]);
      const rows = ensureArray(current.rows).filter((_, index) => index !== rowIndex);
      next[groupIndex] = { ...current, rows };
      return next;
    });
    setSkillDirty(true);
  };

  const handleSkillsSave = async () => {
    const payload = ensureArray(skillDrafts)
      .map(normalizeSkillGroup)
      .filter((group) => group.title || ensureArray(group.rows).length);

    if (!apiEnabled) {
      setContent((prev) => ({ ...prev, skills: payload }));
      setSkillDirty(false);
      setSkillMessage({ tone: "success", text: "Skills saved in preview mode." });
      return;
    }

    if (!token || user?.role !== "admin") {
      setSkillMessage({ tone: "error", text: "Admin role is required to save skills." });
      return;
    }

    setSkillSaving(true);
    const response = await updateAdminContent({
      token,
      key: "skills",
      data: payload,
    });
    setSkillSaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      const fieldMessage = response.data?.fieldErrors
        ? Object.values(response.data.fieldErrors).join(" ")
        : "";
      setSkillMessage({
        tone: "error",
        text: fieldMessage || response.data?.message || "Failed to save skills.",
      });
      return;
    }

    const nextData = response.data?.data ?? payload;
    setContent((prev) => ({ ...prev, skills: nextData }));
    setSkillDirty(false);
    setSkillMessage({ tone: "success", text: "Tech stack updated successfully." });
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
    activeView !== "inquiries" && activeView !== "messages" && activeView !== "profile";

  return (
    <main className="h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="flex h-full">
        <AdminSidebar
          activeView={activeView}
          onSelect={setActiveView}
          user={user}
          onLogout={handleLogout}
          navBadges={{ messages: chatUnreadCount, inquiries: inquiriesUnreadCount }}
        />

        <div className="flex flex-1 min-w-0">
          <section className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminHeader
              activeView={activeView}
              onSaveContent={handleSaveContent}
              savePending={savePending}
              selectedKey={selectedKey}
              onCreateProject={handleProjectCreate}
              onSaveProjects={handleProjectsSave}
              projectsSavePending={projectSaving}
              projectsDirty={projectDirty}
              onCreateSkillGroup={handleSkillGroupCreate}
              onSaveSkills={handleSkillsSave}
              skillsSavePending={skillSaving}
              skillsDirty={skillDirty}
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
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-[#00f0ff]/40 hover:text-white"
                >
                  <SymbolIcon name="arrow_back" className="h-3.5 w-3.5 text-[#00f0ff]" />
                  Back to Portfolio
                </button>
              </div>
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
                    {item.id === "messages" && chatUnreadCount > 0 ? (
                      <span className="ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#ff003c] px-1 text-[10px] font-bold text-white">
                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </span>
                    ) : null}
                    {item.id === "inquiries" && inquiriesUnreadCount > 0 ? (
                      <span className="ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#ff003c] px-1 text-[10px] font-bold text-white">
                        {inquiriesUnreadCount > 99 ? "99+" : inquiriesUnreadCount}
                      </span>
                    ) : null}
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
                chatUnreadCount={chatUnreadCount}
                totalSkillCount={totalSkillCount}
                keys={keys}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
                editorText={editorText}
                setEditorText={setEditorText}
                onSave={handleSaveContent}
                savePending={savePending || isReadOnlyUser}
                editorMessage={editorMessage}
                contentLoading={contentLoading}
                onOpenProjects={() => setActiveView("projects")}
                onOpenMessages={() => setActiveView("messages")}
                onOpenTechStack={() => setActiveView("tech-stack")}
              />
            ) : null}
            {activeView === "profile" ? (
              <ProfileView
                profile={normalizeProfile(profileDraft)}
                message={profileMessage}
                dirty={profileDirty}
                savePending={profileSaving}
                isReadOnly={isReadOnlyUser}
                uploadPendingField={profileUploadingField}
                onChange={handleProfileChange}
                onSocialChange={handleProfileSocialChange}
                onUpload={handleProfileUpload}
                onSave={handleProfileSave}
              />
            ) : null}

            {activeView === "projects" ? (
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
                inquiries={inquiries}
                loading={inquiriesLoading}
                saving={inquirySaving}
                crudMessage={inquiryMessage}
                selectedInquiryId={selectedInquiryId}
                setSelectedInquiryId={setSelectedInquiryId}
                onSelectInquiry={handleSelectInquiry}
                onCreateInquiry={handleCreateInquiry}
                onUpdateInquiry={handleUpdateInquiry}
                onDeleteInquiry={handleDeleteInquiry}
              />
            ) : null}
            {activeView === "tech-stack" ? (
              <TechStackView
                skills={skills}
                onGroupCreate={handleSkillGroupCreate}
                onGroupChange={handleSkillGroupChange}
                onGroupDelete={handleSkillGroupDelete}
                onSkillCreate={handleSkillCreate}
                onSkillChange={handleSkillChange}
                onSkillDelete={handleSkillDelete}
                onSaveSkills={handleSkillsSave}
                savePending={skillSaving}
                dirty={skillDirty}
                isReadOnly={isReadOnlyUser}
                message={skillMessage}
              />
            ) : null}
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
