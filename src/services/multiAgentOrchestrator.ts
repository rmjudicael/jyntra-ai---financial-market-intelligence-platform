/**
 * JYNTRA AI — Multi-Agent Orchestrator (server-side).
 *
 * Orchestre véritablement les six agents spécialisés via des appels séparés
 * au moteur Meta AI (aiEngine). Chaque agent produit sa propre sortie typée,
 * validée par un schéma déterministe, et le Lead Analyst synthétise avec
 * détection des contradictions et règle de veto du Risk Analyst.
 *
 * Deux garde-fous indépendants des modèles :
 *  1. validateRiskPlan() : R:R >= 1.5, SL cohérent avec le sens du trade.
 *  2. validateAgentJson() : champs requis et vocabulaire fermé par agent.
 *
 * Quand un checkpoint Meta open-weight est configuré (Muse Spark Open /
 * Muse Glimmer via Together, Fireworks, Baseten ou un serveur local), il
 * exécute un audit contradictoire indépendant du verdict du Lead Analyst.
 *
 * Aucun résultat n'est simulé : si Meta est indisponible, l'échec est honnête.
 */
import { createAiEngine } from '../server/aiEngine.ts';
import type { FineTunedResult, FineTunedRiskInput } from '../server/fineTunedAdapter.ts';

/* ------------------------------------------------------------------ */
/* Types partagés                                                     */
/* ------------------------------------------------------------------ */

export type AgentStance = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type AgentRiskStatus = 'APPROVED' | 'CAUTION' | 'REJECTED';
export type AgentStrategyEdge = 'HIGH_PROBABILITY' | 'MEDIUM' | 'LOW_EDGE';
export type AgentRedTeamStatus = 'WARN_TRAP' | 'RISK_HIGH' | 'VALIDATED';
export type FinalVerdict = 'BUY' | 'SELL' | 'NO_TRADE';

export interface AgentOutput {
  name: string;
  role: string;
  stance?: AgentStance | AgentRiskStatus | AgentStrategyEdge | AgentRedTeamStatus;
  argument: string;
  keyLevel?: string;
  macroFactor?: string;
  maxRiskRecommended?: string;
  expectedEdge?: string;
  critique?: string;
  counterHypothesis?: string;
  verdict?: FinalVerdict;
  executiveSummary?: string;
  keyDisagreements?: string;
  suggestedAction?: string;
  rawModelResponse?: string;
  modelUsed?: string;
  provider?: 'meta' | 'gemini' | 'free' | 'none';
  hosting?: string;
  openWeight?: boolean;
  latencyMs?: number;
  calls?: number;
  /** Deterministic schema check — independent from the model's own claims. */
  schemaValid?: boolean;
  schemaErrors?: string[];
  success: boolean;
  error?: string;
  json?: any;
}

export interface CrossCheckResult {
  attempted: boolean;
  used: boolean;
  model?: string;
  hosting?: string;
  agreement?: boolean;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  verdict?: FinalVerdict | 'UNKNOWN';
  concerns: string[];
  latencyMs?: number;
  reason?: string;
  vetoApplied: boolean;
}

