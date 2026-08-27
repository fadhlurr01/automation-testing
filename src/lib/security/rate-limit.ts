/**
 * In-Memory API Rate Limiter
 * Provides sliding-window rate limiting per IP or User ID.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export function checkRateLimit(
  identifier: string,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 60, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetInMs: options.windowMs,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetInMs: Math.max(0, record.resetAt - now),
  };
}
