import assert from 'node:assert';
import { MultiAgentOrchestrator, type FineTunedAdapter } from '../src/services/multiAgentOrchestrator.ts';
import type { FineTunedResult, FineTunedRiskInput } from '../src/server/fineTunedAdapter.ts';

type AiResult = {
  success: boolean;
  text?: string;
  model?: string;
  tier?: 'META' | 'GEMINI' | 'FREE';
  provider?: 'meta' | 'gemini' | 'free' | 'none';
  latencyMs?: number;
  errorCategory?: string;
  reason?: string;
};

class MockEngine {
  responses: Record<string, AiResult> = {};
  runChat = async (messages: { role: string; content: string }[]): Promise<AiResult> => {
    const system = messages[0]?.content || '';
    let agent = 'unknown';
    if (/Technical Analyst/.test(system)) agent = 'technical';
    if (/Market Research Analyst/.test(system)) agent = 'macro';
    if (/Risk Manager/.test(system)) agent = 'risk';
    if (/Strategy Analyst/.test(system)) agent = 'strategy';
    if (/Red-Team Analyst/.test(system)) agent = 'redTeam';
    if (/Lead Analyst/.test(system)) agent = 'lead';
    return this.responses[agent] || { success: false, reason: 'NO_RESPONSE', provider: 'none' };
  };
}

const ok = (text: string): AiResult => ({
  success: true,
  text,
  model: 'muse-spark-1.3',
  tier: 'META',
  provider: 'meta',
  latencyMs: 10,
  errorCategory: 'none',
});

function seed(engine: MockEngine) {
  engine.responses.technical = ok(JSON.stringify({ stance: 'BULLISH', argument: 'BOS haussier', keyLevel: '50000' }));
  engine.responses.macro = ok(JSON.stringify({ stance: 'BULLISH', argument: 'DXY stable', macroFactor: 'DXY' }));
  engine.responses.risk = ok(
    JSON.stringify({ stance: 'APPROVED', argument: 'entrée: 50000, stopLoss: 49000, takeProfit1: 53000' }),
  );
  engine.responses.strategy = ok(JSON.stringify({ stance: 'HIGH_PROBABILITY', argument: 'Edge', expectedEdge: '2%' }));
  engine.responses.redTeam = ok(JSON.stringify({ stance: 'VALIDATED', argument: 'Rien', counterHypothesis: '-' }));
  engine.responses.lead = ok(
    JSON.stringify({ verdict: 'BUY', executiveSummary: 'Consensus', keyDisagreements: '-', suggestedAction: 'Entrer' }),
  );
}

const auditResult = (overrides: Partial<FineTunedResult> = {}): FineTunedResult => ({
  attempted: true,
  success: true,
  configured: true,
  provider: 'local-finetuned',
  adapterId: 'jyntra-risk-llama32-1b-lora-v1',
  baseModel: 'Llama-3.2-1B-Instruct',
  model: 'jyntra-risk-lora',
  output: {
    stance: 'APPROVED',
    riskRewardRatio: 3,
    primaryRisk: 'Invalidation sous 49k',
    invalidation: 'Clôture sous 49000',
    explanation: 'R:R 3.0, stop structurel valide.',
  },
  valid: true,
  latencyMs: 12,
  calls: 1,
  ...overrides,
});

/* 1. The adapter is called once, receives the deterministic plan, and the
 *    verdict is unchanged. */
{
  const engine = new MockEngine();
  seed(engine);
  const seen: FineTunedRiskInput[] = [];
  const adapter: FineTunedAdapter = {
    explainRisk: async (input) => {
      seen.push(input);
      return auditResult();
    },
  };
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any, fineTunedAdapter: adapter });
  const result = await orch.run('BTC/USDT', '1H', 'contexte', null, 'muse-spark-1.3', false);

  assert.equal(result.success, true);
  assert.equal(result.consensusVerdict, 'BUY');
  assert.equal(result.fineTunedAudit?.success, true);
  assert.equal(result.fineTunedAudit?.adapterId, 'jyntra-risk-llama32-1b-lora-v1');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].symbol, 'BTC/USDT');
  assert.equal(seen[0].entry, 50_000);
  assert.equal(seen[0].stopLoss, 49_000);
  assert.equal(seen[0].takeProfit1, 53_000);
  assert.equal(result.calls, 7, '6 agents + 1 adapter call');
  assert.ok(result.routing.some((r) => r.agent === 'fine-tuned-risk' && r.provider === 'local-finetuned'));
  console.log('fineTunedOrchestrator 1 PASS: audit attached, verdict untouched, call counted');
}

/* 2. An adapter failure never turns a valid orchestration into a failure. */
{
  const engine = new MockEngine();
  seed(engine);
  const adapter: FineTunedAdapter = {
    explainRisk: async () =>
      auditResult({
        success: false,
        output: undefined,
        valid: undefined,
        reason: 'FINETUNED_NETWORK',
        errorCategory: 'network',
      }),
  };
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any, fineTunedAdapter: adapter });
  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', false);

  assert.equal(result.success, true);
  assert.equal(result.consensusVerdict, 'BUY');
  assert.equal(result.fineTunedAudit?.success, false);
  assert.equal(result.fineTunedAudit?.reason, 'FINETUNED_NETWORK');
  console.log('fineTunedOrchestrator 2 PASS: adapter outage is non-blocking');
}

/* 3. Without an adapter the result shape and call count are unchanged. */
{
  const engine = new MockEngine();
  seed(engine);
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });
  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', false);
  assert.equal(result.success, true);
  assert.equal(result.fineTunedAudit, undefined);
  assert.equal(result.calls, 6);
  console.log('fineTunedOrchestrator 3 PASS: disabled adapter leaves behaviour intact');
}

console.log('\nAll fine-tuned orchestrator tests PASSED');
