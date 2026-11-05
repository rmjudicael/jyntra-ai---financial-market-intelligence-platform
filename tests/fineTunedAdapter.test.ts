import assert from 'node:assert';
import {
  explainRiskWithAdapter,
  fineTunedStatus,
  parseFineTunedConfig,
  validateFineTunedOutput,
  type FineTunedConfig,
} from '../src/server/fineTunedAdapter.ts';

const config: FineTunedConfig = {
  baseUrl: 'http://127.0.0.1:8080/v1',
  modelId: 'jyntra-risk-lora',
  adapterId: 'jyntra-risk-llama32-1b-lora-v1',
  baseModel: 'Llama-3.2-1B-Instruct',
  timeoutMs: 5_000,
};

const input = {
  symbol: 'BTC/USDT',
  timeframe: '1H',
  verdict: 'BUY' as const,
  entry: 50_000,
  stopLoss: 49_000,
  takeProfit1: 53_000,
  riskArgument: 'entrée: 50000, stopLoss: 49000, takeProfit1: 53000',
};

const chatResponse = (content: string) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  }) as unknown as Response;

/* 1. Missing configuration is reported, never guessed. */
{
  const status = fineTunedStatus(undefined);
  assert.equal(status.configured, false);
  assert.equal(status.reason, 'FINETUNED_NOT_CONFIGURED');
  const result = await explainRiskWithAdapter(undefined, input, {
    fetchImpl: (async () => {
      throw new Error('must not be called');
    }) as any,
  });
  assert.equal(result.attempted, false);
  assert.equal(result.reason, 'FINETUNED_NOT_CONFIGURED');
  console.log('fineTuned 1 PASS: unconfigured -> no network');
}

/* 2. Adapter id/base model are mandatory and the URL is validated. */
{
  const missing = fineTunedStatus({ ...config, adapterId: '' });
  assert.equal(missing.reason, 'FINETUNED_ADAPTER_MISSING');
  const invalid = fineTunedStatus({ ...config, baseUrl: 'file:///tmp/model' });
  assert.equal(invalid.reason, 'FINETUNED_BASE_URL_INVALID');
  const parsed = parseFineTunedConfig({
    JYNTRA_FINETUNED_BASE_URL: config.baseUrl,
    JYNTRA_FINETUNED_MODEL_ID: config.modelId,
    JYNTRA_FINETUNED_ADAPTER_ID: config.adapterId,
    JYNTRA_FINETUNED_BASE_MODEL: config.baseModel,
  } as NodeJS.ProcessEnv);
  assert.equal(fineTunedStatus(parsed).configured, true);
  assert.equal(fineTunedStatus(parsed).endpointHost, '127.0.0.1:8080');
  console.log('fineTuned 2 PASS: config validation + host-only status');
}

/* 3. Valid JSON with a code fence is accepted with full provenance. */
{
  const captured: any = {};
  const result = await explainRiskWithAdapter(config, input, {
    fetchImpl: (async (url: string, init: any) => {
      captured.url = url;
      captured.headers = init.headers;
      captured.body = JSON.parse(init.body);
      return chatResponse(
        '```json\n{"stance":"APPROVED","riskRewardRatio":3,"primaryRisk":"Invalidation sous 49k","invalidation":"Clôture 1H sous 49000","explanation":"Le plan respecte un R:R de 3.0 et le stop invalide la structure."}\n```',
      );
    }) as any,
  });
  assert.equal(result.success, true);
  assert.equal(result.valid, true);
  assert.equal(result.output?.stance, 'APPROVED');
  assert.equal(result.adapterId, config.adapterId);
  assert.equal(result.baseModel, config.baseModel);
  assert.equal(result.provider, 'local-finetuned');
  assert.equal(result.calls, 1);
  assert.equal(captured.url, 'http://127.0.0.1:8080/v1/chat/completions');
  assert.equal(captured.body.model, 'jyntra-risk-lora');
  assert.equal(captured.body.temperature, 0);
  assert.equal(captured.headers.Authorization, undefined, 'no auth header without a key');
  console.log('fineTuned 3 PASS: real HTTP contract + code-fence handling');
}

/* 4. A Risk/Reward mismatch is flagged but never silently accepted. */
{
  const result = await explainRiskWithAdapter(
    config,
    input,
    {
      fetchImpl: (async () =>
        chatResponse(
          JSON.stringify({
            stance: 'APPROVED',
            riskRewardRatio: 9.9,
            primaryRisk: 'Risque',
            invalidation: 'Stop',
            explanation: 'Explication',
          }),
        )) as any,
    },
  );
  assert.equal(result.success, true);
  assert.equal(result.valid, false);
  assert.ok(result.validationErrors?.some((e) => /mismatch/i.test(e)));
  console.log('fineTuned 4 PASS: deterministic R:R cross-check');
}

/* 5. Provider errors are classified and never throw. */
{
  const quota = await explainRiskWithAdapter(config, input, {
    fetchImpl: (async () => ({ ok: false, status: 429, json: async () => ({}) }) as any) as any,
  });
  assert.equal(quota.success, false);
  assert.equal(quota.reason, 'FINETUNED_QUOTA');
  assert.equal(quota.errorCategory, 'quota');

  const network = await explainRiskWithAdapter(config, input, {
    fetchImpl: (async () => {
      throw new Error('ECONNREFUSED');
    }) as any,
  });
  assert.equal(network.success, false);
  assert.equal(network.reason, 'FINETUNED_NETWORK');
  assert.equal(network.errorCategory, 'network');
  console.log('fineTuned 5 PASS: quota + network classified');
}

/* 6. Malformed output is rejected explicitly. */
{
  const result = await explainRiskWithAdapter(config, input, {
    fetchImpl: (async () => chatResponse('not json at all')) as any,
  });
  assert.equal(result.success, false);
  assert.equal(result.reason, 'FINETUNED_INVALID_JSON');

  const validation = validateFineTunedOutput({ stance: 'MAYBE', primaryRisk: '', invalidation: '', explanation: '' });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length >= 4);
  console.log('fineTuned 6 PASS: invalid JSON + schema errors');
}

/* 7. Auth header is sent only when a key is configured. */
{
  let auth: string | undefined;
  await explainRiskWithAdapter(
    { ...config, apiKey: 'local-secret' },
    input,
    {
      fetchImpl: (async (_url: string, init: any) => {
        auth = init.headers.Authorization;
        return chatResponse(
          JSON.stringify({
            stance: 'CAUTION',
            riskRewardRatio: 3,
            primaryRisk: 'Risque',
            invalidation: 'Stop',
            explanation: 'Explication',
          }),
        );
      }) as any,
    },
  );
  assert.equal(auth, 'Bearer local-secret');
  console.log('fineTuned 7 PASS: optional bearer auth');
}

console.log('\nAll fine-tuned adapter tests PASSED');
