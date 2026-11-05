/**
 * JYNTRA AI — Meta open-weight inference tests.
 *
 * Verifies the hosted-partner contract (Together / Fireworks / Baseten) and
 * the local OpenAI-compatible path WITHOUT any real network call:
 *  - exact endpoint, model id, auth header and request body;
 *  - repeated results are attributed to the real model + hosting partner;
 *  - a non-Meta checkpoint is refused before any request is sent;
 *  - quota / network errors are classified honestly;
 *  - provider counters and cross-check prompts are correct.
 */
import assert from 'node:assert';
import { createAiEngine, type OpenWeightConfig } from '../src/server/aiEngine.ts';

const MODEL = 'meta-models/muse-spark-open-1026';

function baseConfig(overrides: Partial<OpenWeightConfig> = {}): OpenWeightConfig {
  return {
    provider: 'together',
    apiKey: 'test-open-weight-key',
    baseUrl: 'https://api.together.xyz/v1',
    modelId: MODEL,
    ...overrides,
  };
}

const okResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    choices: [{ message: { content: text } }],
    usage: { prompt_tokens: 120, completion_tokens: 42, total_tokens: 162 },
  }),
});

/* ------------------------------------------------------------------ */
/* 1. Not configured -> honest failure, zero network call             */
/* ------------------------------------------------------------------ */
{
  let fetched = 0;
  const engine = createAiEngine({
    fetchImpl: (async () => { fetched++; return okResponse('x') as any; }) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
  });
  const r = await engine.runOpenWeight([{ role: 'user', content: 'hello' }]);
  assert.equal(r.success, false);
  assert.equal(r.reason, 'OPEN_WEIGHT_NOT_CONFIGURED');
  assert.equal(fetched, 0, 'no request must be sent when unconfigured');
  assert.equal(engine.openWeightStatus().configured, false);
  console.log('Test open-weight 1 PASS: unconfigured -> honest failure, no request');
}

/* ------------------------------------------------------------------ */
/* 2. Together partner -> real endpoint + full provenance             */
/* ------------------------------------------------------------------ */
{
  const captured: { value?: { url: string; init: any } } = {};
  const engine = createAiEngine({
    fetchImpl: (async (url: any, init: any) => {
      captured.value = { url: String(url), init };
      return okResponse('{"agreement":true,"severity":"LOW","verdict":"BUY","concerns":[]}') as any;
    }) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
    openWeight: baseConfig(),
  });

  const r = await engine.runOpenWeight([{ role: 'user', content: 'audit this' }], { temperature: 0.1, maxTokens: 700 });

  assert.equal(r.success, true);
  assert.equal(r.model, MODEL);
  assert.equal(r.provider, 'meta');
  assert.equal(r.hosting, 'together');
  assert.equal(r.openWeight, true);
  assert.equal(r.tier, 'META');
  assert.equal(r.errorCategory, 'none');
  assert.ok(r.latencyMs !== undefined && r.latencyMs >= 0);
  assert.deepEqual(r.usage, { promptTokens: 120, completionTokens: 42, totalTokens: 162 });

  assert.ok(captured.value, 'request must be captured');
  assert.equal(captured.value!.url, 'https://api.together.xyz/v1/chat/completions');
  assert.equal(captured.value!.init.method, 'POST');
  assert.equal(captured.value!.init.headers.Authorization, 'Bearer test-open-weight-key');
  const body = JSON.parse(captured.value!.init.body);
  assert.equal(body.model, MODEL);
  assert.equal(body.max_tokens, 700);
  assert.equal(body.stream, false);
  assert.equal(body.messages[0].content, 'audit this');

  const metrics = engine.metrics();
  assert.equal(metrics.providers.openweight.success, 1, 'provider counter must record the success');
  assert.equal(metrics.openWeight.configured, true);
  console.log('Test open-weight 2 PASS: Together endpoint, model, auth, usage, provenance verified');
}

