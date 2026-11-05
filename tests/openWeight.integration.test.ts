/**
 * JYNTRA AI — Open-weight partner integration test (real local HTTP).
 *
 * Unlike tests/openWeight.test.ts (fetch mocked in-process), this suite starts
 * a real HTTP server that speaks the OpenAI-compatible chat-completions
 * contract, then drives the engine through the real global fetch. It proves:
 *  - the adapter builds a valid HTTP request (path, auth, JSON body);
 *  - a real response is parsed with model/hosting/usage provenance;
 *  - a real 429 is classified as quota;
 *  - the request is never sent when no key is configured.
 *
 * This is a local integration test, not a live partner call: no external
 * network and no API key are used.
 */
import assert from 'node:assert';
import http from 'node:http';
import { createAiEngine } from '../src/server/aiEngine.ts';

interface SeenRequest {
  method?: string;
  url?: string;
  authorization?: string;
  body?: any;
}

function startServer(handler: (seen: SeenRequest) => { status: number; body: any }) {
  const seen: SeenRequest[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const record: SeenRequest = {
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: raw ? JSON.parse(raw) : undefined,
      };
      seen.push(record);
      const reply = handler(record);
      res.writeHead(reply.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(reply.body));
    });
  });
  return new Promise<{ server: http.Server; port: number; seen: SeenRequest[] }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, port, seen });
    });
  });
}

/* ------------------------------------------------------------------ */
/* 1. Real HTTP success + provenance                                  */
/* ------------------------------------------------------------------ */
{
  const { server, port, seen } = await startServer(() => ({
    status: 200,
    body: {
      id: 'chatcmpl-local-1',
      model: 'meta-models/muse-spark-open-1026',
      choices: [{ message: { role: 'assistant', content: '{"agreement":true,"severity":"LOW","verdict":"BUY","concerns":[]}' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 88, completion_tokens: 32, total_tokens: 120 },
    },
  }));

  try {
    const engine = createAiEngine({
      fetchImpl: fetch,
      metaKey: '',
      metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
      metaModels: [],
      openWeight: {
        provider: 'local',
        apiKey: '',
        baseUrl: `http://127.0.0.1:${port}/v1`,
        modelId: 'meta-models/muse-spark-open-1026',
      },
    });

    const result = await engine.runOpenWeight([{ role: 'user', content: 'audit' }], { maxTokens: 512 });

    assert.equal(result.success, true);
    assert.equal(result.model, 'meta-models/muse-spark-open-1026');
    assert.equal(result.provider, 'meta');
    assert.equal(result.hosting, 'local');
    assert.equal(result.openWeight, true);
    assert.equal(result.usage?.totalTokens, 120);
    assert.ok(result.latencyMs !== undefined && result.latencyMs >= 0);

    assert.equal(seen.length, 1, 'exactly one HTTP request');
    assert.equal(seen[0].method, 'POST');
    assert.equal(seen[0].url, '/v1/chat/completions');
    assert.equal(seen[0].body.model, 'meta-models/muse-spark-open-1026');
    assert.equal(seen[0].body.max_tokens, 512);
    assert.equal(seen[0].body.stream, false);
    assert.equal(seen[0].body.messages[0].content, 'audit');
    console.log('Test open-weight integration 1 PASS: real HTTP request/response + provenance');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/* ------------------------------------------------------------------ */
/* 2. Real HTTP 429 -> quota, no throw                                */
/* ------------------------------------------------------------------ */
{
  const { server, port, seen } = await startServer(() => ({ status: 429, body: { error: { message: 'rate limited' } } }));
  try {
    const engine = createAiEngine({
      fetchImpl: fetch,
      metaKey: '',
      metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
      metaModels: [],
      openWeight: {
        provider: 'together',
        apiKey: 'integration-key',
        baseUrl: `http://127.0.0.1:${port}/v1`,
        modelId: 'meta-models/muse-spark-open-1026',
      },
    });
    const result = await engine.runOpenWeight([{ role: 'user', content: 'audit' }]);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'OPEN_WEIGHT_QUOTA');
    assert.equal(result.errorCategory, 'quota');
    assert.equal(seen[0].authorization, 'Bearer integration-key');
    console.log('Test open-weight integration 2 PASS: 429 classified as quota over real HTTP');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/* ------------------------------------------------------------------ */
/* 3. No key -> no request at all                                     */
/* ------------------------------------------------------------------ */
{
  let requests = 0;
  const { server, port } = await startServer(() => { requests += 1; return { status: 200, body: {} }; });
  try {
    // Config points at a reachable server, but the remote provider has no key.
    const engine = createAiEngine({
      fetchImpl: fetch,
      metaKey: '',
      metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
      metaModels: [],
      openWeight: {
        provider: 'together',
        apiKey: '',
        baseUrl: `http://127.0.0.1:${port}/v1`,
        modelId: 'meta-models/muse-spark-open-1026',
      },
    });
    const result = await engine.runOpenWeight([{ role: 'user', content: 'audit' }]);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'OPEN_WEIGHT_KEY_MISSING');
    assert.equal(requests, 0, 'no network request without a key');
    console.log('Test open-weight integration 3 PASS: missing key -> no request');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

console.log('\nAll open-weight integration tests PASSED');
