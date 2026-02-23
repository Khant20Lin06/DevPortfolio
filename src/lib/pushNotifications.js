import { API_BASE_URL } from "./apiBase";
import { getAuthToken } from "./authApi";
import { getDeviceId } from "./deviceId";
import { getGuestId } from "./guestId";

const WELCOME_PUSH_SESSION_KEY = "portfolio_welcome_push_sent";

const hasWelcomePushSent = (key) => {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(key) === "1";
};

const markWelcomePushSent = (key) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, "1");
};

const isIos = () => {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
};

export const requiresIosPwaForPush = () => isIos() && !isStandalone();

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const resolveAudience = (audience, hasToken) => {
  if (audience === "admin" || audience === "user" || audience === "guest") return audience;
  return hasToken ? "user" : "guest";
};

const arraysEqual = (left, right) => {
  if (!left || !right) return false;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
};

const getApplicationServerKeyBytes = (subscription) => {
  const raw = subscription?.options?.applicationServerKey;
  if (!raw) return null;
  return new Uint8Array(raw);
};

const ensureFreshSubscription = async (pushManager, publicKeyBytes) => {
  const existing = await pushManager.getSubscription();
  if (!existing) {
    return pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKeyBytes,
    });
  }

  const existingKeyBytes = getApplicationServerKeyBytes(existing);
  if (existingKeyBytes && arraysEqual(existingKeyBytes, publicKeyBytes)) {
    return existing;
  }

  try {
    await existing.unsubscribe();
  } catch (_error) {
    // Continue and try to re-subscribe with current key.
  }

  return pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKeyBytes,
  });
};

export const getPushReasonHint = (reason) => {
  if (reason === "permission_required") return "Enable notifications to get welcome and message alerts.";
  if (reason === "denied") return "Notification permission denied. Allow it in browser settings.";
  if (reason === "ios_pwa_required") return "iOS requires Add to Home Screen for push notifications.";
  if (reason === "subscribe_failed") return "Subscription failed. Check backend push keys and try again.";
  if (reason === "network") return "Network error while subscribing notifications.";
  if (reason === "missing_vapid") return "Missing VAPID key in frontend environment.";
  if (reason === "missing_api") return "Missing NEXT_PUBLIC_API_BASE_URL.";
  if (reason === "insecure_context") return "Push requires HTTPS or localhost.";
  if (reason === "unsupported") return "This browser does not support push notifications.";
  return "Could not enable notifications. Try again.";
};

export const initPushNotifications = async ({ interactive = false, audience } = {}) => {
  if (!API_BASE_URL) return { ok: false, reason: "missing_api" };
  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return { ok: false, reason: "insecure_context" };
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (requiresIosPwaForPush()) {
    return { ok: false, reason: "ios_pwa_required" };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, reason: "missing_vapid" };

  let permission = Notification.permission;
  if (permission !== "granted") {
    if (!interactive) {
      return { ok: false, reason: "permission_required" };
    }
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const registration = await navigator.serviceWorker.register("/sw.js");
  const activeRegistration = registration.active ? registration : await navigator.serviceWorker.ready;

  const publicKeyBytes = urlBase64ToUint8Array(publicKey);
  let subscription;
  try {
    subscription = await ensureFreshSubscription(activeRegistration.pushManager, publicKeyBytes);
  } catch (_error) {
    return { ok: false, reason: "subscribe_failed" };
  }

  const token = getAuthToken();
  const targetAudience = resolveAudience(audience, Boolean(token));
  const endpoint = token ? "/api/v1/push/subscribe" : "/api/v1/push/subscribe/guest";
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const deviceId = getDeviceId();
  const guestId = token ? null : getGuestId();
  const welcomeKey = token
    ? `${WELCOME_PUSH_SESSION_KEY}:user`
    : `${WELCOME_PUSH_SESSION_KEY}:guest`;
  const welcomeCandidate = targetAudience !== "admin" && !hasWelcomePushSent(welcomeKey);
  const welcomePayload = {
    title: "Welcome",
    body: "Hi! How can I help you today?",
    data: { url: "/?chat=1" },
  };
  let localWelcomeShown = false;
  let shouldSendServerWelcome = false;

  if (welcomeCandidate) {
    try {
      await activeRegistration.showNotification(welcomePayload.title, {
        body: welcomePayload.body,
        data: welcomePayload.data,
      });
      localWelcomeShown = true;
      markWelcomePushSent(welcomeKey);
    } catch (_error) {
      shouldSendServerWelcome = true;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscription,
        guestId,
        deviceId,
        welcome: shouldSendServerWelcome,
      }),
    });
    if (!response.ok) {
      return { ok: false, reason: "subscribe_failed" };
    }

    const payload = await response.json().catch(() => ({}));
    const welcomeDispatchAttempted = payload?.welcomeDispatch?.attempted === true;

    if (!localWelcomeShown && shouldSendServerWelcome && welcomeDispatchAttempted) {
      markWelcomePushSent(welcomeKey);
    }
  } catch (_error) {
    return { ok: false, reason: "network" };
  }

  return { ok: true };
};
