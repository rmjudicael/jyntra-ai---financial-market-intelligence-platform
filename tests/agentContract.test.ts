/**
 * JYNTRA AI — Agent contract, determinism and open-weight audit tests.
 *
 * Complements multiAgentOrchestrator.test.ts with the guarantees added for
 * the hackathon review:
 *  - closed-vocabulary JSON schemas per agent;
 *  - parallel independent specialists;
 *  - explicit Risk Analyst rejection = hard veto;
 *  - high-severity open-weight disagreement = hard veto;
 *  - deterministic confidence (no invented number from the model);
 *  - routing/call accounting.
 */
import assert from 'node:assert';
import {
  MultiAgentOrchestrator,
  validateAgentJson,
  validateRiskPlan,
} from '../src/services/multiAgentOrchestrator.ts';

/* ------------------------------------------------------------------ */
/* 1. Deterministic schema validation                                 */
/* ------------------------------------------------------------------ */
{
  assert.equal(validateAgentJson('technical', { stance: 'BULLISH', argument: 'BOS on H4' }).valid, true);
  assert.equal(validateAgentJson('technical', { stance: 'MAYBE', argument: 'x' }).valid, false);
  assert.equal(validateAgentJson('risk', { stance: 'APPROVED' }).valid, false, 'argument is required');
  assert.equal(validateAgentJson('lead', { verdict: 'HOLD', argument: 'x' }).valid, false);
  assert.equal(validateAgentJson('lead', { verdict: 'NO_TRADE', argument: 'x' }).valid, true);
  assert.equal(validateAgentJson('unknown', { argument: 'x' }).valid, false);
  console.log('Test agents 1 PASS: closed-vocabulary schemas reject invalid outputs');
}

/* ------------------------------------------------------------------ */
/* 2. Risk plan validation is pure and exact                          */
/* ------------------------------------------------------------------ */
{
  const good = validateRiskPlan({ entry: 100, stopLoss: 95, takeProfit1: 110 }, 'BUY');
  assert.equal(good.ok, true);
  assert.equal(good.computedRR, 2);
  assert.equal(validateRiskPlan({ entry: 100, stopLoss: 99, takeProfit1: 101 }, 'BUY').ok, false, 'R:R 1.0 veto');
  assert.equal(validateRiskPlan({ entry: 100, stopLoss: 105, takeProfit1: 120 }, 'BUY').ok, false, 'SL above entry for LONG');
  assert.equal(validateRiskPlan({ entry: 100, stopLoss: 95, takeProfit1: 90 }, 'SELL').ok, false, 'SL below entry for SHORT');
  assert.equal(validateRiskPlan({ entry: 100, stopLoss: 105, takeProfit1: 80 }, 'SELL').ok, true);
  console.log('Test agents 2 PASS: Risk/Reward veto and SL orientation');
}

/* ------------------------------------------------------------------ */
/* Mock engine with configurable open-weight audit                    */
/* ------------------------------------------------------------------ */
type CrossCheck = { enabled: boolean; text?: string };

class ContractEngine {
  calls: string[] = [];
  active = 0;
  maxActive = 0;
  crossCheckCalls = 0;
  private crossCheckConfig: CrossCheck;
  overrides: Record<string, any>;

  constructor(opts: { crossCheck?: CrossCheck; overrides?: Record<string, any> } = {}) {
    this.crossCheckConfig = opts.crossCheck || { enabled: false };
    this.overrides = opts.overrides || {};
  }

  openWeightStatus() {
    return this.crossCheckConfig.enabled
      ? { configured: true, provider: 'together', modelId: 'meta-models/muse-spark-open-1026', reason: 'READY' }
      : { configured: false, provider: null, modelId: null, reason: 'OPEN_WEIGHT_NOT_CONFIGURED' };
  }

  crossCheck = async (_payload: string) => {
    this.crossCheckCalls += 1;
    return {
      success: true,
      text: this.crossCheckConfig.text || '{"agreement":true,"severity":"LOW","verdict":"BUY","concerns":[]}',
      model: 'meta-models/muse-spark-open-1026',
      hosting: 'together',
      openWeight: true,
      latencyMs: 12,
      calls: 1,
    };
  };

  runChat = async (messages: any[], opts: any = {}) => {
    const system = messages[0]?.content || '';
    const key = /Technical Analyst/.test(system) ? 'technical'
      : /Market Research Analyst/.test(system) ? 'macro'
      : /Risk Manager/.test(system) ? 'risk'
      : /Strategy Analyst/.test(system) ? 'strategy'
      : /Red-Team Analyst/.test(system) ? 'redTeam'
      : /Lead Analyst/.test(system) ? 'lead' : 'unknown';
    this.calls.push(key);
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    await new Promise((r) => setTimeout(r, 25));
    this.active -= 1;

    if (this.overrides[key]) return this.overrides[key];

    const payloads: Record<string, any> = {
      technical: { name: 'Technical Analyst', stance: 'BULLISH', argument: 'BOS + OB retest', keyLevel: '64000' },
      macro: { name: 'Market Research Analyst', stance: 'BULLISH', argument: 'DXY weak', macroFactor: 'DXY' },
      risk: { name: 'Risk Analyst', stance: 'APPROVED', argument: 'Setup valid', riskPlan: { entry: 64000, stopLoss: 62800, takeProfit1: 67000 } },
      strategy: { name: 'Strategy Analyst', stance: 'HIGH_PROBABILITY', argument: 'Good edge', expectedEdge: '2.4R' },
      redTeam: { name: 'Red-Team Analyst', stance: 'VALIDATED', argument: 'No trap found', critique: 'Checked', counterHypothesis: 'None' },
      lead: { name: 'Lead Analyst', verdict: 'BUY', argument: 'Consensus BUY', executiveSummary: 'BUY', keyDisagreements: 'None', suggestedAction: 'Enter' },
    };
    return {
      success: true,
      text: JSON.stringify(payloads[key]),
      model: 'muse-spark-1.3',
      provider: 'meta',
      latencyMs: 20,
      calls: 1,
      errorCategory: 'none',
    };
  };
}

