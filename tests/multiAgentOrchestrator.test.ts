/**
 * JYNTRA AI — Multi-Agent Orchestrator tests.
 *
 * Vérifie que :
 * 1. Chaque des 6 agents est appelé séparément (6 appels au moteur).
 * 2. La validation déterministe (veto Risk Analyst R:R < 1.5) fonctionne.
 * 3. Les contradictions entre agents sont détectées.
 * 4. Le verdict final est cohérent.
 * 5. Le mode Meta-only interdit le fallback non-Meta.
 *
 * Aucun appel API réel : le moteur est mocké pour tester la logique d'orchestration.
 */
import assert from 'node:assert';
import { MultiAgentOrchestrator } from '../src/services/multiAgentOrchestrator.ts';

/* ------------------------------------------------------------------ */
/* Moteur mocké                                                       */
/* ------------------------------------------------------------------ */

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

type ChatOptions = {
  temperature?: number;
  task?: string;
  maxTokens?: number;
  preferredModels?: string[];
  metaOnly?: boolean;
};

class MockEngine {
  calls: Array<{ agent: string; model?: string; metaOnly?: boolean }> = [];
  responses: Record<string, AiResult> = {};
  forceMetaOnlyFailure = false;

  runChat = async (
    messages: { role: string; content: string }[],
    opts?: ChatOptions,
  ): Promise<AiResult> => {
    // Détecte quel agent appelle via le contenu du message système
    const systemMsg = messages[0]?.content || '';
    let agent = 'unknown';
    if (/Technical Analyst/.test(systemMsg)) agent = 'technical';
    if (/Market Research Analyst/.test(systemMsg)) agent = 'macro';
    if (/Risk Manager/.test(systemMsg)) agent = 'risk';
    if (/Strategy Analyst/.test(systemMsg)) agent = 'strategy';
    if (/Red-Team Analyst/.test(systemMsg)) agent = 'redTeam';
    if (/Lead Analyst/.test(systemMsg)) agent = 'lead';

    this.calls.push({ agent, model: opts?.preferredModels?.[0], metaOnly: opts?.metaOnly });

    if (this.forceMetaOnlyFailure && opts?.metaOnly) {
      return { success: false, reason: 'META_ONLY_UNAVAILABLE', provider: 'none', errorCategory: 'configuration' };
    }

    return this.responses[agent] || { success: false, reason: 'NO_RESPONSE', provider: 'none' };
  };
}

function makeMockResult(text: string, model = 'muse-spark-1.3', provider: 'meta' | 'gemini' | 'free' = 'meta'): AiResult {
  return { success: true, text, model, tier: 'META', provider, latencyMs: 100, errorCategory: 'none' };
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

// Test 1 : Six appels séparés (un par agent)
{
  const engine = new MockEngine();
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });

  // Réponses par défaut pour tous les agents
  engine.responses.technical = makeMockResult(JSON.stringify({ name: 'Technical Analyst', stance: 'BULLISH', argument: 'BOS haussier détecté', keyLevel: '50000' }));
  engine.responses.macro = makeMockResult(JSON.stringify({ name: 'Market Research Analyst', stance: 'BULLISH', argument: 'Flux institutionnels positifs', macroFactor: 'DXY stable' }));
  engine.responses.risk = makeMockResult(JSON.stringify({ name: 'Risk Analyst', stance: 'APPROVED', argument: 'entrée: 50000, stopLoss: 49000, takeProfit1: 53000, risque acceptable' }));
  engine.responses.strategy = makeMockResult(JSON.stringify({ name: 'Strategy Analyst', stance: 'HIGH_PROBABILITY', argument: 'Edge statistique élevé', expectedEdge: '2.5%' }));
  engine.responses.redTeam = makeMockResult(JSON.stringify({ name: 'Red-Team Analyst', stance: 'VALIDATED', argument: 'Aucun piège détecté', counterHypothesis: '—' }));
  engine.responses.lead = makeMockResult(JSON.stringify({ name: 'Lead Analyst', verdict: 'BUY', executiveSummary: 'Consensus haussier', keyDisagreements: 'Aucune', suggestedAction: 'Entrer à 50000' }));

  const result = await orch.run('BTC/USDT', '1H', 'Contexte test', null, 'muse-spark-1.3', false);

  console.log('DEBUG Test 1 result:', JSON.stringify({
    success: result.success,
    consensusVerdict: result.consensusVerdict,
    riskVetoApplied: result.riskVetoApplied,
    riskVetoReason: result.riskVetoReason,
    calls: result.calls,
    agents: Object.fromEntries(Object.entries(result.agents).map(([k, v]) => [k, { success: v.success, verdict: v.verdict, stance: v.stance, provider: v.provider, model: v.modelUsed }])),
  }, null, 2));

  assert.equal(result.success, true, 'Orchestrateur doit réussir avec 6 agents');
  assert.equal(result.calls, 6, 'Doit y avoir exactement 6 appels (un par agent)');
  assert.equal(result.consensusVerdict, 'BUY', 'Verdict final doit être BUY');
  assert.equal(result.agents.technical.name, 'Technical Analyst');
  assert.equal(result.agents.macro.name, 'Market Research Analyst');
  assert.equal(result.agents.risk.name, 'Risk Analyst');
  assert.equal(result.agents.strategy.name, 'Strategy Analyst');
  assert.equal(result.agents.redTeam.name, 'Red-Team Analyst');
  assert.equal(result.agents.lead.name, 'Lead Analyst');
  assert.ok(result.latencyMs > 0 || result.latencyMs === 0, 'Latence doit être présente');
  console.log('Test 1 PASS : Six appels séparés, verdict BUY cohérent');
}

