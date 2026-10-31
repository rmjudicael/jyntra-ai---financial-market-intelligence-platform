import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiEngine } from './aiEngine';

const base = {
  metaKey: 'k',
  metaEndpoint: 'https://provider.example/chat/completions',
  metaModels: ['muse-merveille-1.0', 'muse-spark-1.3'],
  freeTextBase: 'https://free.example/text',
  freeImageBase: 'https://free.example/image',
};
const jsonRes = (status: number, body: any) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('scenario 1: Meta primary model answers, nothing else is called', async () => {
  const calls: string[] = [];
  const engine = createAiEngine({ ...base, fetchImpl: (async (url: any, init: any) => { calls.push(JSON.parse(init.body).model); return jsonRes(200, { choices: [{ message: { content: 'ok-meta' } }] }); }) as any, geminiChat: async () => 'ok-gemini' });
  const r = await engine.runChat([{ role: 'user', content: 'hi' }]);
  assert.equal(r.success, true); assert.equal(r.text, 'ok-meta'); assert.equal(r.tier, 'META'); assert.deepEqual(calls, ['muse-merveille-1.0']);
});

test('scenario 2+3: Meta quota (429) -> alternate Meta model takes over', async () => {
  const engine = createAiEngine({ ...base, fetchImpl: (async (_u: any, init: any) => JSON.parse(init.body).model === 'muse-merveille-1.0' ? jsonRes(429, {}) : jsonRes(200, { choices: [{ message: { content: 'ok-alt' } }] })) as any });
  const r = await engine.runChat([{ role: 'user', content: 'hi' }]);
  assert.equal(r.text, 'ok-alt'); assert.equal(r.tier, 'META'); assert.deepEqual(r.modelTried, ['muse-merveille-1.0', 'muse-spark-1.3']);
});

test('scenario 4: all Meta fail -> Gemini takes over', async () => {
  const engine = createAiEngine({ ...base, fetchImpl: (async () => jsonRes(500, {})) as any, geminiChat: async () => 'ok-gemini' });
  const r = await engine.runChat([{ role: 'user', content: 'hi' }]);
  assert.equal(r.text, 'ok-gemini'); assert.equal(r.tier, 'GEMINI');
});

test('scenario 5: Gemini unavailable -> key-less free text service answers', async () => {
  const engine = createAiEngine({ ...base, metaKey: '', fetchImpl: (async (url: any) => new Response('ok-free', { status: 200 })) as any });
  const r = await engine.runChat([{ role: 'user', content: 'hi' }]);
  assert.equal(r.text, 'ok-free'); assert.equal(r.tier, 'FREE');
});

test('scenario 6: every tier fails -> honest failure, no fabricated text', async () => {
  const engine = createAiEngine({ ...base, fetchImpl: (async () => new Response('no', { status: 500 })) as any });
  const r = await engine.runChat([{ role: 'user', content: 'hi' }]);
  assert.equal(r.success, false); assert.equal(r.text, undefined);
});