const prior = { summary: 'real prior analysis', verdict: 'BUY' };

/* ------------------------------------------------------------------ */
/* 3. Parallelism + routing + confidence                              */
/* ------------------------------------------------------------------ */
{
  const engine = new ContractEngine();
  const orch = new MultiAgentOrchestrator({ engine });
  const r = await orch.run('BTC/USDT', '1H', 'context', prior);

  assert.equal(r.success, true);
  assert.equal(r.consensusVerdict, 'BUY');
  assert.ok(engine.maxActive >= 4, `specialists must run in parallel (maxActive=${engine.maxActive})`);
  assert.equal(r.calls, 6, 'six real agent calls accounted');
  assert.equal(r.routing.length, 6);
  assert.ok(r.routing.every((x) => x.model && x.provider === 'meta'));
  assert.ok(r.consensusConfidence >= 60 && r.consensusConfidence <= 95, `confidence should reflect agreement (${r.consensusConfidence})`);
  assert.match(r.confidenceBasis, /technical aligned/);
  assert.equal(r.crossCheck.attempted, false, 'no audit when open-weight is not configured');
  console.log('Test agents 3 PASS: parallel specialists, routing, deterministic confidence');
}

/* ------------------------------------------------------------------ */
/* 4. Explicit Risk REJECTED = hard veto                              */
/* ------------------------------------------------------------------ */
{
  const engine = new ContractEngine({
    overrides: {
      risk: {
        success: true,
        text: JSON.stringify({ name: 'Risk Analyst', stance: 'REJECTED', argument: 'Capital preservation', maxRiskRecommended: '0%' }),
        model: 'muse-spark-1.3', provider: 'meta', latencyMs: 10, calls: 1,
      },
    },
  });
  const r = await new MultiAgentOrchestrator({ engine }).run('BTC/USDT', '1H', 'ctx', prior);
  assert.equal(r.consensusVerdict, 'NO_TRADE');
  assert.equal(r.riskVetoApplied, true);
  assert.match(r.riskVetoReason || '', /REJECTED/);
  assert.equal(r.agents.lead.verdict, 'NO_TRADE');
  console.log('Test agents 4 PASS: Risk Analyst rejection blocks the trade');
}

/* ------------------------------------------------------------------ */
/* 5. Open-weight HIGH disagreement = hard veto, with provenance      */
/* ------------------------------------------------------------------ */
{
  const engine = new ContractEngine({
    crossCheck: {
      enabled: true,
      text: '{"agreement":false,"severity":"HIGH","verdict":"NO_TRADE","concerns":["Risk plan assumes liquidity that the context does not prove"]}',
    },
  });
  const r = await new MultiAgentOrchestrator({ engine }).run('BTC/USDT', '1H', 'ctx', prior);

  assert.equal(engine.crossCheckCalls, 1);
  assert.equal(r.crossCheck.used, true);
  assert.equal(r.crossCheck.model, 'meta-models/muse-spark-open-1026');
  assert.equal(r.crossCheck.hosting, 'together');
  assert.equal(r.crossCheck.agreement, false);
  assert.equal(r.crossCheck.severity, 'HIGH');
  assert.equal(r.openWeightVetoApplied, true);
  assert.equal(r.consensusVerdict, 'NO_TRADE');
  assert.ok(r.contradictions.some((c) => /open-weight/i.test(c)));
  assert.equal(r.calls, 7, 'six agents + one open-weight audit');
  console.log('Test agents 5 PASS: open-weight audit is a real, attributed pipeline step with veto');
}

/* ------------------------------------------------------------------ */
/* 6. Missing data robustness: agents fail honestly, no fake verdict  */
/* ------------------------------------------------------------------ */
{
  const engine = new ContractEngine({
    overrides: {
      technical: { success: false, reason: 'META_ONLY_UNAVAILABLE', provider: 'none' },
    },
  });
  const r = await new MultiAgentOrchestrator({ engine }).run('BTC/USDT', '1H', '', prior, undefined, true);
  assert.equal(r.success, false);
  assert.equal(r.agents.technical.success, false);
  assert.equal(r.agents.technical.schemaValid, false);
  assert.ok(typeof r.consensusVerdict === 'string');
  console.log('Test agents 6 PASS: missing provider -> honest partial failure, no invented success');
}

console.log('\nAll agent contract tests PASSED');
