import { API_BASE_URL, hasApiBaseUrl } from "./apiBase";

const AUTH_TOKEN_KEY = "portfolio_auth_token";

export const isAuthApiEnabled = () => hasApiBaseUrl();

export const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
};

export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const request = async ({ path, method = "GET", body, token }) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data: payload,
    };
  } catch (_error) {
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please try again." },
    };
  }
};

const requestFormData = async ({ path, method = "POST", formData, token }) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data: payload,
    };
  } catch (_error) {
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please try again." },
    };
  }
};

export const register = (payload) =>
  request({
    path: "/api/v1/auth/register",
    method: "POST",
    body: payload,
  });

export const login = (payload) =>
  request({
    path: "/api/v1/auth/login",
    method: "POST",
    body: payload,
  });

export const getMe = (token) =>
  request({
    path: "/api/v1/auth/me",
    token,
  });

export const getAdminContent = (token) =>
  request({
    path: "/api/v1/admin/content",
    token,
  });

export const updateAdminContent = ({ token, key, data }) =>
  request({
    path: `/api/v1/admin/content/${encodeURIComponent(key)}`,
    method: "PUT",
    token,
    body: { data },
  });

export const getAdminNotifications = (token) =>
  request({
    path: "/api/v1/admin/notifications",
    token,
  });

export const getAdminInquiries = (token) =>
  request({
    path: "/api/v1/admin/inquiries",
    token,
  });

export const createAdminInquiry = ({ token, payload }) =>
  request({
    path: "/api/v1/admin/inquiries",
    method: "POST",
    token,
    body: payload,
  });

export const updateAdminInquiry = ({ token, inquiryId, payload }) =>
  request({
    path: `/api/v1/admin/inquiries/${encodeURIComponent(inquiryId)}`,
    method: "PUT",
    token,
    body: payload,
  });

export const deleteAdminInquiry = ({ token, inquiryId }) =>
  request({
    path: `/api/v1/admin/inquiries/${encodeURIComponent(inquiryId)}`,
    method: "DELETE",
    token,
  });

export const getAdminPortfolioAnalytics = (token) =>
  request({
    path: "/api/v1/admin/analytics/portfolio",
    token,
  });

export const getAdminChatThreads = (token) =>
  request({
    path: "/api/v1/admin/chat/threads",
    token,
  });

export const getAdminChatMessages = ({ token, userId }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages`,
    token,
  });

export const sendAdminChatMessage = ({ token, userId, message }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages`,
    method: "POST",
    token,
    body: { message },
  });

export const deleteAdminChatThreadMessages = ({ token, userId }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages`,
    method: "DELETE",
    token,
  });

export const editAdminChatMessage = ({ token, userId, messageId, message }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`,
    method: "PUT",
    token,
    body: { message },
  });

export const deleteAdminChatMessage = ({ token, userId, messageId }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}`,
    method: "DELETE",
    token,
  });

export const reactAdminChatMessage = ({ token, userId, messageId, emoji }) =>
  request({
    path: `/api/v1/admin/chat/threads/${encodeURIComponent(userId)}/messages/${encodeURIComponent(messageId)}/reaction`,
    method: "PUT",
    token,
    body: { emoji },
  });

export const getUserChatMessages = (token) =>
  request({
    path: "/api/v1/messages",
    token,
  });

export const deleteUserChatThreadMessages = (token) =>
  request({
    path: "/api/v1/messages",
    method: "DELETE",
    token,
  });

export const editUserChatMessage = ({ token, messageId, message }) =>
  request({
    path: `/api/v1/messages/${encodeURIComponent(messageId)}`,
    method: "PUT",
    token,
    body: { message },
  });

export const deleteUserChatMessage = ({ token, messageId }) =>
  request({
    path: `/api/v1/messages/${encodeURIComponent(messageId)}`,
    method: "DELETE",
    token,
  });

export const reactUserChatMessage = ({ token, messageId, emoji }) =>
  request({
    path: `/api/v1/messages/${encodeURIComponent(messageId)}/reaction`,
    method: "PUT",
    token,
    body: { emoji },
  });

export const uploadAsset = ({ token, file }) => {
  const formData = new FormData();
  formData.append("file", file);

  return requestFormData({
    path: "/api/v1/assets",
    method: "POST",
    token,
    formData,
  });
};