export interface OrchestrationResult {
  symbol: string;
  timeframe: string;
  consensusVerdict: FinalVerdict;
  consensusConfidence: number;
  confidenceBasis: string;
  agents: Record<string, AgentOutput>;
  riskVetoApplied: boolean;
  riskVetoReason?: string;
  openWeightVetoApplied: boolean;
  crossCheck: CrossCheckResult;
  /** Optional structured risk explanation from the local fine-tuned adapter. */
  fineTunedAudit?: FineTunedResult;
  contradictions: string[];
  latencyMs: number;
  calls: number;
  routing: Array<{ agent: string; model?: string; provider?: string; hosting?: string; latencyMs?: number; calls?: number }>;
  success: boolean;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Schémas déterministes par agent                                    */
/* ------------------------------------------------------------------ */

interface AgentSchema {
  required: string[];
  stance?: readonly string[];
  notes: string;
}

export const AGENT_SCHEMAS: Record<string, AgentSchema> = {
  technical: { required: ['stance', 'argument'], stance: ['BULLISH', 'BEARISH', 'NEUTRAL'], notes: 'Structure de marché uniquement.' },
  macro: { required: ['stance', 'argument'], stance: ['BULLISH', 'BEARISH', 'NEUTRAL'], notes: 'Contexte macro uniquement.' },
  risk: { required: ['stance', 'argument'], stance: ['APPROVED', 'CAUTION', 'REJECTED'], notes: 'Veto possible, R:R >= 1.5.' },
  strategy: { required: ['stance', 'argument'], stance: ['HIGH_PROBABILITY', 'MEDIUM', 'LOW_EDGE'], notes: 'Edge statistique.' },
  redTeam: { required: ['stance', 'argument'], stance: ['WARN_TRAP', 'RISK_HIGH', 'VALIDATED'], notes: 'Doit contester.' },
  lead: { required: ['verdict', 'argument'], stance: ['BUY', 'SELL', 'NO_TRADE'], notes: 'Verdict univoque.' },
};

export interface SchemaValidation {
  valid: boolean;
  errors: string[];
}

/** Validation indépendante du modèle : champs requis + vocabulaire fermé. */
export function validateAgentJson(agentKey: string, json: any): SchemaValidation {
  const schema = AGENT_SCHEMAS[agentKey];
  if (!schema) return { valid: false, errors: [`Unknown agent schema: ${agentKey}`] };
  if (!json || typeof json !== 'object') return { valid: false, errors: ['Response is not a JSON object.'] };

  const errors: string[] = [];
  for (const field of schema.required) {
    const value = json[field];
    if (typeof value !== 'string' || !value.trim()) errors.push(`Missing or empty field: ${field}`);
  }
  const stanceField = agentKey === 'lead' ? 'verdict' : 'stance';
  const stanceValue = json[stanceField];
  if (schema.stance && !schema.stance.includes(stanceValue)) {
    errors.push(`Invalid ${stanceField}: ${String(stanceValue)} (allowed: ${schema.stance.join('|')})`);
  }
  if (json.keyLevel !== undefined && json.keyLevel !== null && typeof json.keyLevel !== 'string') {
    errors.push('keyLevel must be a string or null.');
  }
  return { valid: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ */
/* Validations déterministes (indépendantes de l'IA)                  */
/* ------------------------------------------------------------------ */

const isFinitePositive = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

export const MIN_RISK_REWARD = 1.5;

/**
 * Règle de veto : R:R < 1.5 -> REJETÉ. SL au-dessus de l'entrée pour un LONG,
 * ou en-dessous pour un SHORT -> invalide. Cette fonction est pure et testable
 * sans aucun appel réseau.
 */
export function validateRiskPlan(plan: any, recommendation: FinalVerdict): { ok: boolean; reason?: string; computedRR?: number } {
  const entry = plan?.entry;
  const sl = plan?.stopLoss;
  const tp1 = plan?.takeProfit1;

  if (!isFinitePositive(entry)) return { ok: false, reason: 'Entree manquante ou invalide.' };
  if (!isFinitePositive(sl)) return { ok: false, reason: 'Stop-loss manquant ou invalide.' };

  if (recommendation === 'BUY' && sl >= entry) {
    return { ok: false, reason: 'Stop-loss au-dessus de l entree pour un LONG (incoherent).' };
  }
  if (recommendation === 'SELL' && sl <= entry) {
    return { ok: false, reason: 'Stop-loss en-dessous de l entree pour un SHORT (incoherent).' };
  }

  const risk = Math.abs(entry - sl);
  const reward = isFinitePositive(tp1) ? Math.abs(tp1 - entry) : 0;
  const computedRR = risk > 0 ? reward / risk : 0;

  if (computedRR < MIN_RISK_REWARD) {
    return { ok: false, reason: 'Risk/Reward ' + computedRR.toFixed(2) + ' < 1.5 (veto du Risk Analyst).', computedRR };
  }

  return { ok: true, computedRR };
}

/* ------------------------------------------------------------------ */
/* Appel d'un agent unique via le moteur Meta                         */
/* ------------------------------------------------------------------ */

async function callSingleAgent(
  engine: any,
  agentKey: string,
  agentName: string,
  systemPrompt: string,
  userPrompt: string,
  model?: string,
  metaOnly = false,
): Promise<AgentOutput> {
  const started = Date.now();
  let result: any;

  try {
    result = await engine.runChat(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      { temperature: 0.3, task: 'reasoning', maxTokens: 1500, preferredModels: model ? [model] : undefined, metaOnly },
    );
  } catch (err: any) {
    return {
      name: agentName,
      role: agentName,
      argument: '',
      success: false,
      error: err?.message || 'Appel agent echec',
      modelUsed: model,
      provider: 'none',
      latencyMs: Date.now() - started,
    };
  }

  const json = result.success && result.text ? MultiAgentOrchestrator.tryParseJson(result.text) : undefined;
  // Models naturally return a numeric key level ("63500"); normalise it to a
  // string before the deterministic schema check instead of failing a valid
  // answer on a cosmetic type difference.
  if (json && typeof json.keyLevel === 'number' && Number.isFinite(json.keyLevel)) {
    json.keyLevel = String(json.keyLevel);
  }
  const validation = json ? validateAgentJson(agentKey, json) : { valid: false, errors: ['No parsable JSON output.'] };
  const stanceField = agentKey === 'lead' ? 'verdict' : 'stance';

  return {
    name: agentName,
    role: agentName,
    argument: result.success ? (result.text || '') : '',
    rawModelResponse: result.text,
    modelUsed: result.model,
    provider: result.provider,
    hosting: result.hosting,
    openWeight: result.openWeight,
    latencyMs: result.latencyMs,
    calls: result.calls,
    success: result.success,
    error: result.success ? undefined : result.reason,
    json,
    schemaValid: validation.valid,
    schemaErrors: validation.errors,
    stance: (json?.[stanceField] as any) ?? undefined,
    verdict: agentKey === 'lead' ? (json?.verdict as FinalVerdict) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Orchestrateur principal                                            */
/* ------------------------------------------------------------------ */

export interface FineTunedAdapter {
  explainRisk: (input: FineTunedRiskInput) => Promise<FineTunedResult>;
}

export interface OrchestratorDeps {
  /** Real engine instance (preferred: shares cache, health and metrics). */
  engine?: any;
  /** Legacy factory form, still accepted. */
  createAiEngine?: (deps?: any) => any;
  engineDeps?: any;
  /** Set false to skip the open-weight audit even when configured. */
  crossCheck?: boolean;
  /**
   * Optional local fine-tuned adapter. It produces a structured risk
   * explanation for the audit trail and never overrides the deterministic veto.
   */
  fineTunedAdapter?: FineTunedAdapter;
}

export class MultiAgentOrchestrator {
  private engine: any;
  private crossCheckEnabled: boolean;
  private fineTunedAdapter?: FineTunedAdapter;

  constructor(deps: OrchestratorDeps = {}) {
    if (deps.engine) {
      this.engine = deps.engine;
    } else if (typeof deps.createAiEngine === 'function') {
      // Never call the factory with an empty object: it would silently build
      // an engine with no provider key and no fetch implementation.
      this.engine = deps.engineDeps ? deps.createAiEngine(deps.engineDeps) : deps.createAiEngine();
    } else {
      this.engine = createAiEngine({} as any);
    }
    this.crossCheckEnabled = deps.crossCheck !== false;
    this.fineTunedAdapter = deps.fineTunedAdapter;
  }

  async run(
    symbol: string,
    timeframe: string,
    contextData: string,
    priorAnalysis: any,
    model?: string,
    metaOnly = false,
  ): Promise<OrchestrationResult> {
    const started = Date.now();
    const contradictions: string[] = [];
    const agents: Record<string, AgentOutput> = {};

    // Wave 1 — independent specialists run in parallel (lower latency than a
    // sequential chain, and they cannot contaminate each other's prompt).
    const [technical, macro, risk, strategy] = await Promise.all([
      this.technicalAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly),
      this.marketResearchAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly),
      this.riskAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly),
      this.strategyAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly),
    ]);
    agents.technical = technical;
    agents.macro = macro;
    agents.risk = risk;
    agents.strategy = strategy;

    // Wave 2 — the red team sees the technical + strategy arguments and must
    // attack them.
    const redTeam = await this.redTeamAnalyst(symbol, timeframe, contextData, priorAnalysis, technical, strategy, model, metaOnly);
    agents.redTeam = redTeam;

    this.detectContradictions(technical, macro, strategy, redTeam, contradictions);

    // Wave 3 — the Lead Analyst synthesises without hiding disagreements.
    const lead = await this.leadAnalyst(
      symbol,
      timeframe,
      technical,
      macro,
      risk,
      strategy,
      redTeam,
      contradictions,
      model,
      metaOnly,
    );
    agents.lead = lead;

    // ---- Deterministic veto 1: the Risk Analyst can block the proposal. ----
    let riskVetoApplied = false;
    let riskVetoReason: string | undefined;
    let finalVerdict: FinalVerdict = lead.verdict || 'NO_TRADE';

    if (risk.success) {
      // A veto only makes sense when the Lead actually proposed a trade.
      if (risk.stance === 'REJECTED' && finalVerdict !== 'NO_TRADE') {
        riskVetoApplied = true;
        riskVetoReason = 'Le Risk Analyst a explicitement rejete le setup (stance REJECTED).';
      } else if (finalVerdict !== 'NO_TRADE' && risk.argument) {
        const riskPlan = this.extractRiskPlan(risk.argument, risk.json);
        const validation = validateRiskPlan(riskPlan, finalVerdict);
        if (!validation.ok) {
          riskVetoApplied = true;
          riskVetoReason = validation.reason;
        }
      }
      if (riskVetoApplied) {
        finalVerdict = 'NO_TRADE';
        agents.lead = {
          ...lead,
          argument: (lead.argument || '') + '\n[VETO RISK] ' + riskVetoReason,
          verdict: 'NO_TRADE',
        } as AgentOutput;
      }
    }

    // ---- Deterministic veto 2: independent open-weight audit. ----
    const crossCheck = await this.runCrossCheck(
      symbol,
      timeframe,
      priorAnalysis,
      finalVerdict,
      agents,
      contradictions,
    );
    if (crossCheck.vetoApplied) {
      finalVerdict = 'NO_TRADE';
      agents.lead = {
        ...agents.lead,
        argument: (agents.lead.argument || '') + '\n[VETO OPEN-WEIGHT AUDIT] ' + crossCheck.concerns.join(' | '),
        verdict: 'NO_TRADE',
      } as AgentOutput;
    }

    // ---- Optional fine-tuned risk explainer (audit trail only). ----
    // It runs after every deterministic rule and cannot change the verdict.
    let fineTunedAudit: FineTunedResult | undefined;
    if (this.fineTunedAdapter && risk.success) {
      const plan = this.extractRiskPlan(risk.argument || '', risk.json);
      fineTunedAudit = await this.fineTunedAdapter.explainRisk({
        symbol,
        timeframe,
        verdict: finalVerdict,
        entry: plan.entry,
        stopLoss: plan.stopLoss,
        takeProfit1: plan.takeProfit1,
        riskRewardRatio: plan.riskRewardRatio,
        riskArgument: risk.argument,
      });
    }

    const allSuccess = [technical, macro, risk, strategy, redTeam, agents.lead].every((a) => a.success);
    const confidence = this.computeConfidence(finalVerdict, technical, macro, risk, strategy, redTeam, contradictions);
    const agentCalls = Object.values(agents).reduce((sum, a) => sum + (a.calls ?? 0), 0);
    // Engines that do not report per-agent calls still performed one request
    // per agent; count them instead of silently reporting zero.
    const calls =
      Math.max(agentCalls, Object.keys(agents).length) +
      (crossCheck.used ? 1 : 0) +
      (fineTunedAudit?.calls ?? 0);

    return {
      symbol,
      timeframe,
      consensusVerdict: finalVerdict,
      consensusConfidence: confidence.value,
      confidenceBasis: confidence.basis,
      agents,
      riskVetoApplied,
      riskVetoReason,
      openWeightVetoApplied: crossCheck.vetoApplied,
      crossCheck,
      fineTunedAudit,
      contradictions,
      latencyMs: Date.now() - started,
      calls,
      routing: [
        ...Object.entries(agents).map(([agent, a]) => ({
          agent,
          model: a.modelUsed,
          provider: a.provider,
          hosting: a.hosting,
          latencyMs: a.latencyMs,
          calls: a.calls,
        })),
        ...(fineTunedAudit?.attempted
          ? [
              {
                agent: 'fine-tuned-risk',
                model: fineTunedAudit.model,
                provider: fineTunedAudit.provider,
                hosting: 'local',
                latencyMs: fineTunedAudit.latencyMs,
                calls: fineTunedAudit.calls,
              },
            ]
          : []),
      ],
      success: allSuccess && !!finalVerdict,
      error: allSuccess ? undefined : 'Un ou plusieurs agents ont echoue.',
    };
  }

  /* -------- Agents individuels -------- */

  private async technicalAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Technical Analyst de JYNTRA AI. Tu analyses exclusivement la structure de marche (SMC/Price Action) : Order Blocks, FVG, BOS, CHoCH, supports, resistances, volumes. Tu ne fais PAS de macroeconomie ni de gestion du risque. Reponds en JSON strict avec les champs : name, stance (BULLISH/BEARISH/NEUTRAL), argument (court), keyLevel (niveau cle ou null).';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + (contextData || 'Aucun') + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Donne ton analyse technique structuree en JSON strict.';
    return callSingleAgent(this.engine, 'technical', 'Technical Analyst', system, user, model, metaOnly);
  }

