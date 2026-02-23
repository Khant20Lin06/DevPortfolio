const GUEST_KEY = "portfolio_guest_id";

const fallbackId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const getGuestId = () => {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(GUEST_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : fallbackId();
  localStorage.setItem(GUEST_KEY, id);
  return id;
};
