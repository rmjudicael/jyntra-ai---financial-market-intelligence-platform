import assert from 'node:assert';
import { fetchWithRetry } from '../src/server/providerRetry.ts';

const response = (status: number, headers: Record<string, string> = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  }) as unknown as Response;

const noSleep = async () => undefined;

async function run(
  responses: Array<Response | Error>,
  options: Parameters<typeof fetchWithRetry>[3] = {},
) {
  let calls = 0;
  const outcome = await fetchWithRetry(
    (async () => {
      const next = responses[Math.min(calls, responses.length - 1)];
      calls += 1;
      if (next instanceof Error) throw next;
      return next;
    }) as typeof fetch,
    'https://provider.test/v1/chat/completions',
    () => ({ method: 'POST', body: JSON.stringify({ call: calls }) }),
    { sleep: noSleep, random: () => 0, ...options },
  );
  return { outcome, calls };
}

/* 1. Transient 503 is retried and the next 200 is returned. */
{
  const { outcome, calls } = await run([response(503), response(200)]);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 2);
  assert.equal(calls, 2);
  assert.equal(outcome.ok && outcome.response.status, 200);
  console.log('providerRetry 1 PASS: 503 -> retry -> 200');
}

/* 2. Authentication errors are never retried. */
{
  const { outcome, calls } = await run([response(401), response(200)]);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
  assert.equal(outcome.ok && outcome.response.status, 401);
  console.log('providerRetry 2 PASS: 401 returned immediately');
}

/* 3. Network errors are retried, then surfaced after maxAttempts. */
{
  const { outcome, calls } = await run([new Error('ECONNRESET'), new Error('ECONNRESET')], {
    maxAttempts: 2,
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.attempts, 2);
  assert.equal(calls, 2);
  assert.match(String((outcome as any).error.message), /ECONNRESET/);
  console.log('providerRetry 3 PASS: network error retried then reported');
}

/* 4. Deliberate aborts are not retried (avoids doubling timeouts). */
{
  const abort = new Error('aborted');
  abort.name = 'AbortError';
  const { outcome, calls } = await run([abort, response(200)]);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
  console.log('providerRetry 4 PASS: AbortError not retried');
}

/* 5. Retry-After is honoured and capped; fresh init per attempt. */
{
  let calls = 0;
  const delays: number[] = [];
  const inits: RequestInit[] = [];
  const outcome = await fetchWithRetry(
    (async () => {
      calls += 1;
      return calls === 1 ? response(429, { 'retry-after': '99' }) : response(200);
    }) as typeof fetch,
    'https://provider.test/v1/chat/completions',
    () => {
      const init = { method: 'POST', body: String(calls) };
      inits.push(init);
      return init;
    },
    { sleep: async (ms) => { delays.push(ms); }, maxDelayMs: 1_000 },
  );
  assert.equal(outcome.ok, true);
  assert.deepEqual(delays, [1_000], 'Retry-After must be capped at maxDelayMs');
  assert.equal(inits.length, 2, 'each attempt must build a fresh RequestInit');
  assert.notEqual(inits[0].body, inits[1].body);
  console.log('providerRetry 5 PASS: Retry-After cap + fresh init');
}

/* 6. maxAttempts=1 disables retries entirely. */
{
  const { outcome, calls } = await run([response(500), response(200)], { maxAttempts: 1 });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
  console.log('providerRetry 6 PASS: maxAttempts=1 disables retry');
}

/* 7. excludeStatuses lets a caller keep its own fallback for e.g. 429. */
{
  const { outcome, calls } = await run([response(429), response(200)], {
    excludeStatuses: [429],
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
  assert.equal(outcome.ok && outcome.response.status, 429);
  console.log('providerRetry 7 PASS: excluded status returned without retry');
}

console.log('\nAll provider retry tests PASSED');
