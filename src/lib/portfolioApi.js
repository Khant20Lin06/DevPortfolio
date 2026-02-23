import { API_BASE_URL, hasApiBaseUrl } from "./apiBase";

const AUTH_TOKEN_KEY = "portfolio_auth_token";

const getClientAuthToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
};

export const isPortfolioApiEnabled = () => hasApiBaseUrl();

export const fetchPortfolioContent = async () => {
  if (!hasApiBaseUrl()) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/content`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio content.");
  }

  const payload = await response.json();
  return payload.content ?? null;
};

export const trackPortfolioView = async ({ visitorKey }) => {
  if (!hasApiBaseUrl()) {
    return { ok: false, status: 0, data: { message: "API disabled." } };
  }

  try {
    const token = getClientAuthToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/portfolio-view`, {
      method: "POST",
      headers,
      body: JSON.stringify({ visitorKey }),
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
      data: { message: "Network error." },
    };
  }
};
