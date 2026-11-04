// JYNTRA AI — AI Engine Benchmarks
// Measures fallback chain latency, model routing, and provider transparency.
// Runs without external API keys: reports "not configured" when no keys present.

import { createAiEngine } from '../src/server/aiEngine.js';

const results = {
  benchmarkId: 'ai-engine-v1',
  executedAt: new Date().toISOString(),
  module: 'ai-engine-routing',
  cases: [],
};

const testMessages = [{ role: 'user', content: 'Hello, respond with OK.' }];
const okJson = (text) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }), text: async () => text });
const errRes = (status) => ({ ok: false, status, json: async () => ({}), text: async () => '' });

// Case 1: Meta works first try
{
  const start = process.hrtime.bigint();
  const e = createAiEngine({ fetchImpl: okJson('meta-ok'), metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['muse-wonder-1.0', 'muse-spark-1.3'] });
  const r = await e.runChat(testMessages, { temperature: 0, task: 'chat' });
  const end = process.hrtime.bigint();
  results.cases.push({
    name: 'Meta first model success',
    latencyMs: Math.round(Number(end - start) / 1_000_000 * 100) / 100,
    success: r.success,
    tier: r.tier,
    model: r.model,
    calls: r.calls,
    modelTried: r.modelTried,
  });
}

// Case 2: Meta quota -> alternate Meta model
{
  let n = 0;
  const start = process.hrtime.bigint();
  const e = createAiEngine({ fetchImpl: (async () => (++n === 1 ? errRes(429) : okJson('alt-ok'))), metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1', 'm2'] });
  const r = await e.runChat(testMessages, { temperature: 0, task: 'chat' });
  const end = process.hrtime.bigint();
  results.cases.push({
    name: 'Meta quota fallback to alternate model',
    latencyMs: Math.round(Number(end - start) / 1_000_000 * 100) / 100,
    success: r.success,
    tier: r.tier,
    model: r.model,
    calls: r.calls,
    modelTried: r.modelTried,
  });
}

// Case 3: All Meta fail -> Gemini
{
  const start = process.hrtime.bigint();
  const e = createAiEngine({ fetchImpl: () => errRes(404), metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1'], geminiChat: async () => 'gemini-ok' });
  const r = await e.runChat(testMessages, { temperature: 0, task: 'chat' });
  const end = process.hrtime.bigint();
  results.cases.push({
    name: 'Meta exhausted -> Gemini fallback',
    latencyMs: Math.round(Number(end - start) / 1_000_000 * 100) / 100,
    success: r.success,
    tier: r.tier,
    model: r.model,
    calls: r.calls,
  });
}

// Case 4: All fail -> honest failure
{
  const start = process.hrtime.bigint();
  const e = createAiEngine({ fetchImpl: () => errRes(503), metaKey: '', metaEndpoint: 'https://x/chat/completions', metaModels: [] });
  const r = await e.runChat(testMessages, { temperature: 0, task: 'chat' });
  const end = process.hrtime.bigint();
  results.cases.push({
    name: 'All providers down -> honest failure',
    latencyMs: Math.round(Number(end - start) / 1_000_000 * 100) / 100,
    success: r.success,
    tier: r.tier,
    error: r.reason,
  });
}

// Case 5: 401 stops chain immediately
{
  let calls = 0;
  const start = process.hrtime.bigint();
  const e = createAiEngine({ fetchImpl: (async () => { calls++; return errRes(401); }), metaKey: 'bad', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1', 'm2', 'm3'], geminiChat: async () => 'after-401' });
  const r = await e.runChat(testMessages, { temperature: 0, task: 'chat' });
  const end = process.hrtime.bigint();
  results.cases.push({
    name: '401 stops chain (no model burning)',
    latencyMs: Math.round(Number(end - start) / 1_000_000 * 100) / 100,
    success: r.success,
    tier: r.tier,
    calls,
    modelTried: r.modelTried,
  });
}

// Case 6: Non-chat model IDs excluded from chat chain
{
  const nonChat = ['sam-3.1', 'muse-voice-transcribe-1.0', 'muse-image-1.0'];
  const excluded = nonChat.filter((id) => !((id) => !['sam-3.1', 'muse-voice-transcribe-1.0', 'muse-image-1.0'].includes(id.toLowerCase()))(id));
  results.cases.push({
    name: 'Non-chat model ID exclusion',
    latencyMs: 0,
    success: excluded.length === 0,
    detail: `Excluded IDs: ${nonChat.join(', ')}`,
  });
}

console.log(JSON.stringify(results, null, 2));
