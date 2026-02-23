const DEVICE_KEY = "portfolio_device_id";

const fallbackId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : fallbackId();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
};
