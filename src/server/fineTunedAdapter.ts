/**
 * Local fine-tuned adapter runtime.
 *
 * This module talks to an OpenAI-compatible server that serves a LoRA/QLoRA
 * adapter produced by the reproducible pipeline in `finetune/` (llama.cpp
 * `llama-server --lora`, vLLM, etc.). It never pretends that a hosted model is
 * a local adapter, never invents an adapter id, and never overrides the
 * deterministic risk veto.
 */
import { fetchWithRetry, type RetryOptions } from './providerRetry.ts';

export interface FineTunedConfig {
  /** OpenAI-compatible base URL, e.g. http://127.0.0.1:8080/v1 */
  baseUrl: string;
  /** Model alias exposed by the local server. */
  modelId: string;
  /** Exact adapter artefact id, e.g. jyntra-risk-llama32-1b-lora-v1. */
  adapterId: string;
  /** Base checkpoint the adapter was trained on. */
  baseModel: string;
  apiKey?: string;
  timeoutMs?: number;
  retry?: RetryOptions;
}

export type FineTunedStatusReason =
  | 'READY'
  | 'FINETUNED_NOT_CONFIGURED'
  | 'FINETUNED_ADAPTER_MISSING'
  | 'FINETUNED_BASE_URL_INVALID';

export interface FineTunedStatus {
  configured: boolean;
  reason: FineTunedStatusReason;
  provider: 'local-finetuned' | 'none';
  adapterId: string | null;
  baseModel: string | null;
  /** Host only: never expose credentials or a full URL. */
  endpointHost: string | null;
}

export interface FineTunedRiskInput {
  symbol: string;
  timeframe?: string;
  verdict: 'BUY' | 'SELL' | 'NO_TRADE';
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number;
  riskRewardRatio?: number;
  riskArgument?: string;
}

export type FineTunedStance = 'APPROVED' | 'CAUTION' | 'REJECTED';

export interface FineTunedRiskOutput {
  stance: FineTunedStance;
  riskRewardRatio: number | null;
  primaryRisk: string;
  invalidation: string;
  explanation: string;
}

export interface FineTunedResult {
  attempted: boolean;
  success: boolean;
  configured: boolean;
  provider: 'local-finetuned' | 'none';
  adapterId?: string;
  baseModel?: string;
  model?: string;
  output?: FineTunedRiskOutput;
  valid?: boolean;
  validationErrors?: string[];
  latencyMs: number;
  calls: number;
  reason?: string;
  errorCategory?: 'configuration' | 'network' | 'quota' | 'provider' | 'timeout';
}

const STANCES: readonly FineTunedStance[] = ['APPROVED', 'CAUTION', 'REJECTED'];
const MAX_FIELD = 600;

function endpointHost(baseUrl: string): string | null {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.host;
  } catch {
    return null;
  }
}

export function parseFineTunedConfig(env: NodeJS.ProcessEnv): FineTunedConfig | undefined {
  const baseUrl = (env.JYNTRA_FINETUNED_BASE_URL || env.FINETUNED_BASE_URL || '').trim();
  const modelId = (env.JYNTRA_FINETUNED_MODEL_ID || '').trim();
  const adapterId = (env.JYNTRA_FINETUNED_ADAPTER_ID || '').trim();
  if (!baseUrl && !modelId && !adapterId) return undefined;

  return {
    baseUrl,
    modelId,
    adapterId,
    baseModel: (env.JYNTRA_FINETUNED_BASE_MODEL || '').trim(),
    apiKey: (env.JYNTRA_FINETUNED_API_KEY || '').trim() || undefined,
    timeoutMs: Number(env.JYNTRA_FINETUNED_TIMEOUT_MS) || 20_000,
  };
}

export function fineTunedStatus(config?: FineTunedConfig): FineTunedStatus {
  if (!config) {
    return {
      configured: false,
      reason: 'FINETUNED_NOT_CONFIGURED',
      provider: 'none',
      adapterId: null,
      baseModel: null,
      endpointHost: null,
    };
  }
  const host = endpointHost(config.baseUrl);
  if (!host) {
    return {
      configured: false,
      reason: 'FINETUNED_BASE_URL_INVALID',
      provider: 'none',
      adapterId: config.adapterId || null,
      baseModel: config.baseModel || null,
      endpointHost: null,
    };
  }
  if (!config.adapterId || !config.baseModel || !config.modelId) {
    return {
      configured: false,
      reason: 'FINETUNED_ADAPTER_MISSING',
      provider: 'none',
      adapterId: config.adapterId || null,
      baseModel: config.baseModel || null,
      endpointHost: host,
    };
  }
  return {
    configured: true,
    reason: 'READY',
    provider: 'local-finetuned',
    adapterId: config.adapterId,
    baseModel: config.baseModel,
    endpointHost: host,
  };
}

const systemPrompt = [
  'Tu es le module de risque d un adaptateur JYNTRA AI, entraine sur des explanations financieres structurees.',
  'Tu ne inventes aucune donnee de marche. Tu reponds UNIQUEMENT avec un objet JSON valide, sans texte autour.',
  'Schema exact:',
  '{"stance":"APPROVED|CAUTION|REJECTED","riskRewardRatio":number|null,"primaryRisk":string,"invalidation":string,"explanation":string}',
  'Regles: si entry/stopLoss/takeProfit1 manquent, stance=CAUTION et riskRewardRatio=null.',
  'Si le Risk/Reward calcule est inferieur a 1.5, stance=REJECTED.',
  'explanation doit rester factuelle, concise (max 400 caracteres), et ne doit jamais promettre un gain.',
].join('\n');

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