/* ------------------------------------------------------------------ */
/* 3. Fireworks / Baseten base URLs are normalised                    */
/* ------------------------------------------------------------------ */
{
  for (const [provider, baseUrl, expected] of [
    ['fireworks', 'https://api.fireworks.ai/inference/v1', 'https://api.fireworks.ai/inference/v1/chat/completions'],
    ['baseten', 'https://inference.baseten.co/v1', 'https://inference.baseten.co/v1/chat/completions'],
    ['local', 'http://127.0.0.1:8000/v1', 'http://127.0.0.1:8000/v1/chat/completions'],
  ] as const) {
    let url = '';
    const engine = createAiEngine({
      fetchImpl: (async (u: any) => { url = String(u); return okResponse('ok') as any; }) as any,
      metaKey: '',
      metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
      metaModels: [],
      openWeight: baseConfig({ provider: provider as any, baseUrl, apiKey: provider === 'local' ? '' : 'k' }),
    });
    const r = await engine.runOpenWeight([{ role: 'user', content: 'hi' }]);
    assert.equal(r.success, true, `${provider} should succeed`);
    assert.equal(url, expected, `${provider} endpoint mismatch`);
    assert.equal(r.hosting, provider);
  }
  console.log('Test open-weight 3 PASS: Fireworks, Baseten and local endpoints normalised');
}

/* ------------------------------------------------------------------ */
/* 4. Non-Meta checkpoint refused before any request                  */
/* ------------------------------------------------------------------ */
{
  let fetched = 0;
  const engine = createAiEngine({
    fetchImpl: (async () => { fetched++; return okResponse('x') as any; }) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
    openWeight: baseConfig({ provider: 'together', modelId: 'mistralai/mixtral-8x7b' }),
  });
  const r = await engine.runOpenWeight([{ role: 'user', content: 'hi' }]);
  assert.equal(r.success, false);
  assert.equal(r.reason, 'NON_META_MODEL_REJECTED');
  assert.equal(fetched, 0, 'non-Meta model must be refused before network');
  assert.equal(engine.openWeightStatus().configured, false);
  console.log('Test open-weight 4 PASS: non-Meta checkpoint rejected (no proprietary SDK drift)');
}

/* ------------------------------------------------------------------ */
/* 5. Quota + network errors classified, no crash                     */
/* ------------------------------------------------------------------ */
{
  const quota = createAiEngine({
    fetchImpl: (async () => ({ ok: false, status: 429, json: async () => ({}) })) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
    openWeight: baseConfig(),
  });
  const rq = await quota.runOpenWeight([{ role: 'user', content: 'hi' }]);
  assert.equal(rq.success, false);
  assert.equal(rq.reason, 'OPEN_WEIGHT_QUOTA');
  assert.equal(rq.errorCategory, 'quota');

  const network = createAiEngine({
    fetchImpl: (async () => { throw new Error('ECONNREFUSED'); }) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
    openWeight: baseConfig(),
  });
  const rn = await network.runOpenWeight([{ role: 'user', content: 'hi' }]);
  assert.equal(rn.success, false);
  assert.equal(rn.reason, 'OPEN_WEIGHT_NETWORK');
  assert.equal(rn.errorCategory, 'network');
  assert.equal(network.metrics().providers.openweight.failure, 1);
  console.log('Test open-weight 5 PASS: quota and network errors classified');
}

/* ------------------------------------------------------------------ */
/* 6. crossCheck sends an auditor contract and keeps provenance       */
/* ------------------------------------------------------------------ */
{
  let systemPrompt = '';
  const engine = createAiEngine({
    fetchImpl: (async (_u: any, init: any) => {
      const body = JSON.parse(init.body);
      systemPrompt = body.messages[0].content;
      return okResponse('{"agreement":false,"severity":"HIGH","verdict":"NO_TRADE","concerns":["R:R invalid"]}') as any;
    }) as any,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1/chat/completions',
    metaModels: [],
    openWeight: baseConfig({ provider: 'fireworks', baseUrl: 'https://api.fireworks.ai/inference/v1' }),
  });
  const r = await engine.crossCheck('{"verdict":"BUY"}');
  assert.equal(r.success, true);
  assert.equal(r.hosting, 'fireworks');
  assert.match(r.text || '', /"verdict":"NO_TRADE"/);
  assert.match(systemPrompt, /independent auditor/i);
  assert.match(systemPrompt, /strict JSON/i);
  assert.match(systemPrompt, /contradictions/i);
  console.log('Test open-weight 6 PASS: cross-check contract + provenance');
}

console.log('\nAll Meta open-weight tests PASSED');
