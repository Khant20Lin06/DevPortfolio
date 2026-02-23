export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export const hasApiBaseUrl = () => Boolean(API_BASE_URL);
