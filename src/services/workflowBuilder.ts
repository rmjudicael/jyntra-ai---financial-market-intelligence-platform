/**
 * JYNTRA Workflow Studio — real orchestration model.
 *
 * Every block performs a genuine operation:
 *  - market     : real candles from the platform market feed (Binance/ECB/Yahoo)
 *  - news       : real RSS headlines already fetched by the server
 *  - chart      : the last real chart analysis produced by the vision pipeline
 *  - risk       : deterministic position sizing / R:R validation
 *  - agents     : the real multi-agent debate endpoint
 *  - ai         : a real JYNTRA reasoning call over the collected outputs
 *
 * Nothing is simulated: a block either returns a real output, or fails and
 * reports why. Completed outputs are persisted so an execution can resume
 * without paying twice for work that already succeeded.
 */
import { calculateRisk } from '../utils/riskCalculator';
import { loadChartAnalysisState } from './workflowStore';
import { LocalStore } from './storage';

export type WorkflowBlockKind = 'market' | 'candles' | 'news' | 'chart' | 'agents' | 'risk' | 'ai';
export type BlockStatus = 'idle' | 'running' | 'success' | 'error';

export interface WorkflowBlockConfig {
  symbol?: string;
  timeframe?: string;
  interval?: string;
  limit?: number;
  newsLimit?: number;
  prompt?: string;
  accountBalance?: number;
  riskPercent?: number;
  minRiskReward?: number;
}

export interface WorkflowBlock {
  id: string;
  kind: WorkflowBlockKind;
  title: string;
  config: WorkflowBlockConfig;
}

export interface WorkflowBlueprint {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  blocks: WorkflowBlock[];
}

export interface WorkflowBlockRun {
  blockId: string;
  kind: WorkflowBlockKind;
  title: string;
  status: BlockStatus;
  startedAt?: number;
  endedAt?: number;
  summary?: string;
  output?: any;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  blueprintId: string;
  userId: string;
  name: string;
  symbol: string;
  timeframe: string;
  status: 'running' | 'success' | 'error';
  blocks: WorkflowBlockRun[];
  createdAt: number;
  updatedAt: number;
  error?: string;
  resumed?: boolean;
}

const BLUEPRINTS_KEY = 'jyntra_v1_workflow_blueprints';
const EXECUTIONS_KEY = 'jyntra_v1_workflow_builder_runs';

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function emitWorkflowBuilderChange() {
  try {
    window.dispatchEvent(new CustomEvent('jyntra_workflow_builder_update'));
  } catch {
    /* non-browser */
  }
}