function textField(value: unknown, max = MAX_FIELD): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';
}

function computeRR(input: FineTunedRiskInput): number | null {
  const { entry, stopLoss, takeProfit1 } = input;
  if (![entry, stopLoss, takeProfit1].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const risk = Math.abs((entry as number) - (stopLoss as number));
  const reward = Math.abs((takeProfit1 as number) - (entry as number));
  if (risk <= 0) return null;
  return Math.round((reward / risk) * 100) / 100;
}

export function validateFineTunedOutput(raw: any): { valid: boolean; errors: string[]; output?: FineTunedRiskOutput } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Response is not a JSON object.'] };
  }
  const errors: string[] = [];
  const stance = raw.stance;
  if (!STANCES.includes(stance)) errors.push(`Invalid stance: ${String(stance)}`);
  const primaryRisk = textField(raw.primaryRisk, 400);
  const invalidation = textField(raw.invalidation, 400);
  const explanation = textField(raw.explanation);
  if (!primaryRisk) errors.push('Missing primaryRisk.');
  if (!invalidation) errors.push('Missing invalidation.');
  if (!explanation) errors.push('Missing explanation.');
  const rr = raw.riskRewardRatio;
  if (rr !== null && (typeof rr !== 'number' || !Number.isFinite(rr) || rr < 0)) {
    errors.push('riskRewardRatio must be a non-negative number or null.');
  }
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    output: {
      stance,
      riskRewardRatio: rr === null ? null : rr,
      primaryRisk,
      invalidation,
      explanation,
    },
  };
}

export async function explainRiskWithAdapter(
  config: FineTunedConfig | undefined,
  input: FineTunedRiskInput,
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<FineTunedResult> {
  const started = Date.now();
  const status = fineTunedStatus(config);
  if (!config || !status.configured) {
    return {
      attempted: false,
      success: false,
      configured: false,
      provider: 'none',
      adapterId: status.adapterId ?? undefined,
      baseModel: status.baseModel ?? undefined,
      latencyMs: 0,
      calls: 0,
      reason: status.reason,
      errorCategory: 'configuration',
    };
  }

  const computedRR = computeRR(input);
  const userPayload = {
    symbol: input.symbol,
    timeframe: input.timeframe ?? null,
    verdict: input.verdict,
    entry: input.entry ?? null,
    stopLoss: input.stopLoss ?? null,
    takeProfit1: input.takeProfit1 ?? null,
    computedRiskRewardRatio: computedRR,
    riskAnalystArgument: textField(input.riskArgument, 1200) || null,
  };

  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const outcome = await fetchWithRetry(
    deps.fetchImpl ?? fetch,
    url,
    () => ({
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
        temperature: 0,
        max_tokens: 450,
        stream: false,
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? 20_000),
    }),
    { maxAttempts: 1, ...(config.retry ?? {}) },
  );

  if (!outcome.ok) {
    const message = String((outcome.error as any)?.message ?? '');
    return {
      attempted: true,
      success: false,
      configured: true,
      provider: 'local-finetuned',
      adapterId: config.adapterId,
      baseModel: config.baseModel,
      model: config.modelId,
      latencyMs: Date.now() - started,
      calls: outcome.attempts,
      reason: /abort|timeout/i.test(message) ? 'FINETUNED_TIMEOUT' : 'FINETUNED_NETWORK',
      errorCategory: /abort|timeout/i.test(message) ? 'timeout' : 'network',
    };
  }

  const response = outcome.response;
  if (!response.ok) {
    return {
      attempted: true,
      success: false,
      configured: true,
      provider: 'local-finetuned',
      adapterId: config.adapterId,
      baseModel: config.baseModel,
      model: config.modelId,
      latencyMs: Date.now() - started,
      calls: outcome.attempts,
      reason: response.status === 429 ? 'FINETUNED_QUOTA' : 'FINETUNED_FAILED',
      errorCategory: response.status === 429 ? 'quota' : 'provider',
    };
  }

  let text = '';
  try {
    const json: any = await response.json();
    text = json.choices?.[0]?.message?.content ?? '';
  } catch {
    return {
      attempted: true,
      success: false,
      configured: true,
      provider: 'local-finetuned',
      adapterId: config.adapterId,
      baseModel: config.baseModel,
      model: config.modelId,
      latencyMs: Date.now() - started,
      calls: outcome.attempts,
      reason: 'FINETUNED_EMPTY',
      errorCategory: 'provider',
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return {
      attempted: true,
      success: false,
      configured: true,
      provider: 'local-finetuned',
      adapterId: config.adapterId,
      baseModel: config.baseModel,
      model: config.modelId,
      latencyMs: Date.now() - started,
      calls: outcome.attempts,
      reason: 'FINETUNED_INVALID_JSON',
      errorCategory: 'provider',
    };
  }

  const validation = validateFineTunedOutput(parsed);
  const validationErrors = [...validation.errors];
  if (validation.output && computedRR !== null) {
    const reported = validation.output.riskRewardRatio;
    if (reported !== null && Math.abs(reported - computedRR) > 0.05) {
      validationErrors.push(`Risk/Reward mismatch: model=${reported}, deterministic=${computedRR}.`);
    }
  }

  return {
    attempted: true,
    success: true,
    configured: true,
    provider: 'local-finetuned',
    adapterId: config.adapterId,
    baseModel: config.baseModel,
    model: config.modelId,
    output: validation.output,
    valid: validation.valid && validationErrors.length === 0,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    latencyMs: Date.now() - started,
    calls: outcome.attempts,
  };
}
