import assert from 'node:assert';
import { clientKey, createRateLimiter } from '../server/rateLimit.ts';

type FakeRequest = {
  socket: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
};

function request(ip: string, forwarded?: string): FakeRequest {
  return {
    socket: { remoteAddress: ip },
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
  };
}

function response() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
  };
  res.setHeader = (name: string, value: string) => {
    res.headers[name] = value;
    return res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

function run(limiter: ReturnType<typeof createRateLimiter>, ip: string) {
  const res = response();
  let nextCalls = 0;
  limiter.middleware(request(ip) as any, res as any, () => {
    nextCalls += 1;
  });
  return { res, nextCalls };
}

/* 1. Allows up to max requests, then rejects with Retry-After. */
{
  const limiter = createRateLimiter({ bucket: 'chat', max: 2, windowMs: 60_000 });
  assert.equal(run(limiter, '10.0.0.1').nextCalls, 1);
  assert.equal(run(limiter, '10.0.0.1').nextCalls, 1);
  const blocked = run(limiter, '10.0.0.1');
  assert.equal(blocked.nextCalls, 0);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.body.code, 'RATE_LIMITED');
  assert.ok(Number(blocked.res.headers['Retry-After']) >= 1);
  assert.equal(run(limiter, '10.0.0.2').nextCalls, 1, 'other clients keep their own bucket');
  console.log('rateLimit 1 PASS: per-client limit + Retry-After');
}

/* 2. The window expires and the client is allowed again. */
{
  let clock = 1_000;
  const limiter = createRateLimiter({ bucket: 'chat', max: 1, windowMs: 5_000, now: () => clock });
  assert.equal(run(limiter, '10.0.0.3').nextCalls, 1);
  clock += 4_999;
  assert.equal(run(limiter, '10.0.0.3').nextCalls, 0);
  clock += 2;
  assert.equal(run(limiter, '10.0.0.3').nextCalls, 1);
  console.log('rateLimit 2 PASS: window reset');
}

/* 3. X-Forwarded-For is ignored unless TRUST_PROXY is enabled. */
{
  const direct = request('10.0.0.4', '203.0.113.9');
  assert.equal(clientKey(direct as any, false), '10.0.0.4');
  assert.equal(clientKey(direct as any, true), '203.0.113.9');
  assert.equal(clientKey(request('10.0.0.4', '203.0.113.9, 10.0.0.1') as any, true), '203.0.113.9');
  assert.equal(clientKey(request('10.0.0.4', '') as any, true), '10.0.0.4');
  console.log('rateLimit 3 PASS: proxy header only trusted explicitly');
}

/* 4. Tracked clients stay bounded; oldest entries are evicted. */
{
  const limiter = createRateLimiter({ bucket: 'chat', max: 10, windowMs: 60_000, maxEntries: 3 });
  for (let i = 0; i < 20; i += 1) run(limiter, `10.0.0.${i}`);
  assert.ok(limiter.size() <= 3, `expected <= 3 tracked clients, got ${limiter.size()}`);
  console.log('rateLimit 4 PASS: bounded map size');
}

/* 5. check() is pure and reports remaining quota. */
{
  const limiter = createRateLimiter({ bucket: 'chat', max: 2, windowMs: 60_000 });
  assert.deepEqual(limiter.check('k').remaining, 1);
  assert.deepEqual(limiter.check('k').remaining, 0);
  const denied = limiter.check('k');
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfterSeconds > 0);
  limiter.reset();
  assert.equal(limiter.size(), 0);
  console.log('rateLimit 5 PASS: check() + reset()');
}

console.log('\nAll rate-limit tests PASSED');