// Test 2 : Veto du Risk Analyst (R:R < 1.5)
{
  const engine = new MockEngine();
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });

  engine.responses.technical = makeMockResult(JSON.stringify({ name: 'Technical Analyst', stance: 'BULLISH', argument: 'BOS haussier', keyLevel: '50000' }));
  engine.responses.macro = makeMockResult(JSON.stringify({ name: 'Market Research Analyst', stance: 'BULLISH', argument: 'Contexte positif', macroFactor: '—' }));
  // R:R = (53000-50000)/(50000-49900) = 3000/100 = 30 → OK
  // Pour forcer le veto, on met un stop très proche : stopLoss: 49990 → risk = 10, reward = 3000, RR = 300 → OK
  // Pour RR < 1.5 : stopLoss: 49995 (risk=5), tp1: 50002 (reward=2) → RR = 0.4
  engine.responses.risk = makeMockResult(JSON.stringify({ name: 'Risk Analyst', stance: 'APPROVED', argument: 'entrée: 50000, stopLoss: 49995, takeProfit1: 50002, risque faible' }));
  engine.responses.strategy = makeMockResult(JSON.stringify({ name: 'Strategy Analyst', stance: 'MEDIUM', argument: 'Edge moyen', expectedEdge: '1%' }));
  engine.responses.redTeam = makeMockResult(JSON.stringify({ name: 'Red-Team Analyst', stance: 'VALIDATED', argument: '—', counterHypothesis: '—' }));
  engine.responses.lead = makeMockResult(JSON.stringify({ name: 'Lead Analyst', verdict: 'BUY', executiveSummary: 'Consensus', keyDisagreements: '—', suggestedAction: 'Entrer' }));

  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', false);

  assert.equal(result.success, true, 'Orchestrateur doit réussir même avec veto');
  assert.equal(result.consensusVerdict, 'NO_TRADE', 'Verdict doit être NO_TRADE après veto Risk Analyst');
  assert.equal(result.riskVetoApplied, true, 'Veto du Risk Analyst doit être appliqué');
  assert.ok(result.riskVetoReason, 'Raison du veto doit être présente');
  console.log('Test 2 PASS : Veto Risk Analyst (R:R < 1.5) appliqué, verdict NO_TRADE');
}

// Test 3 : Détection des contradictions
{
  const engine = new MockEngine();
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });

  engine.responses.technical = makeMockResult(JSON.stringify({ name: 'Technical Analyst', stance: 'BULLISH', argument: 'Structure haussière', keyLevel: '50000' }));
  engine.responses.macro = makeMockResult(JSON.stringify({ name: 'Market Research Analyst', stance: 'BEARISH', argument: 'Macro négatif', macroFactor: 'DXY fort' }));
  engine.responses.risk = makeMockResult(JSON.stringify({ name: 'Risk Analyst', stance: 'APPROVED', argument: 'entrée: 50000, stopLoss: 49000, takeProfit1: 53000' }));
  engine.responses.strategy = makeMockResult(JSON.stringify({ name: 'Strategy Analyst', stance: 'LOW_EDGE', argument: 'Edge faible', expectedEdge: '0.5%' }));
  engine.responses.redTeam = makeMockResult(JSON.stringify({ name: 'Red-Team Analyst', stance: 'RISK_HIGH', argument: 'Piège détecté', counterHypothesis: 'Fausse cassure' }));
  engine.responses.lead = makeMockResult(JSON.stringify({ name: 'Lead Analyst', verdict: 'NO_TRADE', executiveSummary: 'Contradictions', keyDisagreements: '—', suggestedAction: 'Attendre' }));

  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', false);

  console.log('DEBUG Test 3 stances:', {
    technical: result.agents.technical.stance,
    macro: result.agents.macro.stance,
    strategy: result.agents.strategy.stance,
    redTeam: result.agents.redTeam.stance,
    contradictions: result.contradictions,
  });

  assert.equal(result.contradictions.length > 0, true, 'Au moins une contradiction doit être détectée');
  assert.equal(result.consensusVerdict, 'NO_TRADE', 'Verdict NO_TRADE face aux contradictions');
  console.log('Test 3 PASS : Contradictions détectées (' + result.contradictions.length + ')');
}

