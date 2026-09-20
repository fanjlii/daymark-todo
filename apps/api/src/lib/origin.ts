const localOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
]);

export function isAllowedOrigin(origin: string, configuredOrigins = "") {
  if (localOrigins.has(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  const configured = configuredOrigins
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return configured.includes(origin.replace(/\/$/, ""));
}