export function listBlueprints(userId: string): WorkflowBlueprint[] {
  return LocalStore.get<WorkflowBlueprint[]>(BLUEPRINTS_KEY, [])
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveBlueprint(blueprint: WorkflowBlueprint): WorkflowBlueprint {
  const all = LocalStore.get<WorkflowBlueprint[]>(BLUEPRINTS_KEY, []);
  const next = { ...blueprint, updatedAt: Date.now() };
  const index = all.findIndex((item) => item.id === blueprint.id);
  if (index >= 0) all[index] = next;
  else all.push(next);
  LocalStore.set(BLUEPRINTS_KEY, all.slice(-40));
  emitWorkflowBuilderChange();
  return next;
}

export function deleteBlueprint(id: string) {
  const all = LocalStore.get<WorkflowBlueprint[]>(BLUEPRINTS_KEY, []).filter((item) => item.id !== id);
  LocalStore.set(BLUEPRINTS_KEY, all);
  emitWorkflowBuilderChange();
}

export function listExecutions(userId: string): WorkflowExecution[] {
  return LocalStore.get<WorkflowExecution[]>(EXECUTIONS_KEY, [])
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function saveExecution(execution: WorkflowExecution) {
  const all = LocalStore.get<WorkflowExecution[]>(EXECUTIONS_KEY, []);
  const index = all.findIndex((item) => item.id === execution.id);
  const next = { ...execution, updatedAt: Date.now() };
  if (index >= 0) all[index] = next;
  else all.push(next);
  LocalStore.set(EXECUTIONS_KEY, all.slice(-25));
  emitWorkflowBuilderChange();
}

export function getExecution(id: string, userId: string): WorkflowExecution | null {
  return listExecutions(userId).find((item) => item.id === id) || null;
}

export function deleteExecution(id: string) {
  LocalStore.set(EXECUTIONS_KEY, LocalStore.get<WorkflowExecution[]>(EXECUTIONS_KEY, []).filter((item) => item.id !== id));
  emitWorkflowBuilderChange();
}

export const BLOCK_LIBRARY: Record<WorkflowBlockKind, { title: string; hint: string }> = {
  market: { title: 'Instantané de marché', hint: 'Bougies réelles + dernier prix, variation et amplitude' },
  candles: { title: 'Série de bougies', hint: 'Historique réel OHLC pour analyse quantitative' },
  news: { title: 'Actualités réelles', hint: 'Derniers titres du flux RSS financier public' },
  chart: { title: 'Analyse graphique', hint: 'Dernière analyse visuelle réellement produite' },
  agents: { title: 'Arbitrage multi-agents', hint: 'Débat contradictoire sur l’analyse graphique disponible' },
  risk: { title: 'Validation du risque', hint: 'Calcul déterministe de position et ratio R:R' },
  ai: { title: 'Synthèse IA', hint: 'Raisonnement sur les sorties réelles des blocs précédents' },
};

export function createBlock(kind: WorkflowBlockKind, config: WorkflowBlockConfig = {}): WorkflowBlock {
  return {
    id: uid('blk'),
    kind,
    title: BLOCK_LIBRARY[kind].title,
    config: {
      symbol: config.symbol ?? 'BTC/USDT',
      timeframe: config.timeframe ?? '1H',
      interval: config.interval ?? '1h',
      limit: config.limit ?? 120,
      newsLimit: config.newsLimit ?? 5,
      prompt: config.prompt,
      accountBalance: config.accountBalance ?? 10000,
      riskPercent: config.riskPercent ?? 1,
      minRiskReward: config.minRiskReward ?? 1.5,
    },
  };
}

interface TemplateDef {
  id: string;
  name: string;
  description: string;
  blocks: Array<{ kind: WorkflowBlockKind; config?: WorkflowBlockConfig }>;
}

export const WORKFLOW_TEMPLATES: TemplateDef[] = [
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    description: 'Marché réel → actualités réelles → contexte → synthèse argumentée.',
    blocks: [
      { kind: 'market' },
      { kind: 'news' },
      {
        kind: 'ai',
        config: {
          prompt:
            'Produis une note de marché structurée : régime observé, catalyseurs, risques contradictoires, scénarios conditionnels. Utilise uniquement les données fournies.',
        },
      },
    ],
  },
  {
    id: 'chart-intelligence',
    name: 'Multimodal Chart Intelligence',
    description: 'Analyse graphique existante → validation du risque → lecture experte.',
    blocks: [
      { kind: 'chart' },
      { kind: 'risk' },
      {
        kind: 'ai',
        config: {
          prompt:
            'Confronte la lecture du graphique à la validation du risque. Explique ce qui est observé, ce qui est interprété, et les scénarios conditionnels. Respecte le veto du moteur.',
        },
      },
    ],
  },
  {
    id: 'news-impact',
    name: 'Financial News Impact',
    description: 'Titres réels → compréhension → contexte → impact potentiel et incertitude.',
    blocks: [
      { kind: 'news', config: { newsLimit: 6 } },
      {
        kind: 'ai',
        config: {
          prompt:
            'Classe les titres fournis par thème, distingue les faits des interprétations, puis propose un impact potentiel par classe d’actifs avec le niveau d’incertitude. N’invente aucun chiffre.',
        },
      },
    ],
  },
  {
    id: 'risk-intelligence',
    name: 'Risk Intelligence',
    description: 'Données de marché → plan disponible → veto déterministe → explication.',
    blocks: [
      { kind: 'market' },
      { kind: 'risk' },
      {
        kind: 'ai',
        config: {
          prompt:
            'Explique la décision du moteur de risque sans la contourner. Si le veto est actif, propose uniquement des conditions à réunir, jamais un trade forcé.',
        },
      },
    ],
  },
  {
    id: 'multi-agent-arbitration',
    name: 'Multi-Agent Arbitration',
    description: 'Analyse graphique → comité d’agents → synthèse du Lead Analyst.',
    blocks: [
      { kind: 'chart' },
      { kind: 'agents' },
      {
        kind: 'ai',
        config: {
          prompt:
            'Synthétise l’arbitrage des agents. Reprends les désaccords majeurs et termine par une décision conditionnelle, jamais une garantie.',
        },
      },
    ],
  },
];

export function createBlueprintFromTemplate(userId: string, templateId: string): WorkflowBlueprint {
  const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId) || WORKFLOW_TEMPLATES[0];
  const baseConfig: WorkflowBlockConfig = { symbol: 'BTC/USDT', timeframe: '1H', interval: '1h' };
  return {
    id: uid('wf'),
    userId,
    name: template.name,
    description: template.description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: template.blocks.map((item) => createBlock(item.kind, { ...baseConfig, ...item.config })),
  };
}