// Test 4 : Mode Meta-only interdit le fallback
{
  const engine = new MockEngine();
  engine.forceMetaOnlyFailure = true;
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });

  engine.responses.technical = makeMockResult(JSON.stringify({ name: 'Technical Analyst', stance: 'BULLISH', argument: '—', keyLevel: '—' }));
  engine.responses.macro = makeMockResult(JSON.stringify({ name: 'Market Research Analyst', stance: 'NEUTRAL', argument: '—', macroFactor: '—' }));
  engine.responses.risk = makeMockResult(JSON.stringify({ name: 'Risk Analyst', stance: 'REJECTED', argument: 'Meta indisponible' }));
  engine.responses.strategy = makeMockResult(JSON.stringify({ name: 'Strategy Analyst', stance: 'LOW_EDGE', argument: '—', expectedEdge: '—' }));
  engine.responses.redTeam = makeMockResult(JSON.stringify({ name: 'Red-Team Analyst', stance: 'VALIDATED', argument: '—', counterHypothesis: '—' }));
  engine.responses.lead = makeMockResult(JSON.stringify({ name: 'Lead Analyst', verdict: 'NO_TRADE', executiveSummary: 'Meta indisponible', keyDisagreements: '—', suggestedAction: '—' }));

  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', true);

  assert.equal(result.success, false, 'Mode Meta-only doit échouer quand Meta est indisponible');
  assert.ok(result.error, 'Doit y avoir une erreur');
  console.log('Test 4 PASS : Mode Meta-only interdit le fallback non-Meta');
}

// Test 5 : Tous les agents ont un provider traçable
{
  const engine = new MockEngine();
  const orch = new MultiAgentOrchestrator({ createAiEngine: () => engine as any });

  engine.responses.technical = makeMockResult(JSON.stringify({ name: 'Technical Analyst', stance: 'BULLISH', argument: '—', keyLevel: '—' }), 'muse-spark-1.3', 'meta');
  engine.responses.macro = makeMockResult(JSON.stringify({ name: 'Market Research Analyst', stance: 'NEUTRAL', argument: '—', macroFactor: '—' }), 'muse-wonder-1.0', 'meta');
  engine.responses.risk = makeMockResult(JSON.stringify({ name: 'Risk Analyst', stance: 'APPROVED', argument: 'entrée: 50000, stopLoss: 49000, takeProfit1: 53000' }), 'muse-spark-1.2', 'meta');
  engine.responses.strategy = makeMockResult(JSON.stringify({ name: 'Strategy Analyst', stance: 'MEDIUM', argument: '—', expectedEdge: '—' }), 'muse-spark-1.3', 'meta');
  engine.responses.redTeam = makeMockResult(JSON.stringify({ name: 'Red-Team Analyst', stance: 'VALIDATED', argument: '—', counterHypothesis: '—' }), 'muse-wonder-1.0', 'meta');
  engine.responses.lead = makeMockResult(JSON.stringify({ name: 'Lead Analyst', verdict: 'NO_TRADE', executiveSummary: '—', keyDisagreements: '—', suggestedAction: '—' }), 'muse-spark-1.1', 'meta');

  const result = await orch.run('BTC/USDT', '1H', '', null, 'muse-spark-1.3', false);

  // Vérifie que chaque agent a un provider et un model
  for (const [name, agent] of Object.entries(result.agents)) {
    assert.ok(agent.provider, `Agent ${name} doit avoir un provider`);
    assert.ok(agent.modelUsed, `Agent ${name} doit avoir un modelUsed`);
    assert.ok(agent.latencyMs !== undefined, `Agent ${name} doit avoir une latence`);
  }
  console.log('Test 5 PASS : Tous les agents ont provider, model et latency traçables');
}

console.log('\nTous les tests Multi-Agent Orchestrator PASS');
