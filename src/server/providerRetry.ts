/**
 * Small, dependency-free retry helper for provider HTTP calls.
 *
 * It retries only transient failures (408/425/429/5xx and network errors),
 * never authentication or validation errors. Each attempt builds a fresh
 * RequestInit so per-attempt AbortSignal timeouts remain valid. `Retry-After`
 * is honoured and capped, and jitter avoids synchronised retries.
 */

export interface RetryOptions {
  /** Total attempts, including the first one. Default 2, clamped to 1..5. */
  maxAttempts?: number;
  /** First backoff delay. Default 250 ms. */
  baseDelayMs?: number;
  /** Upper bound for a single delay. Default 4,000 ms. */
  maxDelayMs?: number;
  /** Extra statuses to treat as transient. */
  retryStatuses?: number[];
  /** Statuses that must never be retried, even if transient by default. */
  excludeStatuses?: number[];
  /** Injectable for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

export type RetryOutcome =
  | { ok: true; response: Response; attempts: number }
  | { ok: false; error: unknown; attempts: number };

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryAfterMs(response: Response): number | null {
  const raw = response.headers?.get?.('retry-after');
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

function isTransientError(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name ?? '';
  // Aborts are deliberate (timeout or shutdown): do not multiply the wait.
  if (name === 'AbortError' || name === 'TimeoutError') return false;
  const message = String((error as { message?: string } | null)?.message ?? error ?? '');
  return /ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|socket hang up|fetch failed|network/i.test(
    message,
  );
}

export async function fetchWithRetry(
  fetchImpl: typeof fetch,
  url: string,
  makeInit: () => RequestInit,
  options: RetryOptions = {},
): Promise<RetryOutcome> {
  const maxAttempts = clamp(Math.floor(options.maxAttempts ?? 2), 1, 5);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 4_000);
  const retryStatuses = new Set([...DEFAULT_RETRY_STATUSES, ...(options.retryStatuses ?? [])]);
  const excludedStatuses = new Set(options.excludeStatuses ?? []);
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  const backoff = (attempt: number, retryAfter: number | null) => {
    if (retryAfter !== null) return clamp(retryAfter, 0, maxDelayMs);
    const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    // 50%..100% jitter keeps retries from synchronising across instances.
    return Math.round(exponential * (0.5 + random() * 0.5));
  };

  let lastError: unknown = new Error('retry: no attempt was made');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, makeInit());
      const transient = retryStatuses.has(response.status) && !excludedStatuses.has(response.status);
      if (response.ok || !transient || attempt === maxAttempts) {
        return { ok: true, response, attempts: attempt };
      }
      if (attempt < maxAttempts) await sleep(backoff(attempt, retryAfterMs(response)));
    } catch (error) {
      lastError = error;
      if (!isTransientError(error) || attempt === maxAttempts) {
        return { ok: false, error, attempts: attempt };
      }
      if (attempt < maxAttempts) await sleep(backoff(attempt, null));
    }
  }

  return { ok: false, error: lastError, attempts: maxAttempts };
}
