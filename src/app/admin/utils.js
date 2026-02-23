export const cloneJson = (value) => JSON.parse(JSON.stringify(value));
export const prettyJson = (value) => JSON.stringify(value ?? {}, null, 2);
export const ensureArray = (value) => (Array.isArray(value) ? value : []);
export const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export const initials = (name) =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const tagLetters = (label) =>
  String(label ?? "")
    .split(/[\s/.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
