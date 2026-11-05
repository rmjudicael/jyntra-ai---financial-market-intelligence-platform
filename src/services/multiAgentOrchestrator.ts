/**
 * JYNTRA AI — Multi-Agent Orchestrator (server-side).
 *
 * Orchestre véritablement les six agents spécialisés via des appels séparés
 * au moteur Meta AI (aiEngine). Chaque agent produit sa propre sortie typée,
 * et le Lead Analyst synthétise avec détection des contradictions et règle
 * de veto du Risk Analyst.
 *
 * Aucun résultat n'est simulé : si Meta est indisponible, l'echec est honnete.
 */
import { createAiEngine } from '../server/aiEngine.ts';

/* ------------------------------------------------------------------ */
/* Types partages                                                     */
/* ------------------------------------------------------------------ */

export type AgentStance = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type AgentRiskStatus = 'APPROVED' | 'CAUTION' | 'REJECTED';
export type AgentStrategyEdge = 'HIGH_PROBABILITY' | 'MEDIUM' | 'LOW_EDGE';
export type AgentRedTeamStatus = 'WARN_TRAP' | 'RISK_HIGH' | 'VALIDATED';
export type FinalVerdict = 'BUY' | 'SELL' | 'NO_TRADE';

export interface AgentOutput {
  name: string;
  role: string;
  stance?: AgentStance;
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
  latencyMs?: number;
  success: boolean;
  error?: string;
  json?: any;
}

export interface OrchestrationResult {
  symbol: string;
  timeframe: string;
  consensusVerdict: FinalVerdict;
  consensusConfidence: number;
  agents: Record<string, AgentOutput>;
  riskVetoApplied: boolean;
  riskVetoReason?: string;
  contradictions: string[];
  latencyMs: number;
  calls: number;
  success: boolean;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Validations deterministes (independantes de l'IA)                 */
/* ------------------------------------------------------------------ */

const isFinitePositive = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Regle de veto : R:R < 1.5 -> REJECTE. SL au-dessus de l'entree pour un LONG,
 * ou en-dessous pour un SHORT -> invalide. */
function validateRiskPlan(plan: any, recommendation: FinalVerdict): { ok: boolean; reason?: string } {
  const entry = plan?.entry;
  const sl = plan?.stopLoss;
  const tp1 = plan?.takeProfit1;
  const rr = plan?.riskRewardRatio;

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

  if (computedRR < 1.5) {
    return { ok: false, reason: 'Risk/Reward ' + computedRR.toFixed(2) + ' < 1.5 (veto du Risk Analyst).' };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Appel d'un agent unique via le moteur Meta                        */
/* ------------------------------------------------------------------ */

async function callSingleAgent(
  engine: any,
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

  return {
    name: agentName,
    role: agentName,
    argument: result.success ? (result.text || '') : '',
    rawModelResponse: result.text,
    modelUsed: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
    success: result.success,
    error: result.success ? undefined : result.reason,
    json,
    stance: json?.stance as AgentStance | undefined,
    verdict: json?.verdict as FinalVerdict | undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Orchestrateur principal                                           */
/* ------------------------------------------------------------------ */

export interface OrchestratorDeps {
  createAiEngine: any;
}

export class MultiAgentOrchestrator {
  private engine: any;

  constructor(deps: OrchestratorDeps) {
    this.engine = deps.createAiEngine({} as any);
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

    // 1. Technical Analyst
    const technical = await this.technicalAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly);
    agents.technical = technical;

    // 2. Market Research Analyst
    const macro = await this.marketResearchAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly);
    agents.macro = macro;

    // 3. Risk Analyst (avec veto)
    const risk = await this.riskAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly);
    agents.risk = risk;

    // 4. Strategy Analyst
    const strategy = await this.strategyAnalyst(symbol, timeframe, contextData, priorAnalysis, model, metaOnly);
    agents.strategy = strategy;

    // 5. Red-Team Analyst (contredit les hypothèses)
    const redTeam = await this.redTeamAnalyst(symbol, timeframe, contextData, priorAnalysis, technical, strategy, model, metaOnly);
    agents.redTeam = redTeam;

    // Detection des contradictions
    this.detectContradictions(technical, macro, strategy, redTeam, contradictions);

    // 6. Lead Analyst (synthese avec veto du Risk Analyst)
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

    // Application du veto du Risk Analyst
    let riskVetoApplied = false;
    let riskVetoReason: string | undefined;
    let finalVerdict: FinalVerdict = lead.verdict || 'NO_TRADE';

    if (risk.success && risk.argument) {
      const riskPlan = this.extractRiskPlan(risk.argument);
      const validation = validateRiskPlan(riskPlan, finalVerdict);
      if (!validation.ok) {
        riskVetoApplied = true;
        riskVetoReason = validation.reason;
        finalVerdict = 'NO_TRADE';
        agents.lead = {
          ...lead,
          argument: (lead.argument || '') + '\n[VETO RISK] ' + validation.reason,
          verdict: 'NO_TRADE',
        } as AgentOutput;
      }
    }

    const allSuccess = [technical, macro, risk, strategy, redTeam, lead].every((a) => a.success);

    return {
      symbol,
      timeframe,
      consensusVerdict: finalVerdict,
      consensusConfidence: lead.success ? 50 : 0,
      agents,
      riskVetoApplied,
      riskVetoReason,
      contradictions,
      latencyMs: Date.now() - started,
      calls: Object.values(agents).reduce((sum, a) => sum + 1, 0),
      success: allSuccess && !!finalVerdict,
      error: allSuccess ? undefined : 'Un ou plusieurs agents ont echec.',
    };
  }

  /* -------- Agents individuels -------- */

  private async technicalAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Technical Analyst de JYNTRA AI. Tu analyses exclusivement la structure de marche (SMC/Price Action) : Order Blocks, FVG, BOS, CHoCH, supports, resistances, volumes. Tu ne fais PAS de macroeconomie ni de gestion du risque. Reponds en JSON strict avec les champs : name, stance (BULLISH/BEARISH/NEUTRAL), argument (court), keyLevel (niveau cle ou null).';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + contextData || 'Aucun' + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Donne ton analyse technique structuree en JSON strict.';
    return callSingleAgent(this.engine, 'Technical Analyst', system, user, model, metaOnly);
  }

  private async marketResearchAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Market Research Analyst de JYNTRA AI. Tu analyses le contexte macroeconomique, les flux institutionnels, DXY, taux, ETF. Tu ne fais PAS danalyse technique de graphique. Reponds en JSON strict : name, stance, argument, macroFactor.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + contextData || 'Aucun' + '. Donne ton analyse macro en JSON strict.';
    return callSingleAgent(this.engine, 'Market Research Analyst', system, user, model, metaOnly);
  }

  private async riskAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Risk Manager de JYNTRA AI. Ton role est la preservation du capital. Tu verifies le Stop-Loss, le ratio Risque/Rendement (doit etre >= 1.5), et tu peux REJETER un setup. Reponds en JSON strict : name, stance (APPROVED/CAUTION/REJECTED), argument, maxRiskRecommended.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + contextData || 'Aucun' + '. Analyse precedente : ' + JSON.stringify(priorAnalysis || {}) + '. Evalue le risque et donne ton verdict en JSON strict.';
    return callSingleAgent(this.engine, 'Risk Analyst', system, user, model, metaOnly);
  }

