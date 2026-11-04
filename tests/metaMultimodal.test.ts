import assert from 'node:assert';
import { createAiEngine } from '../src/server/aiEngine.ts';

/**
 * Tests pour les modèles Meta multimodaux (SAM 3.1, Muse Image 1.0, Muse Voice Transcribe 1.0)
 * et pour le système de capacités (capabilities).
 * Aucun appel API externe n'est effectué : on vérifie que les bons identifiants,
 * endpoints et formats de requête sont utilisés.
 */

/* ========================================================================
   1. SAM 3.1 — segmentation/détection visuelle via /v1/responses
   ======================================================================== */

{
  let capturedBody: any = null;
  const engine = createAiEngine({
    fetchImpl: async (_url: URL | RequestInfo, init: any) => {
      capturedBody = JSON.parse(init.body);
      // SSE stream: each event line prefixed with "data: "
      const outputText = '<1f>1<|box;x1=10;y1=20;x2=100;y2=200;w=90;h=180;c=0.95|><|mask;x=0;y=0;c=0.92;data=4,4,~!ABAB|>';
      const encoder = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          const chunks = [`data: ${JSON.stringify({ type: 'response.output_text.delta', delta: outputText })}\n\n`, 'data: [DONE]\n\n'];
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      });
      return new Response(body as unknown as BodyInit, { status: 200, headers: { 'content-type': 'application/json' } });
    },
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1/responses',
    metaModels: ['sam-3.1'],
  });

  const result = await engine.runSegmentation('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

  assert.equal(result.success, true, 'SAM 3.1 segmentation should succeed');
  assert.equal(result.tier, 'META', 'SAM tier should be META');
  assert.equal(result.model, 'sam-3.1', 'SAM model id should be sam-3.1');
  assert.ok(Array.isArray(result.boxes), 'boxes should be an array');
  assert.equal(result.boxes.length, 1, 'should detect 1 box');
  assert.equal(result.boxes[0].label, 'zone', 'box label should be zone');
  assert.ok(result.boxes[0].width > 0, 'box width should be positive');
  assert.ok(result.boxes[0].height > 0, 'box height should be positive');
  assert.ok(result.maskCount !== undefined && result.maskCount >= 0, 'maskCount should be defined');
  assert.ok(result.latencyMs !== undefined && result.latencyMs >= 0, 'latency should be tracked');

  // Verify the request body sent to Meta
  assert.equal(capturedBody.model, 'sam-3.1', 'request model should be sam-3.1');
  assert.equal(capturedBody.stream, true, 'SAM should use streaming');
  assert.ok(capturedBody.input, 'request should have input');
  console.log('Test SAM-3.1 PASS: segmentation via /v1/responses, boxes + masks decoded');
}

/* ========================================================================
   2. Muse Image 1.0 — génération d'image via /v1/images/generations
   ======================================================================== */

{
  let capturedBody: any = null;
  const engine = createAiEngine({
    fetchImpl: async (_url: URL | RequestInfo, init: any) => {
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }],
      }), { headers: { 'content-type': 'application/json' } });
    },
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-image-1.0'],
  });

  const result = await engine.runImage('TradingView chart annotation for BTC/USDT');

  assert.equal(result.success, true, 'Muse Image should succeed');
  assert.equal(result.tier, 'META', 'Muse Image tier should be META');
  assert.equal(result.model, 'muse-image-1.0', 'Muse Image model id');
  assert.ok(result.imageUrl, 'imageUrl should be present');
  assert.ok(result.imageUrl.startsWith('data:'), 'imageUrl should be a data URL');
  assert.ok(result.latencyMs !== undefined && result.latencyMs >= 0, 'latency should be tracked');

  assert.equal(capturedBody.model, 'muse-image-1.0', 'request model should be muse-image-1.0');
  assert.equal(capturedBody.n, 1, 'n should be 1');
  assert.ok(capturedBody.prompt, 'prompt should be present');
  console.log('Test Muse-Image-1.0 PASS: generation via /v1/images/generations');
}

/* ========================================================================
   3. Muse Voice Transcribe 1.0 — transcription via /v1/asr/transcribe
   ======================================================================== */

{
  // Route ASR unavailable (404) -> isTranscriptionAvailable returns false
  const engine = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 404 }) as Response,
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-voice-transcribe-1.0'],
  });

  const audioBlob = new Blob([new Uint8Array([82, 73, 70, 76])], { type: 'audio/wav' });
  const result = await engine.transcribe(audioBlob, 'fr');

  assert.equal(result.success, false, 'transcribe should fail when ASR route unavailable');
  assert.equal(result.reason, 'TRANSCRIPTION_ENDPOINT_UNAVAILABLE', 'should report endpoint unavailable');
  console.log('Test Muse-Voice-Transcribe-1.0 PASS: honest failure when ASR route unavailable (no ffmpeg dependency)');
}

/* ========================================================================
   4. isTranscriptionAvailable — probe Meta ASR route
   ======================================================================== */

