import assert from 'node:assert';
import { createAiEngine, isChatModelId } from '../src/server/aiEngine';

const msgs = [{ role: 'user' as const, content: 'Bonjour' }];
const okJson = (text: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }), text: async () => text });
const errRes = (status: number) => ({ ok: false, status, json: async () => ({}), text: async () => '' });

// 1. Meta works -> META tier, first model.
{
  const e = createAiEngine({ fetchImpl: (async () => okJson('meta-ok')) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['muse-wonder-1.0'] });
  const r = await e.runChat(msgs); assert.equal(r.success, true); assert.equal(r.tier, 'META'); assert.equal(r.text, 'meta-ok');
}
// 2+3. Quota on model 1 -> alternate Meta model takes over.
{
  let n = 0;
  const e = createAiEngine({ fetchImpl: (async () => (++n === 1 ? errRes(429) : okJson('alt-ok'))) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1', 'm2'] });
  const r = await e.runChat(msgs); assert.equal(r.tier, 'META'); assert.equal(r.text, 'alt-ok'); assert.deepEqual(r.modelTried, ['m1', 'm2']);
}
// 4. All Meta fail -> Gemini.
{
  const e = createAiEngine({ fetchImpl: (async () => errRes(404)) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1'], geminiChat: async () => 'gemini-ok' });
  const r = await e.runChat(msgs); assert.equal(r.tier, 'GEMINI');
}
// 5. Gemini fails -> configured free-tier alternative (key required).
{
  const e = createAiEngine({ fetchImpl: (async () => errRes(500)) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1'], geminiChat: async () => { throw new Error('down'); }, freeAiChat: async () => 'free-ok' });
  const r = await e.runChat(msgs); assert.equal(r.tier, 'FREE'); assert.equal(r.text, 'free-ok');
}
// 6. Everything fails -> honest failure, never a simulated reply.
{
  const e = createAiEngine({ fetchImpl: (async () => errRes(503)) as any, metaKey: '', metaEndpoint: 'https://x/chat/completions', metaModels: [] });
  const r = await e.runChat(msgs); assert.equal(r.success, false);
}
// Non-chat ids are excluded from the chat chain.
assert.equal(isChatModelId('muse-voice-transcribe-1.0'), false);
assert.equal(isChatModelId('muse-image-1.0'), false);
assert.equal(isChatModelId('sam-3.1'), false);
assert.equal(isChatModelId('muse-spark-1.3'), true);
assert.equal(isChatModelId('muse-wonder-1.0'), true);

// Image generation: no provider configured -> honest failure, never simulated.
{
  const e = createAiEngine({ fetchImpl: (async () => okJson('x')) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1'] });
  const r = await e.runImage('un graphique'); assert.equal(r.success, false); assert.equal(r.reason, 'NO_IMAGE_PROVIDER_CONFIGURED');
}
// Successful model is reported (provider honesty: never misattributed).
{
  const e = createAiEngine({ fetchImpl: (async () => okJson('who')) as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['muse-wonder-1.0'] });
  const r = await e.runChat(msgs); assert.equal(r.model, 'muse-wonder-1.0'); assert.equal(r.tier, 'META');
}

// 401 (invalid key) must NOT burn the remaining models: chain stops at once.
{
  let calls = 0;
  const e = createAiEngine({ fetchImpl: (async () => { calls++; return errRes(401); }) as any, metaKey: 'bad', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1', 'm2', 'm3'], geminiChat: async () => 'gemini-after-401' });
  const r = await e.runChat(msgs); assert.equal(calls, 1); assert.equal(r.tier, 'GEMINI');
}
// Hung Meta call is cut by the per-call timeout and Gemini takes over.
{
  const hang = (_u: any, init: any) => new Promise((_res, rej) => { const t = setTimeout(() => rej(new Error('hang-settled')), 50); init?.signal?.addEventListener('abort', () => { clearTimeout(t); rej(new Error('aborted')); }); });
  const e = createAiEngine({ fetchImpl: hang as any, metaKey: 'k', metaEndpoint: 'https://x/chat/completions', metaModels: ['m1'], geminiChat: async () => 'gemini-after-timeout', timeoutMs: 30 });
  const r = await e.runChat(msgs); assert.equal(r.tier, 'GEMINI'); assert.equal(r.text, 'gemini-after-timeout');
}
// 7. SIMULATION: missing/invalid prerequisite blocks the dependent feature.
{
  const { isValidPriorAnalysis } = await import('../src/utils/prerequisites');
  assert.equal(isValidPriorAnalysis(null), false);
  assert.equal(isValidPriorAnalysis({ symbol: '', at: Date.now() }), false);
  assert.equal(isValidPriorAnalysis({ symbol: 'BTC/USDT', at: Date.now() - 25 * 3600 * 1000 }), false); // stale
  assert.equal(isValidPriorAnalysis({ symbol: 'BTC/USDT', timeframe: '1H', at: Date.now() }), true);
}
// 8. SIMULATION: independent deterministic features keep working while AI is down.
{
  const { calculateRisk } = await import('../src/utils/riskCalculator');
  const down = createAiEngine({ fetchImpl: (async () => errRes(503)) as any, metaKey: '', metaEndpoint: 'https://x/chat/completions', metaModels: [] });
  assert.equal((await down.runChat(msgs)).success, false);
  const risk = calculateRisk({ accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true });
  assert.equal(risk.isValid, true); assert.equal(risk.riskAmount, 100); assert.equal(risk.positionSize, 20); assert.equal(risk.riskRewardRatio, 2);
}
// Regression guard: the banned key-less service must never come back.
{
  const { readFileSync } = await import('node:fs');
  const banned = 'pollin' + 'ations'; // assembled so this guard itself stays grep-clean
  for (const f of ['../src/server/aiEngine.ts', '../server.ts', '../.env.example']) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8').toLowerCase();
    assert.equal(src.includes(banned), false, `${f} must not reference the banned service`);
    assert.equal(src.includes('free_text_api'), false, `${f} must not reference FREE_TEXT_API`);
    assert.equal(src.includes('free_image_api'), false, `${f} must not reference FREE_IMAGE_API`);
  }
}
console.log('aiEngine fallback tests: PASS (Meta, quota->alt Meta, Gemini, free-alt, all-down, 401-stop, timeout, prerequisite-block, AI-independent risk, image-honest, no-banned-service)');