export function createEmptyBlueprint(userId: string): WorkflowBlueprint {
  return {
    id: uid('wf'),
    userId,
    name: 'Workflow personnalisé',
    description: 'Construit bloc par bloc. Chaque bloc appelle une opération réelle.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: [createBlock('market')],
  };
}

/* ------------------------------------------------------------------ */
/* Pure helpers (unit-tested)                                          */
/* ------------------------------------------------------------------ */

export function reorderBlocks(blocks: WorkflowBlock[], from: number, to: number): WorkflowBlock[] {
  if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function nextPendingIndex(blocks: WorkflowBlockRun[]): number {
  return blocks.findIndex((item) => item.status !== 'success');
}

/** Human-readable context handed from completed blocks to the next AI block. */
export function buildContext(blocks: WorkflowBlockRun[], maxChars = 9000): string {
  return blocks
    .filter((item) => item.status === 'success')
    .map((item) => {
      const payload = item.output !== undefined ? JSON.stringify(item.output, null, 2) : item.summary || '';
      return `### ${item.title} (${item.kind})\n${payload}`;
    })
    .join('\n\n')
    .slice(0, maxChars);
}

export function blockNeedsSymbol(kind: WorkflowBlockKind): boolean {
  return kind === 'market' || kind === 'candles' || kind === 'agents';
}

/* ------------------------------------------------------------------ */
/* Execution                                                           */
/* ------------------------------------------------------------------ */

const fail = (message: string): never => {
  throw new Error(message);
};

async function jsonFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(typeof data?.error === 'string' ? data.error : `Le service a répondu ${res.status}.`);
  }
  return data;
}

function getStoredAnalysis(): any | null {
  const state = loadChartAnalysisState();
  return state?.analysis || null;
}

function analysisSummary(analysis: any): string {
  const trend = analysis?.visualObservations?.trend || '—';
  const recommendation = analysis?.recommendation || 'NO_TRADE';
  const plan = analysis?.tradePlan || {};
  const price = (value: any) => (typeof value === 'number' && Number.isFinite(value) ? value : '—');
  return `Tendance ${trend} · recommandation ${recommendation} · entrée ${price(plan.entry)} · SL ${price(plan.stopLoss)} · TP1 ${price(plan.takeProfit1)} · R:R ${price(plan.riskRewardRatio)}`;
}