  private async marketResearchAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Market Research Analyst de JYNTRA AI. Tu analyses le contexte macroeconomique, les flux institutionnels, DXY, taux, ETF. Tu ne fais PAS danalyse technique de graphique. Reponds en JSON strict : name, stance, argument, macroFactor.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + (contextData || 'Aucun') + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Donne ton analyse macro en JSON strict.';
    return callSingleAgent(this.engine, 'macro', 'Market Research Analyst', system, user, model, metaOnly);
  }

  private async riskAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Risk Manager de JYNTRA AI. Ton role est la preservation du capital. Tu verifies le Stop-Loss, le ratio Risque/Rendement (doit etre >= 1.5), et tu peux REJETER un setup. Reponds en JSON strict : name, stance (APPROVED/CAUTION/REJECTED), argument, maxRiskRecommended, riskPlan {entry, stopLoss, takeProfit1}.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + (contextData || 'Aucun') + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Evalue le risque et donne ton verdict en JSON strict.';
    return callSingleAgent(this.engine, 'risk', 'Risk Analyst', system, user, model, metaOnly);
  }

  private async strategyAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Strategy Analyst de JYNTRA AI. Tu evalues l edge statistique, la probabilite de succes, les conditions d entree/sortie. Reponds en JSON strict : name, stance (HIGH_PROBABILITY/MEDIUM/LOW_EDGE), argument, expectedEdge.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + (contextData || 'Aucun') + '. Donne ton evaluation strategique en JSON strict.';
    return callSingleAgent(this.engine, 'strategy', 'Strategy Analyst', system, user, model, metaOnly);
  }

  private async redTeamAnalyst(
    symbol: string,
    timeframe: string,
    contextData: string,
    priorAnalysis: any,
    technical: AgentOutput,
    strategy: AgentOutput,
    model?: string,
    metaOnly = false,
  ): Promise<AgentOutput> {
    const system = 'Tu es le Red-Team Analyst (Avocat du Diable) de JYNTRA AI. Ton role est de contester les hypotheses, de traquer les bull/bear traps, les fausses cassures, les pieges de liquidite. Tu DOIS etre critique. Reponds en JSON strict : name, stance (WARN_TRAP/RISK_HIGH/VALIDATED), critique, counterHypothesis, argument.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Analyse technique : ' + (technical.argument || '—') + '. Analyse strategie : ' + (strategy.argument || '—') + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Contexte : ' + (contextData || 'Aucun') + '. Trouve les failles et contradictions. Reponds en JSON strict.';
    return callSingleAgent(this.engine, 'redTeam', 'Red-Team Analyst', system, user, model, metaOnly);
  }

  private async leadAnalyst(
    symbol: string,
    timeframe: string,
    technical: AgentOutput,
    macro: AgentOutput,
    risk: AgentOutput,
    strategy: AgentOutput,
    redTeam: AgentOutput,
    contradictions: string[],
    model?: string,
    metaOnly = false,
  ): Promise<AgentOutput> {
    const system = 'Tu es le Lead Analyst de JYNTRA AI. Tu synthetises le debat des 6 agents, tu tranches les contradictions et tu donnes un verdict final univoque : BUY, SELL ou NO_TRADE. Tu respectes le veto du Risk Analyst et tu ne masques aucun desaccord. Reponds en JSON strict : name, verdict, executiveSummary, keyDisagreements, suggestedAction, argument.';
    const user = 'Actif ' + symbol + ' (' + timeframe + ').\n' +
      'Technical: ' + (technical.argument || '—') + ' (' + (technical.stance || '—') + ')\n' +
      'Macro: ' + (macro.argument || '—') + ' (' + (macro.stance || '—') + ')\n' +
      'Risk: ' + (risk.argument || '—') + ' (' + (risk.stance || '—') + ')\n' +
      'Strategy: ' + (strategy.argument || '—') + ' (' + (strategy.stance || '—') + ')\n' +
      'Red-Team: ' + (redTeam.argument || '—') + ' (' + (redTeam.stance || '—') + ')\n' +
      'Contradictions detectees : ' + (contradictions.length ? contradictions.join(' | ') : 'Aucune') + '\n' +
      'Donne ton verdict final et synthese en JSON strict.';
    const result = await callSingleAgent(this.engine, 'lead', 'Lead Analyst', system, user, model, metaOnly);
    // Extraire le verdict depuis le JSON parse si disponible.
    if (result.json && ['BUY', 'SELL', 'NO_TRADE'].includes(result.json.verdict)) {
      result.verdict = result.json.verdict as FinalVerdict;
    }
    if (result.json && typeof result.json.executiveSummary === 'string') {
      result.argument = result.json.executiveSummary;
    }
    return result;
  }

  /* -------- Audit contradictoire open-weight -------- */

  private async runCrossCheck(
    symbol: string,
    timeframe: string,
    priorAnalysis: any,
    verdict: FinalVerdict,
    agents: Record<string, AgentOutput>,
    contradictions: string[],
  ): Promise<CrossCheckResult> {
    const skipped: CrossCheckResult = { attempted: false, used: false, concerns: [], vetoApplied: false };
    if (!this.crossCheckEnabled || typeof this.engine?.crossCheck !== 'function') return skipped;

    const status = typeof this.engine.openWeightStatus === 'function' ? this.engine.openWeightStatus() : null;
    if (!status?.configured) {
      return { ...skipped, reason: status?.reason || 'OPEN_WEIGHT_NOT_CONFIGURED' };
    }

    const payload = JSON.stringify({
      symbol,
      timeframe,
      verdict,
      priorAnalysis,
      contradictions,
      agents: Object.fromEntries(
        Object.entries(agents).map(([key, a]) => [key, { stance: a.stance, verdict: a.verdict, argument: a.argument, schemaValid: a.schemaValid }]),
      ),
    });

    const audit = await this.engine.crossCheck(payload);
    if (!audit?.success) {
      return {
        attempted: true,
        used: false,
        model: audit?.model,
        hosting: audit?.hosting,
        latencyMs: audit?.latencyMs,
        reason: audit?.reason || 'OPEN_WEIGHT_AUDIT_FAILED',
        concerns: [],
        vetoApplied: false,
      };
    }

    const parsed = MultiAgentOrchestrator.tryParseJson(audit.text || '');
    const agreement = typeof parsed?.agreement === 'boolean' ? parsed.agreement : undefined;
    const severity = ['LOW', 'MEDIUM', 'HIGH'].includes(parsed?.severity) ? parsed.severity : undefined;
    const auditVerdict = ['BUY', 'SELL', 'NO_TRADE', 'UNKNOWN'].includes(parsed?.verdict) ? parsed.verdict : 'UNKNOWN';
    const concerns = Array.isArray(parsed?.concerns) ? parsed.concerns.filter((c: any) => typeof c === 'string').slice(0, 10) : [];

    // A high-severity disagreement is a genuine veto, not a warning that can
    // be ignored by the Lead Analyst.
    const vetoApplied = agreement === false && severity === 'HIGH';
    if (vetoApplied) {
      contradictions.push('Audit open-weight: desaccord HIGH — ' + (concerns[0] || 'verdict conteste'));
    }

    return {
      attempted: true,
      used: true,
      model: audit.model,
      hosting: audit.hosting,
      agreement,
      severity,
      verdict: auditVerdict,
      concerns,
      latencyMs: audit.latencyMs,
      vetoApplied,
    };
  }

  /* -------- Extraction du plan de risque -------- */

  private extractRiskPlan(argument: string, json?: any): any {
    // Structured output wins over free text.
    const structured = json?.riskPlan && typeof json.riskPlan === 'object' ? json.riskPlan : null;
    if (structured) {
      return {
        entry: Number(structured.entry),
        stopLoss: Number(structured.stopLoss),
        takeProfit1: Number(structured.takeProfit1 ?? structured.takeProfit),
      };
    }

    const plan: any = {};
    const mEntry = argument.match(/entr[ée]e\s*[:=]\s*([\d.,]+)/i);
    if (mEntry) plan.entry = parseFloat(mEntry[1].replace(',', '.'));
    const mSl = argument.match(/stop[\s-]*loss\s*[:=]\s*([\d.,]+)/i);
    if (mSl) plan.stopLoss = parseFloat(mSl[1].replace(',', '.'));
    const mTp = argument.match(/(?:takeProfit1|tp1)\s*[:=]\s*([\d.,]+)/i);
    if (mTp) plan.takeProfit1 = parseFloat(mTp[1].replace(',', '.'));
    const mRR = argument.match(/r.?r\s*[:=]\s*([\d.,]+)/i);
    if (mRR) plan.riskRewardRatio = parseFloat(mRR[1].replace(',', '.'));
    return plan;
  }

  static tryParseJson(text: string): any {
    try {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return undefined;
    }
  }

  /* -------- Confiance déterministe (aucun chiffre inventé par le modèle) -------- */

  private computeConfidence(
    verdict: FinalVerdict,
    technical: AgentOutput,
    macro: AgentOutput,
    risk: AgentOutput,
    strategy: AgentOutput,
    redTeam: AgentOutput,
    contradictions: string[],
  ): { value: number; basis: string } {
    let score = 50;
    const reasons: string[] = ['base 50'];

    if (verdict !== 'NO_TRADE') {
      const direction = verdict === 'BUY' ? 'BULLISH' : 'BEARISH';
      if (technical.stance === direction) { score += 15; reasons.push('technical aligned +15'); }
      else if (technical.stance === 'NEUTRAL') { score -= 5; reasons.push('technical neutral -5'); }
      else { score -= 20; reasons.push('technical opposite -20'); }

      if (macro.stance === direction) { score += 10; reasons.push('macro aligned +10'); }
      else if (macro.stance === 'NEUTRAL') { score -= 5; reasons.push('macro neutral -5'); }
      else { score -= 15; reasons.push('macro opposite -15'); }
    }

    if (strategy.stance === 'HIGH_PROBABILITY') { score += 10; reasons.push('high edge +10'); }
    if (strategy.stance === 'LOW_EDGE') { score -= 15; reasons.push('low edge -15'); }
    if (risk.stance === 'APPROVED') { score += 10; reasons.push('risk approved +10'); }
    if (risk.stance === 'CAUTION') { score -= 5; reasons.push('risk caution -5'); }
    if (risk.stance === 'REJECTED') { score -= 40; reasons.push('risk rejected -40'); }
    if (redTeam.stance === 'WARN_TRAP') { score -= 10; reasons.push('red-team trap -10'); }
    if (redTeam.stance === 'RISK_HIGH') { score -= 15; reasons.push('red-team high risk -15'); }
    if (contradictions.length) {
      score -= 10 * contradictions.length;
      reasons.push(`${contradictions.length} contradiction(s) -${10 * contradictions.length}`);
    }

    const value = Math.max(0, Math.min(95, Math.round(score)));
    return { value, basis: reasons.join('; ') };
  }

  private detectContradictions(
    technical: AgentOutput,
    macro: AgentOutput,
    strategy: AgentOutput,
    redTeam: AgentOutput,
    contradictions: string[],
  ): void {
    const techStance = technical.stance as string;
    const macroStance = macro.stance as string;
    const stratStance = strategy.stance as string;
    const redTeamStance = redTeam.stance as string;

    if (techStance === 'BULLISH' && macroStance === 'BEARISH') {
      contradictions.push('Analyse technique BULLISH vs analyse macro BEARISH (conflit de direction).');
    }
    if (techStance === 'BEARISH' && macroStance === 'BULLISH') {
      contradictions.push('Analyse technique BEARISH vs analyse macro BULLISH (conflit de direction).');
    }
    if (stratStance === 'LOW_EDGE' && (techStance === 'BULLISH' || techStance === 'BEARISH')) {
      contradictions.push('Edge faible (LOW_EDGE) malgre une direction technique affirmee.');
    }
    if (redTeamStance === 'RISK_HIGH' && (techStance === 'BULLISH' || techStance === 'BEARISH')) {
      contradictions.push('Red-Team signale un risque eleve malgre une direction technique.');
    }
  }
}