  private async strategyAnalyst(symbol: string, timeframe: string, contextData: string, priorAnalysis: any, model?: string, metaOnly = false): Promise<AgentOutput> {
    const system = 'Tu es le Strategy Analyst de JYNTRA AI. Tu evalues l edge statistique, la probabilite de succes, les conditions d entree/sortie. Reponds en JSON strict : name, stance (HIGH_PROBABILITY/MEDIUM/LOW_EDGE), argument, expectedEdge.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Contexte : ' + contextData || 'Aucun' + '. Donne ton evaluation strategique en JSON strict.';
    return callSingleAgent(this.engine, 'Strategy Analyst', system, user, model, metaOnly);
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
    const system = 'Tu es le Red-Team Analyst (Avocat du Diable) de JYNTRA AI. Ton role est de contester les hypotheses, de traquer les bull/bear traps, les fausses cassures, les pieges de liquidite. Tu DOIS etre critique. Reponds en JSON strict : name, stance (WARN_TRAP/RISK_HIGH/VALIDATED), critique, counterHypothesis.';
    const user = 'Actif ' + symbol + ' (' + timeframe + '). Analyse technique : ' + (technical.argument || '—') + '. Analyse strategie : ' + (strategy.argument || '—') + '. Contexte : ' + contextData || 'Aucun' + '. Trouve les failles et contradictions. Reponds en JSON strict.';
    return callSingleAgent(this.engine, 'Red-Team Analyst', system, user, model, metaOnly);
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
    const system = 'Tu es le Lead Analyst de JYNTRA AI. Tu synthetises le debat des 6 agents, tu tranches les contradictions et tu donnes un verdict final univoque : BUY, SELL ou NO_TRADE. Tu respectes le veto du Risk Analyst. Reponds en JSON strict : name, verdict, executiveSummary, keyDisagreements, suggestedAction.';
    const user = 'Actif ' + symbol + ' (' + timeframe + ').\n' +
      'Technical: ' + (technical.argument || '—') + ' (' + (technical.stance || '—') + ')\n' +
      'Macro: ' + (macro.argument || '—') + ' (' + (macro.stance || '—') + ')\n' +
      'Risk: ' + (risk.argument || '—') + ' (' + (risk.stance || '—') + ')\n' +
      'Strategy: ' + (strategy.argument || '—') + ' (' + (strategy.stance || '—') + ')\n' +
      'Red-Team: ' + (redTeam.argument || '—') + ' (' + (redTeam.stance || '—') + ')\n' +
      'Contradictions detectees : ' + (contradictions.length ? contradictions.join(' | ') : 'Aucune') + '\n' +
      'Donne ton verdict final et synthese en JSON strict.';
    const result = await callSingleAgent(this.engine, 'Lead Analyst', system, user, model, metaOnly);
    // Extraire le verdict depuis le JSON parse si disponible
    if (result.json && result.json.verdict) {
      result.verdict = result.json.verdict as FinalVerdict;
    }
    if (result.json && result.json.executiveSummary) {
      result.argument = result.json.executiveSummary;
    }
    return result;
  }

  /* -------- Extraction du plan de risque depuis le texte du Risk Analyst -------- */

  private extractRiskPlan(argument: string): any {
    const plan: any = {};
    const mEntry = argument.match(/entrée\s*[:=]\s*([\d.,]+)/i);
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

  private detectContradictions(
    technical: AgentOutput,
    macro: AgentOutput,
    strategy: AgentOutput,
    redTeam: AgentOutput,
    contradictions: string[],
  ): void {
    const techStance = (technical.stance as any) as string;
    const macroStance = (macro.stance as any) as string;
    const stratStance = (strategy.stance as any) as string;
    const redTeamStance = (redTeam.stance as any) as string;

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