async function runBlock(block: WorkflowBlock, context: string): Promise<{ summary: string; output: any }> {
  const cfg = block.config || {};
  switch (block.kind) {
    case 'market':
    case 'candles': {
      const symbol = cfg.symbol || 'BTC/USDT';
      const interval = cfg.interval || '1h';
      const limit = Math.min(Math.max(Number(cfg.limit) || 120, 20), 300);
      const data = await jsonFetch(
        `/api/market/candles?symbol=${encodeURIComponent(symbol.replace('/', ''))}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
      );
      const candles = Array.isArray(data.candles) ? data.candles : [];
      if (!data.success || candles.length < 2) fail('La source de marché n’a pas renvoyé de bougies exploitables.');
      const first = candles[0];
      const last = candles[candles.length - 1];
      const closes = candles.map((c: any) => Number(c.close)).filter((n: number) => Number.isFinite(n));
      const high = Math.max(...closes);
      const low = Math.min(...closes);
      const changePct = first.close ? ((last.close - first.close) / first.close) * 100 : null;
      const summary =
        block.kind === 'candles'
          ? `${candles.length} bougies ${interval} · dernier close ${last.close}`
          : `${symbol} ${interval} · dernier close ${last.close} · variation ${changePct === null ? '—' : changePct.toFixed(2) + '%'}`;
      return {
        summary,
        output: {
          symbol: data.symbol || symbol,
          interval: data.interval || interval,
          source: data.source || null,
          freshness: data.freshness || null,
          candleCount: candles.length,
          lastClose: last.close,
          changePct,
          rangeHigh: high,
          rangeLow: low,
          lastTimestamp: last.timestamp,
          candles: block.kind === 'candles' ? candles.slice(-limit) : undefined,
        },
      };
    }

    case 'news': {
      const data = await jsonFetch('/api/market/news');
      if (!data.success || !Array.isArray(data.news)) fail('Aucun flux d’actualités réel n’a répondu.');
      const limit = Math.min(Math.max(Number(cfg.newsLimit) || 5, 1), 12);
      const headlines = data.news.slice(0, limit).map((item: any) => ({
        title: item.title,
        source: item.source,
        date: item.date,
        category: item.category,
        summary: item.description || item.facts || '',
        url: item.url,
      }));
      return {
        summary: `${headlines.length} titres réels · ${data.source || 'flux public'}${data.stale ? ' (dernier instantané)' : ''}`,
        output: { source: data.source, stale: Boolean(data.stale), count: headlines.length, headlines },
      };
    }

    case 'chart': {
      const analysis = getStoredAnalysis();
      if (!analysis) fail('Aucune analyse graphique réelle disponible. Lancez d’abord une Analyse Graphique avec une capture MT4/MT5/TradingView.');
      return {
        summary: analysisSummary(analysis),
        output: {
          instrument: analysis.instrument,
          timeframe: analysis.timeframe,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          trend: analysis.visualObservations?.trend,
          structure: analysis.visualObservations?.marketStructure,
          supports: analysis.visualObservations?.keySupports || [],
          resistances: analysis.visualObservations?.keyResistances || [],
          orderBlocks: analysis.visualObservations?.orderBlocks || [],
          fairValueGaps: analysis.visualObservations?.fairValueGaps || [],
          liquidityZones: analysis.visualObservations?.liquidityZones || [],
          tradePlan: analysis.tradePlan,
          hypotheses: analysis.hypotheses,
          note: 'Analyse visuelle réelle, non rejouée : ce bloc réutilise le dernier résultat validé.',
        },
      };
    }

    case 'agents': {
      const analysis = getStoredAnalysis();
      if (!analysis) fail('Le comité d’agents exige une analyse graphique réelle préalable.');
      const data = await jsonFetch('/api/ai/multi-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: cfg.symbol || analysis.instrument || 'BTC/USDT',
          timeframe: cfg.timeframe || analysis.timeframe || '1H',
          contextData: context.slice(0, 6000),
          priorAnalysis: analysis,
        }),
      });
      if (!data.success || !data.consensus) fail('Le comité d’agents n’a pas produit de consensus.');
      const verdict = data.consensus?.consensusVerdict || 'NO_TRADE';
      return {
        summary: `Verdict ${verdict} · confiance ${data.consensus?.consensusConfidence ?? '—'}%`,
        output: data.consensus,
      };
    }

    case 'risk': {
      const analysis = getStoredAnalysis();
      const plan = analysis?.tradePlan;
      if (!analysis || !plan || !plan.entry || !plan.stopLoss || !plan.takeProfit1) {
        fail('Aucun plan chiffré complet (entrée, stop, objectif) n’est disponible pour calculer le risque.');
      }
      const isLong = String(analysis.recommendation).toUpperCase() === 'BUY';
      const result = calculateRisk({
        accountBalance: Math.max(Number(cfg.accountBalance) || 10000, 1),
        riskPercentage: Math.min(Math.max(Number(cfg.riskPercent) || 1, 0.1), 10),
        entryPrice: plan.entry,
        stopLossPrice: plan.stopLoss,
        takeProfitPrice: plan.takeProfit1,
        isLong,
      });
      const minRR = Number(cfg.minRiskReward) || 1.5;
      const veto = !result.isValid || result.riskRewardRatio < minRR;
      const summary = veto
        ? `VETO RISQUE · R:R ${result.riskRewardRatio} < ${minRR} ou plan invalide. Le moteur ne contourne pas sa règle.`
        : `Risque validé · R:R ${result.riskRewardRatio} · taille ${result.positionSize} unités · risque ${result.riskAmount}`;
      return {
        summary,
        output: {
          verdict: veto ? 'VETO' : 'AUTORISÉ',
          minRiskReward: minRR,
          direction: isLong ? 'LONG' : 'SHORT',
          ...result,
        },
      };
    }

    case 'ai': {
      if (!context.trim()) fail('Aucune sortie réelle à synthétiser : exécutez d’abord un bloc de données.');
      const instruction =
        cfg.prompt ||
        'Produis une synthèse structurée des données réelles fournies : observation, interprétation, hypothèses, incertitude.';
      const data = await jsonFetch('/api/ai/engine-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt:
            'Tu es le moteur de raisonnement de JYNTRA AI. Tu travailles uniquement sur les données réelles fournies. Tu sépares OBSERVATION, INTERPRÉTATION et HYPOTHÈSE. Tu n’inventes ni prix, ni statistique, ni actualité. Si une donnée manque, tu le dis.',
          prompt: `${instruction}\n\nDONNÉES RÉELLES DES BLOCS PRÉCÉDENTS :\n${context}`,
        }),
      });
      if (!data.success || typeof data.text !== 'string') fail('Le moteur de raisonnement n’a pas produit de synthèse.');
      return {
        summary: `Synthèse produite · ${String(data.text).length} caractères`,
        output: { text: data.text, engine: 'JYNTRA AI' },
      };
    }

    default:
      return fail('Type de bloc inconnu.');
  }
}

export interface RunOptions {
  onProgress?: (execution: WorkflowExecution) => void;
}

export async function runBlueprint(
  blueprint: WorkflowBlueprint,
  options: RunOptions = {},
): Promise<WorkflowExecution> {
  const execution: WorkflowExecution = {
    id: uid('run'),
    blueprintId: blueprint.id,
    userId: blueprint.userId,
    name: blueprint.name,
    symbol: blueprint.blocks.find((b) => blockNeedsSymbol(b.kind))?.config.symbol || 'MULTI',
    timeframe: blueprint.blocks.find((b) => blockNeedsSymbol(b.kind))?.config.timeframe || '—',
    status: 'running',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: blueprint.blocks.map((block) => ({
      blockId: block.id,
      kind: block.kind,
      title: block.title,
      status: 'idle' as BlockStatus,
    })),
    resumed: false,
  };
  saveExecution(execution);
  options.onProgress?.({ ...execution });

  try {
    for (let index = 0; index < blueprint.blocks.length; index += 1) {
      const block = blueprint.blocks[index];
      const run = execution.blocks[index];
      execution.status = 'running';
      run.status = 'running';
      run.startedAt = Date.now();
      saveExecution(execution);
      options.onProgress?.({ ...execution, blocks: [...execution.blocks] });

      const context = buildContext(execution.blocks.slice(0, index));
      try {
        const result = await runBlock(block, context);
        run.status = 'success';
        run.summary = result.summary;
        run.output = result.output;
        run.endedAt = Date.now();
      } catch (error: any) {
        run.status = 'error';
        run.error = error?.message || 'Ce bloc a échoué.';
        run.endedAt = Date.now();
        execution.status = 'error';
        execution.error = `Bloc « ${block.title} » : ${run.error}`;
        saveExecution(execution);
        options.onProgress?.({ ...execution, blocks: [...execution.blocks] });
        return execution;
      }
      saveExecution(execution);
      options.onProgress?.({ ...execution, blocks: [...execution.blocks] });
    }
    execution.status = 'success';
    execution.updatedAt = Date.now();
    saveExecution(execution);
    options.onProgress?.(execution);
    return execution;
  } catch (error: any) {
    execution.status = 'error';
    execution.error = error?.message || 'L’exécution a échoué.';
    saveExecution(execution);
    return execution;
  }
}

/**
 * Resume an interrupted execution: successful blocks are reused verbatim,
 * only the first failed/pending block and the following ones are executed.
 */
export async function resumeExecution(
  blueprint: WorkflowBlueprint,
  execution: WorkflowExecution,
  onProgress?: (execution: WorkflowExecution) => void,
): Promise<WorkflowExecution> {
  const sameShape =
    blueprint.blocks.length === execution.blocks.length &&
    blueprint.blocks.every((block, index) => block.id === execution.blocks[index]?.blockId);
  if (!sameShape) {
    throw new Error('La définition du workflow a changé : relancez une exécution complète.');
  }
  const start = nextPendingIndex(execution.blocks);
  if (start < 0) return execution;

  execution.blocks = execution.blocks.map((run, index) =>
    index < start ? run : { ...run, status: 'idle', error: undefined, startedAt: undefined, endedAt: undefined, summary: undefined, output: undefined },
  );
  execution.status = 'running';
  execution.error = undefined;
  execution.resumed = true;
  saveExecution(execution);
  onProgress?.({ ...execution, blocks: [...execution.blocks] });

  for (let index = start; index < blueprint.blocks.length; index += 1) {
    const block = blueprint.blocks[index];
    const run = execution.blocks[index];
    run.status = 'running';
    run.startedAt = Date.now();
    saveExecution(execution);
    onProgress?.({ ...execution, blocks: [...execution.blocks] });
    const context = buildContext(execution.blocks.slice(0, index));
    try {
      const result = await runBlock(block, context);
      run.status = 'success';
      run.summary = result.summary;
      run.output = result.output;
      run.endedAt = Date.now();
    } catch (error: any) {
      run.status = 'error';
      run.error = error?.message || 'Ce bloc a échoué.';
      run.endedAt = Date.now();
      execution.status = 'error';
      execution.error = `Bloc « ${block.title} » : ${run.error}`;
      saveExecution(execution);
      onProgress?.({ ...execution, blocks: [...execution.blocks] });
      return execution;
    }
    saveExecution(execution);
    onProgress?.({ ...execution, blocks: [...execution.blocks] });
  }
  execution.status = 'success';
  saveExecution(execution);
  onProgress?.(execution);
  return execution;
}

export function exportExecution(execution: WorkflowExecution): string {
  return JSON.stringify(
    {
      workflow: execution.name,
      status: execution.status,
      createdAt: new Date(execution.createdAt).toISOString(),
      updatedAt: new Date(execution.updatedAt).toISOString(),
      error: execution.error,
      blocks: execution.blocks.map((block) => ({
        title: block.title,
        kind: block.kind,
        status: block.status,
        summary: block.summary,
        error: block.error,
        output: block.output,
      })),
    },
    null,
    2,
  );
}
