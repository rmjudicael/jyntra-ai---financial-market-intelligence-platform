import type { NextFunction, Request, Response } from 'express';

/**
 * Bounded, proxy-aware rate limiter.
 *
 * The original in-file limiter kept one Map entry per client forever, which
 * grows without bound on a long-running server. This module:
 *  - evicts expired buckets and caps the total number of tracked clients;
 *  - only trusts `X-Forwarded-For` when TRUST_PROXY is explicitly enabled, so
 *    a direct client cannot spoof its identity through a header;
 *  - exposes its size so the bound can be asserted in tests.
 */

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "chat". Kept in the map key. */
  bucket: string;
  /** Maximum requests allowed per client inside the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Hard cap on tracked clients. Oldest entries are evicted first. */
  maxEntries?: number;
  /** Trust the first X-Forwarded-For hop. Enable only behind a known proxy. */
  trustProxy?: boolean;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

export interface RateLimitDecision {
  key: string;
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  /** Number of clients currently tracked (bounded by maxEntries). */
  size: () => number;
  /** Clears every tracked client. */
  reset: () => void;
  /** Pure decision helper, useful for tests and diagnostics. */
  check: (clientKey: string) => RateLimitDecision;
}

export function clientKey(req: Pick<Request, 'socket' | 'headers'>, trustProxy = false): string {
  const direct = req.socket?.remoteAddress || 'unknown';
  if (!trustProxy) return direct;
  const forwarded = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = typeof raw === 'string' ? raw.split(',')[0]?.trim() : '';
  return first || direct;
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const { bucket, max, windowMs } = options;
  const maxEntries = Math.max(1, options.maxEntries ?? 10_000);
  const trustProxy = options.trustProxy === true;
  const now = options.now ?? Date.now;

  const hits = new Map<string, { count: number; reset: number }>();
  let lastSweep = 0;

  const sweep = (at: number) => {
    for (const [key, entry] of hits) {
      if (at > entry.reset) hits.delete(key);
    }
    lastSweep = at;
  };

  const evictOldest = () => {
    // Map preserves insertion order; the first key is the oldest bucket.
    const oldest = hits.keys().next();
    if (!oldest.done) hits.delete(oldest.value);
  };

  const check = (key: string): RateLimitDecision => {
    const at = now();
    if (hits.size >= maxEntries || at - lastSweep > windowMs) sweep(at);
    while (hits.size >= maxEntries) evictOldest();

    let entry = hits.get(key);
    if (!entry || at > entry.reset) {
      entry = { count: 0, reset: at + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      return {
        key,
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.reset - at) / 1000)),
      };
    }

    entry.count += 1;
    return {
      key,
      allowed: true,
      remaining: Math.max(0, max - entry.count),
      retryAfterSeconds: 0,
    };
  };

  const middleware = (req: Request, res: Response, next: NextFunction) => {
    const decision = check(`${bucket}:${clientKey(req, trustProxy)}`);
    if (decision.allowed) {
      next();
      return;
    }
    res.setHeader('Retry-After', String(decision.retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      error: 'Too many requests. Please wait a moment.',
    });
  };

  return {
    middleware,
    size: () => hits.size,
    reset: () => hits.clear(),
    check,
  };
}
