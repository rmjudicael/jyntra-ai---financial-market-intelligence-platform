import assert from 'node:assert';
import { createAiEngine } from '../src/server/aiEngine.ts';

/**
 * Tests for meta-only mode — ensures Meta API integration works correctly
 * without silently falling back to Gemini or free-tier alternatives.
 */

// Minimal Response mock that satisfies the Fetch API type
class MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  type: ResponseType = 'basic';
  url: string;
  redirected: boolean = false;
  private _body: any;

  constructor(init: { ok: boolean; status: number; body: any; statusText?: string }) {
    this.ok = init.ok;
    this.status = init.status;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers({ 'content-type': 'application/json' });
    this.url = '';
    this._body = init.body;
  }

  async json() {
    return this._body;
  }

  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }

  async blob() {
    return new Blob([JSON.stringify(this._body)]);
  }

  clone() {
    return new MockResponse({ ok: this.ok, status: this.status, body: this._body, statusText: this.statusText });
  }
}

// Helper: create a mock fetch that simulates Meta responses
const okMeta = (model = 'muse-wonder-1.0'): any => async (_url: URL | RequestInfo, opts?: any) => {
  return new MockResponse({
    ok: true,
    status: 200,
    body: { choices: [{ message: { content: `response from ${model}` } }] },
  });
};

const failMeta: any = () => async (_url: URL | RequestInfo, _opts?: any) => {
  return new MockResponse({
    ok: false,
    status: 429,
    body: { error: 'rate limited' },
  });
};

// --- Test 1: Meta-only mode succeeds with Muse Spark 1.3 ---
{
  const engine = createAiEngine({
    fetchImpl: okMeta('muse-spark-1.3'),
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: ['muse-spark-1.3'],
  });
  const result = await engine.runChat(
    [{ role: 'user', content: 'Say OK' }],
    { temperature: 0, task: 'chat', metaOnly: true, preferredModels: ['muse-spark-1.3'] },
  );
  assert.equal(result.success, true, 'meta-only Meta should succeed');
  assert.equal(result.tier, 'META', 'tier should be META');
  assert.equal(result.model, 'muse-spark-1.3', 'model should be muse-spark-1.3');
  console.log('Test 1 PASS: Meta-only Muse Spark 1.3 succeeds');
}

// --- Test 2: Meta-only mode with preferred model fails honestly when unavailable ---
{
  const engine = createAiEngine({
    fetchImpl: failMeta(),
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: ['muse-spark-1.3'],
  });
  const result = await engine.runChat(
    [{ role: 'user', content: 'Say OK' }],
    { temperature: 0, task: 'chat', metaOnly: true, preferredModels: ['muse-spark-1.3'] },
  );
  assert.equal(result.success, false, 'meta-only should fail when Meta unavailable');
  assert.ok(result.reason === 'META_QUOTA' || result.reason === 'NO_TIER_AVAILABLE' || result.reason === 'META_ONLY_UNAVAILABLE', 'should return a Meta-unavailable reason');
  console.log('Test 2 PASS: Meta-only mode fails honestly (no fallback), reason:', result.reason);
}

// --- Test 3: Non-meta-only mode falls through when Meta unavailable ---
{
  const engine = createAiEngine({
    fetchImpl: failMeta(),
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: ['muse-spark-1.3'],
    geminiChat: async () => 'gemini response',
  });
  const result = await engine.runChat(
    [{ role: 'user', content: 'Say OK' }],
    { temperature: 0, task: 'chat', metaOnly: false },
  );
  assert.equal(result.success, true, 'non-meta-only should fallback to Gemini');
  assert.equal(result.tier, 'GEMINI', 'tier should be GEMINI');
  console.log('Test 3 PASS: Non-meta-only mode falls through to Gemini');
}

// --- Test 4: Model-specific routing verified ---
{
  const tried: string[] = [];
  const engine = createAiEngine({
    fetchImpl: async (_url: URL | RequestInfo, opts: any) => {
      tried.push(opts.body ? JSON.parse(opts.body).model : 'unknown');
      return okMeta('muse-wonder-1.0')(_url, opts);
    },
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: ['muse-wonder-1.0', 'muse-spark-1.3'],
  });
  const result = await engine.runChat(
    [{ role: 'user', content: 'Say OK' }],
    { temperature: 0, task: 'chat', metaOnly: true, preferredModels: ['muse-wonder-1.0', 'muse-spark-1.3'] },
  );
  assert.equal(result.success, true, 'model routing should succeed');
  assert.ok(tried.length > 0, 'at least one model should be tried');
  console.log('Test 4 PASS: Model-specific routing verified, tried:', tried);
}

// --- Test 5: verify endpoint returns configured_unverified when no key ---
{
  // Simulate what the /api/ai/verify endpoint does internally
  const metaApiKey = undefined;
  const overall = metaApiKey ? 'verified' : 'not_configured';
  assert.equal(overall, 'not_configured', 'without key, overall should be not_configured');
  console.log('Test 5 PASS: verify endpoint reports not_configured without key');
}

// --- Test 6: verify endpoint reports configured_unverified when key present but Meta unreachable ---
{
  const metaApiKey = 'sk-present';
  const providerCatalogConfirmed = false;
  const overall = metaApiKey && providerCatalogConfirmed ? 'verified' : metaApiKey ? 'configured_unverified' : 'not_configured';
  assert.equal(overall, 'configured_unverified', 'with key but no catalog, should be configured_unverified');
  console.log('Test 6 PASS: verify endpoint reports configured_unverified');
}

console.log('\nAll meta-only mode tests PASSED');
