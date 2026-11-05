// JYNTRA AI — Multi-Agent Evaluation Harness
//
// Runs the REAL MultiAgentOrchestrator against a labeled scenario dataset.
// Model outputs are replayed fixtures (no network, no API key): this measures
// orchestration contract, determinism and veto logic — NOT model quality and
// NOT trading profitability. Every report is tagged mode = "replay".
//
// Usage: npx tsx benchmarks/agents.js

import fs from 'fs';
import path from 'path';
import { MultiAgentOrchestrator } from '../src/services/multiAgentOrchestrator.ts';

const DATASET_PATH = path.join(process.cwd(), 'benchmarks', 'datasets', 'jyntra-agent-scenarios.v1.json');
const CSV_PATH = path.join(process.cwd(), 'benchmarks', 'results', 'agents.csv');
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));

const OPEN_WEIGHT_MODEL = 'meta-models/muse-spark-open-1026';

class ReplayEngine {
  constructor(scenario) {
    this.scenario = scenario;
    this.calls = [];
  }

  openWeightStatus() {
    return this.scenario.crossCheck
      ? { configured: true, provider: 'together', modelId: OPEN_WEIGHT_MODEL, reason: 'READY' }
      : { configured: false, provider: null, modelId: null, reason: 'OPEN_WEIGHT_NOT_CONFIGURED', };
  }

  crossCheck = async () => ({
    success: true,
    text: JSON.stringify(this.scenario.crossCheck),
    model: OPEN_WEIGHT_MODEL,
    hosting: 'together',
    openWeight: true,
    latencyMs: 0,
    calls: 1,
  });

  runChat = async (messages) => {
    const system = messages[0]?.content || '';
    const agent = /Technical Analyst/.test(system) ? 'technical'
      : /Market Research Analyst/.test(system) ? 'macro'
      : /Risk Manager/.test(system) ? 'risk'
      : /Strategy Analyst/.test(system) ? 'strategy'
      : /Red-Team Analyst/.test(system) ? 'redTeam'
      : /Lead Analyst/.test(system) ? 'lead' : 'unknown';
    this.calls.push(agent);
    const fixture = this.scenario.fixtures[agent];
    if (!fixture || fixture.__unavailable) {
      return { success: false, reason: 'META_ONLY_UNAVAILABLE', provider: 'none', modelTried: [], latencyMs: 0, calls: 1, errorCategory: 'none' };
    }
    return {
      success: true,
      text: JSON.stringify({ name: agent, ...fixture }),
      model: 'muse-spark-1.3',
      provider: 'meta',
      latencyMs: 0,
      calls: 1,
      errorCategory: 'none',
    };
  };
}

const cases = [];
for (const scenario of dataset.scenarios) {
  const engine = new ReplayEngine(scenario);
  const orchestrator = new MultiAgentOrchestrator({ engine });
  const started = process.hrtime.bigint();
  const result = await orchestrator.run(
    scenario.symbol,
    scenario.timeframe,
    scenario.context,
    scenario.priorAnalysis,
  );
  const latencyMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const expected = scenario.expected;

  const validAgents = Object.values(result.agents).filter((a) => a.schemaValid).length;
  const verdictOk = result.consensusVerdict === expected.verdict;
  const riskVetoOk = result.riskVetoApplied === expected.riskVeto;
  const contradictionsOk = expected.exactContradictions !== undefined
    ? result.contradictions.length === expected.exactContradictions
    : result.contradictions.length >= expected.minContradictions;
  const successOk = result.success === expected.success;
  const openWeightVetoOk = expected.openWeightVeto === undefined
    ? true
    : result.openWeightVetoApplied === expected.openWeightVeto;
  const schemaOk = validAgents === expected.schemaValidAgents;

  cases.push({
    category: 'agent-orchestration',
    name: scenario.id,
    description: scenario.description,
    latencyMs: Math.round(latencyMs * 100) / 100,
    expectedVerdict: expected.verdict,
    actualVerdict: result.consensusVerdict,
    verdictOk,
    riskVetoOk,
    contradictionsOk,
    successOk,
    openWeightVetoOk,
    schemaOk,
    schemaValidAgents: validAgents,
    contradictions: result.contradictions.length,
    confidence: result.consensusConfidence,
    calls: result.calls,
    success: verdictOk && riskVetoOk && contradictionsOk && successOk && openWeightVetoOk && schemaOk,
  });
}

const total = cases.length;
const ratio = (predicate) => Math.round((cases.filter(predicate).length / total) * 1000) / 1000;
const summary = {
  mode: 'replay',
  datasetId: dataset.datasetId,
  datasetVersion: dataset.version,
  scenarios: total,
  verdictAccuracy: ratio((c) => c.verdictOk),
  schemaConformance: ratio((c) => c.schemaOk),
  riskVetoAgreement: ratio((c) => c.riskVetoOk),
  contradictionAgreement: ratio((c) => c.contradictionsOk),
  successAgreement: ratio((c) => c.successOk),
  openWeightVetoAgreement: ratio((c) => c.openWeightVetoOk),
  casesPassed: cases.filter((c) => c.success).length,
  meanLatencyMs: Math.round((cases.reduce((s, c) => s + c.latencyMs, 0) / total) * 100) / 100,
  totalModelCalls: cases.reduce((s, c) => s + c.calls, 0),
  note: 'Replay mode: model outputs are labeled fixtures. Measures orchestration contract and determinism, not trading profitability.',
};

const results = {
  benchmarkId: 'agent-orchestration-v1',
  executedAt: new Date().toISOString(),
  module: 'multi-agent-orchestration',
  mode: 'replay',
  dataset: { id: dataset.datasetId, version: dataset.version, scenarios: total },
  metrics: summary,
  cases,
};

fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
const header = 'scenario,expected_verdict,actual_verdict,verdict_ok,schema_valid,risk_veto_ok,contradictions_ok,success_ok,open_weight_veto_ok,latency_ms\n';
const rows = cases.map((c) => [
  c.name,
  c.expectedVerdict,
  c.actualVerdict,
  c.verdictOk,
  c.schemaOk,
  c.riskVetoOk,
  c.contradictionsOk,
  c.successOk,
  c.openWeightVetoOk,
  c.latencyMs,
].join(',')).join('\n');
fs.writeFileSync(CSV_PATH, header + rows + '\n');

process.stdout.write(JSON.stringify(results));
