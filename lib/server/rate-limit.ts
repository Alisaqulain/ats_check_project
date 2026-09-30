import "server-only";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE) > 0 ? Number(process.env.RATE_LIMIT_PER_MINUTE) : 20;

const hits = new Map<string, number[]>();

/**
 * Simple in-memory sliding-window limiter. It is per server instance, which is
 * sufficient for local use and single-instance deployments.
 */
export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [entry, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entry);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "local";
}