{
  // Route available (status != 404, != 405)
  const engine1 = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 200 }) as Response,
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-voice-transcribe-1.0'],
  });
  assert.equal(await engine1.isTranscriptionAvailable(), true, 'isTranscriptionAvailable should return true when route responds 200');

  // Route not found (404)
  const engine2 = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 404 }) as Response,
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-voice-transcribe-1.0'],
  });
  assert.equal(await engine2.isTranscriptionAvailable(), false, 'isTranscriptionAvailable should return false when 404');

  // No key configured
  const engine3 = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 200 }) as Response,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: [],
  });
  assert.equal(await engine3.isTranscriptionAvailable(), false, 'isTranscriptionAvailable should return false without key');

  console.log('Test isTranscriptionAvailable PASS: probe logic correct');
}

/* ========================================================================
   5. capabilities() — système de vérification déclarée/configurée/accessible
   ======================================================================== */

{
  const engine = createAiEngine({
    fetchImpl: async () => new Response(JSON.stringify({ data: [] }) as any) as Response,
    metaKey: 'sk-test-123',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-spark-1.3', 'muse-wonder-1.0', 'sam-3.1', 'muse-image-1.0', 'muse-voice-transcribe-1.0'],
    geminiChat: async () => 'gemini response',
    geminiImage: async () => ({ dataUrl: 'data:image/png;base64,test' }),
    geminiTranscribe: async () => 'gemini transcript',
    freeAiChat: undefined,
  });

  const caps = await engine.capabilities();

  assert.equal(caps.chat, true, 'chat capability should be true');
  assert.equal(caps.vision, true, 'vision capability should be true');
  assert.equal(caps.image, true, 'image capability should be true');
  assert.equal(caps.segmentation, true, 'segmentation capability should be true');
  assert.equal(caps.transcription, true, 'transcription capability should be true');
  assert.equal(caps.tiers.meta, true, 'meta tier should be available');
  assert.equal(caps.tiers.gemini, true, 'gemini tier should be available');
  assert.equal(caps.tiers.free, false, 'free tier should NOT be available (no key)');
  assert.equal(caps.models.reasoning, 'muse-spark-1.3', 'reasoning model should be muse-spark-1.3');
  assert.equal(caps.models.vision, 'muse-spark-1.3', 'vision model should be muse-spark-1.3');
  assert.equal(caps.models.image, 'muse-image-1.0', 'image model should be muse-image-1.0');
  assert.equal(caps.models.segmentation, 'sam-3.1', 'segmentation model should be sam-3.1');
  assert.equal(caps.models.transcription, 'muse-voice-transcribe-1.0', 'transcription model should be muse-voice-transcribe-1.0');

  console.log('Test capabilities() PASS: all Meta models declared and accessible');
}

/* ========================================================================
   6. NON_CHAT_MODEL_IDS — SAM 3.1, Muse Image, Muse Voice excluded from chat
   ======================================================================== */

{
  const { NON_CHAT_MODEL_IDS, isChatModelId } = await import('../src/server/aiEngine.ts');

  assert.ok(NON_CHAT_MODEL_IDS.includes('sam-3.1'), 'sam-3.1 should be non-chat');
  assert.ok(NON_CHAT_MODEL_IDS.includes('muse-image-1.0'), 'muse-image-1.0 should be non-chat');
  assert.ok(NON_CHAT_MODEL_IDS.includes('muse-voice-transcribe-1.0'), 'muse-voice-transcribe-1.0 should be non-chat');
  assert.equal(isChatModelId('muse-spark-1.3'), true, 'muse-spark-1.3 should be a chat model');
  assert.equal(isChatModelId('sam-3.1'), false, 'sam-3.1 should NOT be a chat model');
  assert.equal(isChatModelId('muse-image-1.0'), false, 'muse-image-1.0 should NOT be a chat model');
  assert.equal(isChatModelId('muse-voice-transcribe-1.0'), false, 'muse-voice-transcribe-1.0 should NOT be a chat model');

  console.log('Test NON_CHAT_MODEL_IDS PASS: non-chat models correctly excluded');
}

/* ========================================================================
   7. Meta-only mode on segmentation and image — no fallback
   ======================================================================== */

{
  // Segmentation without metaKey should fail honestly
  const engine1 = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 200 }) as Response,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['sam-3.1'],
  });
  const segResult = await engine1.runSegmentation('data:image/png;base64,test');
  assert.equal(segResult.success, false, 'segmentation without key should fail');
  assert.equal(segResult.reason, 'SEGMENTATION_NOT_CONFIGURED', 'should report not configured');

  // Image generation without key should fail honestly
  const engine2 = createAiEngine({
    fetchImpl: async () => new Response(null, { status: 200 }) as Response,
    metaKey: '',
    metaEndpoint: 'https://api.meta.ai/v1',
    metaModels: ['muse-image-1.0'],
  });
  const imgResult = await engine2.runImage('test prompt');
  assert.equal(imgResult.success, false, 'image gen without key should fail');

  console.log('Test Meta-only on segmentation/image PASS: honest failure without key');
}

console.log('\nAll Meta multimodal models tests PASSED');
