/**
 * JYNTRACK — quantitative laboratory (server-side only).
 *
 * This module is deliberately independent from the trading-analysis modules:
 * it never produces a signal, a trade instruction or a price forecast. It
 * builds reproducible probabilistic scenarios from real candles with an
 * empirical block bootstrap, measures historical event reactions and validates
 * strategies out of sample.
 *
 * Data sources (no key, no paid tier):
 *  - Binance public REST klines: crypto spot + PAXG/USDT (gold proxy)
 *  - Frankfurter (ECB reference rates): FX daily history
 *  - Yahoo Finance chart endpoint: equity index daily history
 *
 * No simulated price is ever presented as an observed price. Every response
 * carries its source, freshness, sample size and limitations.
 */

import { runBacktest } from '../src/utils/backtestEngine.ts';
import type { Candle as BacktestCandle } from '../src/utils/backtestEngine.ts';
import type {
  JyntrackAssumptions,
  JyntrackBand,
  JyntrackEventEpisode,
  JyntrackEventHorizon,
  JyntrackEventStudy,
  JyntrackInitialConditions,
  JyntrackRealityCheck,
  JyntrackRealityRequest,
  JyntrackScenario,
  JyntrackScenarioId,
  JyntrackSimulation,
  JyntrackStrategyCandidate,
  JyntrackStrategyLab,
  JyntrackStrategyMetrics,
  JyntrackTerminal,
} from '../src/types/jyntrack.ts';

export interface JyntrackCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface JyntrackMarketData {
  symbol: string;
  interval: string;
  effectiveInterval: string;
  source: string;
  sourceName: string;
  freshness: string;
  candles: JyntrackCandle[];
  warnings: string[];
}

const INTERVALS = ['15m', '1h', '4h', '1d'] as const;
type Interval = (typeof INTERVALS)[number];

const INTERVAL_MS: Record<string, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

const ANNUAL_BARS: Record<string, number> = {
  '15m': 35040,
  '1h': 8760,
  '4h': 2190,
  '1d': 365,
};

const FOREX: Record<string, { base: string; target: string }> = {
  EURUSD: { base: 'EUR', target: 'USD' },
  GBPUSD: { base: 'GBP', target: 'USD' },
  USDJPY: { base: 'USD', target: 'JPY' },
  AUDUSD: { base: 'AUD', target: 'USD' },
  EURGBP: { base: 'EUR', target: 'GBP' },
  USDCHF: { base: 'USD', target: 'CHF' },
  USDCAD: { base: 'USD', target: 'CAD' },
  EURJPY: { base: 'EUR', target: 'JPY' },
};

const INDICES: Record<string, { yahoo: string; name: string }> = {
  SPX: { yahoo: '%5EGSPC', name: 'S&P 500' },
  DJI: { yahoo: '%5EDJI', name: 'Dow Jones Industrial' },
  NDQ: { yahoo: '%5EIXIC', name: 'Nasdaq Composite' },
  STX50: { yahoo: '%5ESTOXX50E', name: 'Euro Stoxx 50' },
  UKX: { yahoo: '%5EFTSE', name: 'FTSE 100' },
  NKX: { yahoo: '%5EN225', name: 'Nikkei 225' },
};

const cache = new Map<string, { at: number; data: JyntrackMarketData }>();
const CACHE_TTL_MS = 45_000;

export class JyntrackDataError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function round(value: number, digits = 6): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * Math.min(1, Math.max(0, q));
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const weight = pos - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function logReturns(candles: JyntrackCandle[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]?.close;
    const current = candles[i]?.close;
    if (!Number.isFinite(prev) || !Number.isFinite(current) || prev <= 0 || current <= 0) continue;
    out.push(Math.log(current / prev));
  }
  return out;
}

function pearson(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length < 3) return 0;
  const ma = mean(a.slice(0, length));
  const mb = mean(b.slice(0, length));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < length; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da <= 0 || db <= 0) return 0;
  return num / Math.sqrt(da * db);
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG so any scenario can be replayed exactly. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normaliseSymbol(input: unknown): string {
  const raw = String(input || 'BTCUSDT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  return raw || 'BTCUSDT';
}

function normaliseInterval(input: unknown): Interval {
  const raw = String(input || '1h').trim();
  return (INTERVALS as readonly string[]).includes(raw) ? (raw as Interval) : '1h';
}

function intervalMs(interval: string): number {
  return INTERVAL_MS[interval] || INTERVAL_MS['1h'];
}

function dateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function binanceSymbolFor(symbol: string): string {
  if (symbol === 'XAUUSD' || symbol === 'GOLD' || symbol === 'XAU') return 'PAXGUSDT';
  return symbol;
}

async function fetchBinance(symbol: string, interval: Interval, limit: number): Promise<JyntrackCandle[]> {
  const pair = binanceSymbolFor(symbol);
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'JYNTRA-AI/1.0 (+jyntrack)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new JyntrackDataError('MARKET_SOURCE_UNAVAILABLE', `market-source-${response.status}`);
  const raw = (await response.json()) as unknown;
  if (!Array.isArray(raw)) throw new JyntrackDataError('MARKET_SOURCE_INVALID', 'market-source-invalid');
  return raw
    .map((row) => {
      const k = row as any[];
      return {
        timestamp: Number(k[0]),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      };
    })
    .filter((c) => Number.isFinite(c.timestamp) && Number.isFinite(c.close) && c.close > 0);
}

async function fetchFrankfurter(symbol: string): Promise<JyntrackCandle[]> {
  const pair = FOREX[symbol];
  if (!pair) throw new JyntrackDataError('UNSUPPORTED_SYMBOL', 'unsupported-symbol');
  const from = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  const url = `https://api.frankfurter.app/${from}..?from=${pair.base}&to=${pair.target}`;
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
    headers: { 'User-Agent': 'JYNTRA-AI/1.0 (+jyntrack)' },
  });
  if (!response.ok) throw new JyntrackDataError('MARKET_SOURCE_UNAVAILABLE', `market-source-${response.status}`);
  const payload: any = await response.json();
  const dates = Object.keys(payload?.rates || {}).sort();
  const candles: JyntrackCandle[] = [];
  let previous: number | null = null;
  for (const date of dates) {
    const close = Number(payload.rates[date]?.[pair.target]);
    if (!Number.isFinite(close) || close <= 0) continue;
    const open = previous ?? close;
    candles.push({
      timestamp: new Date(`${date}T00:00:00Z`).getTime(),
      open: round(open, 6),
      high: round(Math.max(open, close), 6),
      low: round(Math.min(open, close), 6),
      close: round(close, 6),
      volume: null,
    });
    previous = close;
  }
  return candles;
}

async function fetchYahoo(symbol: string): Promise<JyntrackCandle[]> {
  const index = INDICES[symbol];
  if (!index) throw new JyntrackDataError('UNSUPPORTED_SYMBOL', 'unsupported-symbol');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index.yahoo}?interval=1d&range=1y`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 JYNTRA-AI/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new JyntrackDataError('MARKET_SOURCE_UNAVAILABLE', `market-source-${response.status}`);
  const payload: any = await response.json();
  const result = payload?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0] || {};
  return timestamps
    .map((t, i) => ({
      timestamp: t * 1000,
      open: Number(quote.open?.[i]),
      high: Number(quote.high?.[i]),
      low: Number(quote.low?.[i]),
      close: Number(quote.close?.[i]),
      volume: Number.isFinite(Number(quote.volume?.[i])) ? Number(quote.volume?.[i]) : null,
    }))
    .filter((c) => Number.isFinite(c.timestamp) && Number.isFinite(c.close) && c.close > 0);
}

/**
 * Fetches real candles for a JYNTRACK instrument. FX and indices only expose a
 * daily official history: when the caller asks for an intraday interval we
 * return the effective daily series and state it explicitly instead of
 * inventing intraday bars.
 */
export async function fetchJyntrackCandles(
  inputSymbol: string,
  inputInterval: string,
  limit = 300,
): Promise<JyntrackMarketData> {
  const symbol = normaliseSymbol(inputSymbol);
  const requestedInterval = normaliseInterval(inputInterval);
  const safeLimit = Math.max(60, Math.min(300, Math.floor(limit) || 300));
  const cacheKey = `${symbol}|${requestedInterval}|${safeLimit}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.data, candles: hit.data.candles.slice() };
  }

  const warnings: string[] = [];
  let candles: JyntrackCandle[] = [];
  let effectiveInterval: string = requestedInterval;
  let source = 'BINANCE';
  let sourceName = 'Binance — cotations publiques';
  let freshness = 'REAL_TIME';

  if (FOREX[symbol]) {
    candles = await fetchFrankfurter(symbol);
    effectiveInterval = '1d';
    source = 'ECB_FRANKFURTER';
    sourceName = 'Taux de référence BCE — Frankfurter';
    freshness = 'REAL_DAILY';
    if (requestedInterval !== '1d') warnings.push('DAILY_ONLY');
  } else if (INDICES[symbol]) {
    candles = await fetchYahoo(symbol);
    effectiveInterval = '1d';
    source = 'YAHOO_FINANCE';
    sourceName = 'Yahoo Finance — historique journalier';
    freshness = 'REAL_DAILY';
    if (requestedInterval !== '1d') warnings.push('DAILY_ONLY');
  } else {
    candles = await fetchBinance(symbol, requestedInterval, safeLimit);
    effectiveInterval = requestedInterval;
    source = 'BINANCE';
    sourceName = symbol === 'XAUUSD' ? 'Binance — PAXG/USDT (or tokenisé)' : 'Binance — cotations publiques';
    freshness = 'REAL_TIME';
    if (symbol === 'XAUUSD') warnings.push('GOLD_PROXY');
  }

  candles = candles
    .filter((c) => Number.isFinite(c.timestamp) && Number.isFinite(c.close) && c.close > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-safeLimit);

  if (candles.length < 40) {
    throw new JyntrackDataError('NOT_ENOUGH_DATA', 'not-enough-data');
  }

  const last = candles[candles.length - 1];
  if (Date.now() - last.timestamp > intervalMs(effectiveInterval) * 3.5) {
    warnings.push('STALE_DATA');
  }

  const data: JyntrackMarketData = {
    symbol,
    interval: requestedInterval,
    effectiveInterval,
    source,
    sourceName,
    freshness,
    candles,
    warnings,
  };
  cache.set(cacheKey, { at: Date.now(), data });
  if (cache.size > 60) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return { ...data, candles: data.candles.slice() };
}

function trendSlope(candles: JyntrackCandle[]): number {
  const window = candles.slice(-60);
  if (window.length < 10) return 0;
  const xs = window.map((_, i) => i);
  const ys = window.map((c) => Math.log(c.close));
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < window.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den > 0 ? num / den : 0;
}

function atrPercent(candles: JyntrackCandle[], period = 14): number {
  if (candles.length < 2) return 0;
  const ranges: number[] = [];
  for (let i = Math.max(1, candles.length - period); i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    if (Number.isFinite(tr) && tr > 0) ranges.push(tr);
  }
  const close = candles[candles.length - 1].close;
  return close > 0 && ranges.length ? (mean(ranges) / close) * 100 : 0;
}

function initialConditions(data: JyntrackMarketData, mu: number, sigma: number): JyntrackInitialConditions {
  const candles = data.candles;
  const last = candles[candles.length - 1];
  const barsPerYear = ANNUAL_BARS[data.effectiveInterval] || ANNUAL_BARS['1h'];
  const momentumBase = candles[Math.max(0, candles.length - 21)].close;
  const slope = trendSlope(candles);
  return {
    lastPrice: round(last.close, 8),
    asOf: last.timestamp,
    bars: candles.length,
    firstTimestamp: candles[0].timestamp,
    lastTimestamp: last.timestamp,
    perBarVolPct: round(sigma * 100, 4),
    annualizedVolPct: round(sigma * Math.sqrt(barsPerYear) * 100, 2),
    perBarDriftPct: round(mu * 100, 4),
    annualizedDriftPct: round(mu * barsPerYear * 100, 2),
    trendSlopePctPerBar: round((Math.exp(slope) - 1) * 100, 4),
    momentum20Pct: round(((last.close / momentumBase) - 1) * 100, 2),
    atr14Pct: round(atrPercent(candles), 2),
    source: data.source,
    sourceName: data.sourceName,
    freshness: data.freshness,
  };
}

function bootstrapIndices(length: number, horizon: number, blockSize: number, rng: () => number): number[] {
  const indices: number[] = [];
  while (indices.length < horizon) {
    let start = Math.floor(rng() * length);
    const block = Math.min(blockSize, horizon - indices.length);
    for (let k = 0; k < block; k++) {
      indices.push((start + k) % length);
    }
  }
  return indices;
}

function clampReturn(value: number): number {
  // Numerical guard only: keeps a pathological bootstrap draw finite. The
  // guard is documented in the response assumptions, never hidden.
  return Math.max(-1, Math.min(1, value));
}

function maxDrawdown(path: number[]): number {
  let peak = path[0] || 1;
  let worst = 0;
  for (const price of path) {
    if (price > peak) peak = price;
    if (peak > 0) {
      const drawdown = ((peak - price) / peak) * 100;
      if (drawdown > worst) worst = drawdown;
    }
  }
  return worst;
}

function bracketFor(price: number, band: JyntrackBand): JyntrackRealityCheck['bracket'] {
  if (!Number.isFinite(price)) return 'NO_DATA';
  if (price < band.p05) return 'BELOW_P05';
  if (price < band.p25) return 'P05_P25';
  if (price < band.p50) return 'P25_P50';
  if (price <= band.p75) return 'P50_P75';
  if (price <= band.p95) return 'P75_P95';
  return 'ABOVE_P95';
}

interface ScenarioContext {
  id: JyntrackScenarioId;
  returns: number[];
  mu: number;
  sigma: number;
  muRecent: number;
  horizon: number;
  paths: number;
  blockSize: number;
  basePrice: number;
  atr: number;
  driftAdjustment: number;
  seed: number;
  targetTimestamps: number[];
  eventWindows: number[][];
  eventDates: string[];
  alignedTargetReturns: number[];
  alignedBenchmarkReturns: number[];
  benchmarkSymbol: string | null;
}

function buildBands(paths: number[][], timestamps: number[]): JyntrackBand[] {
  const horizon = paths[0].length - 1;
  const bands: JyntrackBand[] = [];
  for (let step = 0; step <= horizon; step++) {
    const values = paths.map((p) => p[step]).sort((a, b) => a - b);
    bands.push({
      step,
      timestamp: timestamps[Math.min(step, timestamps.length - 1)] || timestamps[timestamps.length - 1] || Date.now(),
      p05: round(quantile(values, 0.05), 8),
      p25: round(quantile(values, 0.25), 8),
      p50: round(quantile(values, 0.5), 8),
      p75: round(quantile(values, 0.75), 8),
      p95: round(quantile(values, 0.95), 8),
      mean: round(mean(values), 8),
    });
  }
  return bands;
}

function terminalStats(
  paths: number[][],
  basePrice: number,
  invalidationLow: number | null,
  invalidationHigh: number | null,
): JyntrackTerminal {
  const terminal = paths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
  const returns = terminal.map((p) => (p / basePrice - 1) * 100);
  const sortedReturns = returns.slice().sort((a, b) => a - b);
  const p05 = quantile(terminal, 0.05);
  const p25 = quantile(terminal, 0.25);
  const p50 = quantile(terminal, 0.5);
  const p75 = quantile(terminal, 0.75);
  const p95 = quantile(terminal, 0.95);
  const worstCount = Math.max(1, Math.floor(returns.length * 0.05));
  const worst = sortedReturns.slice(0, worstCount);
  const expectedDrawdown = mean(paths.map((path) => maxDrawdown(path)));
  let touch = 0;
  for (const path of paths) {
    const touchedLow = invalidationLow != null && path.some((p) => p <= invalidationLow);
    const touchedHigh = invalidationHigh != null && path.some((p) => p >= invalidationHigh);
    if (touchedLow || touchedHigh) touch += 1;
  }
  return {
    p05: round(p05, 8),
    p25: round(p25, 8),
    p50: round(p50, 8),
    p75: round(p75, 8),
    p95: round(p95, 8),
    mean: round(mean(terminal), 8),
    medianReturnPct: round((p50 / basePrice - 1) * 100, 3),
    p05ReturnPct: round((p05 / basePrice - 1) * 100, 3),
    p95ReturnPct: round((p95 / basePrice - 1) * 100, 3),
    probUpPct: round((returns.filter((r) => r > 0).length / returns.length) * 100, 1),
    probGain1Pct: round((returns.filter((r) => r >= 1).length / returns.length) * 100, 1),
    probLoss1Pct: round((returns.filter((r) => r <= -1).length / returns.length) * 100, 1),
    var95Pct: round(Math.max(0, -quantile(sortedReturns, 0.05)), 3),
    cvar95Pct: round(Math.max(0, -mean(worst)), 3),
    expectedMaxDrawdownPct: round(expectedDrawdown, 3),
    probTouchInvalidationPct: invalidationLow == null && invalidationHigh == null ? null : round((touch / paths.length) * 100, 1),
  };
}

function scenarioPrices(ctx: ScenarioContext): number[][] {
  const {
    id,
    returns,
    sigma,
    muRecent,
    horizon,
    paths,
    blockSize,
    basePrice,
    driftAdjustment,
    seed,
    eventWindows,
  } = ctx;

  const rng = mulberry32(seed ^ hashString(id));
  const tailReturns = returns.filter((r) => Math.abs(r) >= Math.max(1e-9, sigma * 2));
  const tails = tailReturns.length ? tailReturns : returns.slice().sort((a, b) => Math.abs(b) - Math.abs(a)).slice(0, 5);
  // Regime scenarios describe the continuation, the flip, the compression or
  // the shock of the *current* regime, so they resample the recent history.
  // The correlation-break world keeps the full-sample marginals: only the
  // co-movement with the benchmark is destroyed, not the distribution.
  const regimeReturns = returns.slice(-Math.min(80, returns.length));
  const regimeScenario = id === 'continuation' || id === 'reversal' || id === 'consolidation' || id === 'vol_shock';
  const sourceReturns = regimeScenario ? regimeReturns : returns;
  // Empirical mean of the distribution actually resampled. The regime worlds
  // must be expressed around the recent mean, not the full-sample mean.
  const muSource = sourceReturns.reduce((sum, value) => sum + value, 0) / Math.max(1, sourceReturns.length);
  const output: number[][] = [];

  for (let pathIndex = 0; pathIndex < paths; pathIndex++) {
    let sampled: number[];
    if (id === 'event_reaction') {
      sampled = [];
      while (sampled.length < horizon) {
        const window = eventWindows[Math.floor(rng() * eventWindows.length)] || [];
        if (!window.length) break;
        sampled.push(...window.slice(0, horizon - sampled.length));
      }
      while (sampled.length < horizon) sampled.push(returns[Math.floor(rng() * returns.length)] || 0);
    } else {
      const indices = bootstrapIndices(sourceReturns.length, horizon, blockSize, rng);
      sampled = indices.map((i) => sourceReturns[i]);
    }

    for (let step = 0; step < horizon; step++) {
      let r = sampled[step] || 0;
      // Each transformation keeps the sampled shock (r - muSource) traceable to
      // a real observation: reversal mirrors it and flips the recent drift,
      // consolidation compresses it, vol_shock amplifies it.
      if (id === 'reversal') {
        r = -r + muSource - muRecent + driftAdjustment;
      } else if (id === 'consolidation') {
        r = (r - muSource) * 0.35 + driftAdjustment;
      } else if (id === 'vol_shock') {
        r = (r - muSource) * 2.2 + muSource * 0.2 + driftAdjustment;
      } else {
        r = r + driftAdjustment;
      }
      sampled[step] = r;
    }

    if (id === 'vol_shock' && tails.length) {
      const shockStep = Math.floor(horizon * 0.15 + rng() * Math.max(1, horizon * 0.35));
      const tail = tails[Math.floor(rng() * tails.length)] || 0;
      sampled[Math.min(horizon - 1, shockStep)] += tail * 1.2;
    }

    const prices = [basePrice];
    let price = basePrice;
    for (let step = 0; step < horizon; step++) {
      price = price * Math.exp(clampReturn(sampled[step]));
      if (!Number.isFinite(price) || price <= 0) price = basePrice;
      prices.push(price);
    }
    output.push(prices);
  }
  return output;
}

function eventWindowsFromCandles(candles: JyntrackCandle[], sigma: number, mu: number, horizon: number): { windows: number[][]; dates: string[] } {
  const returns = logReturns(candles);
  const shocks: number[] = [];
  for (let i = 0; i < returns.length; i++) {
    if (sigma > 0 && Math.abs((returns[i] - mu) / sigma) >= 2) {
      if (!shocks.length || i - shocks[shocks.length - 1] >= 5) shocks.push(i);
    }
  }
  const windows: number[][] = [];
  const dates: string[] = [];
  const windowSize = Math.min(10, Math.max(3, horizon));
  for (const index of shocks) {
    if (index + windowSize >= returns.length) continue;
    windows.push(returns.slice(index + 1, index + 1 + windowSize));
    dates.push(new Date(candles[index + 1].timestamp).toISOString());
  }
  return { windows, dates };
}

function simulateScenario(ctx: ScenarioContext): JyntrackScenario {
  if (ctx.id === 'event_reaction' && ctx.eventWindows.length < 3) {
    return {
      id: ctx.id,
      available: false,
      reason: 'EVENT_SAMPLE_TOO_SMALL',
      sampleSize: 0,
      eventCount: ctx.eventWindows.length,
      terminal: null,
      bands: [],
      invalidationLow: null,
      invalidationHigh: null,
    };
  }
  if (ctx.id === 'correlation_break' && ctx.alignedTargetReturns.length < 30) {
    return {
      id: ctx.id,
      available: false,
      reason: 'BENCHMARK_UNAVAILABLE',
      sampleSize: 0,
      terminal: null,
      bands: [],
      invalidationLow: null,
      invalidationHigh: null,
    };
  }

  const atrFraction = Math.max(0.004, ctx.atr / 100);
  let invalidationLow: number | null = null;
  let invalidationHigh: number | null = null;
  if (ctx.id === 'reversal') {
    // A reversal is invalidated when the recent trend simply keeps going:
    // a new high for an up-move, a new low for a down-move.
    if (ctx.muRecent >= 0) {
      invalidationHigh = round(ctx.basePrice * (1 + 1.5 * atrFraction), 8);
    } else {
      invalidationLow = round(ctx.basePrice * (1 - 1.5 * atrFraction), 8);
    }
  } else if (ctx.id === 'consolidation') {
    invalidationLow = round(ctx.basePrice * (1 - 1.25 * atrFraction), 8);
    invalidationHigh = round(ctx.basePrice * (1 + 1.25 * atrFraction), 8);
  } else if (ctx.id !== 'vol_shock') {
    invalidationLow = round(ctx.basePrice * (1 - 1.5 * atrFraction), 8);
  }

  const paths = scenarioPrices(ctx);
  const bands = buildBands(paths, ctx.targetTimestamps);
  const terminal = terminalStats(paths, ctx.basePrice, invalidationLow, invalidationHigh);

  let correlation: JyntrackScenario['correlation'];
  if (ctx.id === 'correlation_break' && ctx.benchmarkSymbol) {
    const historical = pearson(ctx.alignedTargetReturns, ctx.alignedBenchmarkReturns);
    // Independent bootstrap on the benchmark marginals: the target scenario
    // keeps its own distribution while the historical co-movement is broken.
    const benchRng = mulberry32(ctx.seed ^ hashString('benchmark'));
    const benchPaths: number[][] = [];
    for (let i = 0; i < Math.min(ctx.paths, 200); i++) {
      const indices = bootstrapIndices(ctx.alignedBenchmarkReturns.length, ctx.horizon, ctx.blockSize, benchRng);
      const benchReturns: number[] = [];
      for (let step = 0; step < ctx.horizon; step++) {
        benchReturns.push(ctx.alignedBenchmarkReturns[indices[step]] || 0);
      }
      benchPaths.push(benchReturns);
    }
    const targetForCorrelation: number[] = [];
    for (let i = 0; i < Math.min(ctx.paths, 200); i++) {
      const indices = bootstrapIndices(ctx.alignedTargetReturns.length, ctx.horizon, ctx.blockSize, mulberry32(ctx.seed ^ hashString('target-corr') ^ i));
      for (let step = 0; step < ctx.horizon; step++) {
        targetForCorrelation.push(ctx.alignedTargetReturns[indices[step]] || 0);
      }
    }
    const benchFlat = benchPaths.flat();
    correlation = {
      benchmarkSymbol: ctx.benchmarkSymbol,
      historical: round(historical, 3),
      simulated: round(pearson(targetForCorrelation, benchFlat), 3),
    };
  }

  return {
    id: ctx.id,
    available: true,
    sampleSize:
      ctx.id === 'event_reaction'
        ? ctx.eventWindows.length
        : ctx.id === 'correlation_break'
          ? ctx.returns.length
          : Math.min(80, ctx.returns.length),
    eventCount: ctx.id === 'event_reaction' ? ctx.eventWindows.length : undefined,
    eventDates: ctx.id === 'event_reaction' ? ctx.eventDates.slice(-12) : undefined,
    terminal,
    bands,
    invalidationLow,
    invalidationHigh,
    correlation,
  };
}

function alignSeries(
  target: JyntrackCandle[],
  benchmark: JyntrackCandle[],
  effectiveInterval: string,
): { targetReturns: number[]; benchmarkReturns: number[] } {
  const useDate = effectiveInterval === '1d';
  const benchmarkMap = new Map<string, number>();
  for (const candle of benchmark) {
    benchmarkMap.set(useDate ? dateKey(candle.timestamp) : String(candle.timestamp), candle.close);
  }
  const targetReturns: number[] = [];
  const benchmarkReturns: number[] = [];
  for (let i = 1; i < target.length; i++) {
    const previousKey = useDate ? dateKey(target[i - 1].timestamp) : String(target[i - 1].timestamp);
    const currentKey = useDate ? dateKey(target[i].timestamp) : String(target[i].timestamp);
    const previousBenchmark = benchmarkMap.get(previousKey);
    const currentBenchmark = benchmarkMap.get(currentKey);
    if (
      Number.isFinite(previousBenchmark) &&
      Number.isFinite(currentBenchmark) &&
      (previousBenchmark as number) > 0 &&
      (currentBenchmark as number) > 0 &&
      target[i - 1].close > 0 &&
      target[i].close > 0
    ) {
      targetReturns.push(Math.log(target[i].close / target[i - 1].close));
      benchmarkReturns.push(Math.log((currentBenchmark as number) / (previousBenchmark as number)));
    }
  }
  return { targetReturns, benchmarkReturns };
}

export async function runJyntrackSimulation(input: {
  symbol?: unknown;
  interval?: unknown;
  horizon?: unknown;
  paths?: unknown;
  benchmark?: unknown;
  driftAdjustmentPct?: unknown;
}): Promise<JyntrackSimulation> {
  const symbol = normaliseSymbol(input.symbol);
  const interval = normaliseInterval(input.interval);
  const horizon = Math.max(6, Math.min(120, Math.floor(Number(input.horizon) || 48)));
  const paths = Math.max(100, Math.min(2000, Math.floor(Number(input.paths) || 600)));
  const benchmarkInput = input.benchmark ? normaliseSymbol(input.benchmark) : null;
  const benchmarkSymbol = benchmarkInput && benchmarkInput !== symbol ? benchmarkInput : null;
  const driftAdjustmentPct = Math.max(-10, Math.min(10, Number(input.driftAdjustmentPct) || 0));

  const data = await fetchJyntrackCandles(symbol, interval, 300);
  const candles = data.candles;
  const returns = logReturns(candles);
  if (returns.length < 40) throw new JyntrackDataError('NOT_ENOUGH_DATA', 'not-enough-data');

  const mu = mean(returns);
  const sigma = stdev(returns);
  const recentWindow = returns.slice(-20);
  const muRecent = mean(recentWindow);
  const blockSize = Math.max(2, Math.round(Math.sqrt(returns.length)));
  const lastCandle = candles[candles.length - 1];
  const basePrice = lastCandle.close;
  const driftAdjustment = driftAdjustmentPct > 0 ? Math.log(1 + driftAdjustmentPct / 100) / horizon : driftAdjustmentPct < 0 ? Math.log(1 + driftAdjustmentPct / 100) / horizon : 0;
  const seed = hashString(`${symbol}|${data.effectiveInterval}|${lastCandle.timestamp}|${horizon}|${paths}`) >>> 0;

  let benchmarkData: JyntrackMarketData | null = null;
  if (benchmarkSymbol) {
    try {
      benchmarkData = await fetchJyntrackCandles(benchmarkSymbol, interval, 300);
    } catch {
      benchmarkData = null;
    }
  }
  const aligned = benchmarkData ? alignSeries(candles, benchmarkData.candles, data.effectiveInterval) : { targetReturns: [], benchmarkReturns: [] };
  const effectiveBenchmark = benchmarkData ? benchmarkSymbol : null;
  const eventStudy = eventWindowsFromCandles(candles, sigma, mu, horizon);

  const timestamps: number[] = [lastCandle.timestamp];
  for (let step = 1; step <= horizon; step++) {
    timestamps.push(lastCandle.timestamp + step * intervalMs(data.effectiveInterval));
  }

  const warnings = new Set<string>(data.warnings);
  if (returns.length < 80) warnings.add('SMALL_SAMPLE');
  if (effectiveBenchmark && aligned.targetReturns.length < 30) warnings.add('BENCHMARK_MISALIGNED');
  if (eventStudy.windows.length < 5) warnings.add('EVENT_SAMPLE_SMALL');
  if (driftAdjustmentPct !== 0) warnings.add('DRIFT_ADJUSTED');

  const atr = atrPercent(candles);
  const contextBase = {
    returns,
    mu,
    sigma,
    muRecent,
    horizon,
    paths,
    blockSize,
    basePrice,
    atr,
    driftAdjustment,
    seed,
    targetTimestamps: timestamps,
    eventWindows: eventStudy.windows,
    eventDates: eventStudy.dates,
    alignedTargetReturns: aligned.targetReturns,
    alignedBenchmarkReturns: aligned.benchmarkReturns,
    benchmarkSymbol: effectiveBenchmark,
  };

  const scenarioIds: JyntrackScenarioId[] = [
    'continuation',
    'reversal',
    'consolidation',
    'vol_shock',
    'correlation_break',
    'event_reaction',
  ];
  const scenarios = scenarioIds.map((id) => simulateScenario({ ...contextBase, id }));

  const assumptions: JyntrackAssumptions = {
    method: 'Bootstrap par blocs sur rendements logarithmiques empiriques',
    blockSize,
    paths,
    horizon,
    seed,
    driftAdjustmentPct,
    confidenceLevel: 0.9,
    limitations: [
      'NO_FUTURE_KNOWLEDGE',
      'REGIME_DEPENDENCE',
      'TAIL_MODEL',
      'DATA_LATENCY',
      'NOT_A_FORECAST',
      'NUMERICAL_GUARD',
    ],
  };

  return {
    success: true,
    symbol,
    benchmarkSymbol: effectiveBenchmark,
    interval,
    effectiveInterval: data.effectiveInterval,
    generatedAt: Date.now(),
    initial: initialConditions(data, mu, sigma),
    assumptions,
    scenarios,
    warnings: Array.from(warnings),
  };
}

function metricsFromResult(result: ReturnType<typeof runBacktest>): JyntrackStrategyMetrics {
  return {
    totalReturnPercent: round(result.totalReturnPercent, 2),
    maxDrawdownPercent: round(result.maxDrawdownPercent, 2),
    winRate: round(result.winRate, 1),
    profitFactor: round(result.profitFactor, 2),
    totalTrades: result.totalTrades,
    finalBalance: round(result.finalBalance, 2),
    expectancy: round(result.expectancy, 2),
  };
}

interface StrategySpec {
  id: string;
  type: 'ema_cross' | 'rsi_reversal' | 'breakout';
  name: string;
  params: Record<string, number>;
}

function buildStrategyGrid(): StrategySpec[] {
  const specs: StrategySpec[] = [];
  const slValues = [1, 1.5, 2];
  const tpValues = [2, 3, 4];
  for (const fast of [5, 9, 12, 21]) {
    for (const slow of [21, 34, 55]) {
      if (fast >= slow) continue;
      for (const sl of slValues) {
        for (const tp of tpValues) {
          specs.push({
            id: `ema-${fast}-${slow}-${sl}-${tp}`,
            type: 'ema_cross',
            name: `EMA ${fast}/${slow} · SL ${sl}% · TP ${tp}%`,
            params: { fastPeriod: fast, slowPeriod: slow, stopLossPercent: sl, takeProfitPercent: tp },
          });
        }
      }
    }
  }
  for (const period of [7, 14, 21]) {
    for (const oversold of [25, 30, 35]) {
      for (const sl of slValues) {
        for (const tp of tpValues) {
          specs.push({
            id: `rsi-${period}-${oversold}-${sl}-${tp}`,
            type: 'rsi_reversal',
            name: `RSI ${period} · ${oversold} · SL ${sl}% · TP ${tp}%`,
            params: { rsiPeriod: period, rsiOversold: oversold, stopLossPercent: sl, takeProfitPercent: tp },
          });
        }
      }
    }
  }
  for (const sl of slValues) {
    for (const tp of tpValues) {
      specs.push({
        id: `breakout-${sl}-${tp}`,
        type: 'breakout',
        name: `Cassure 10 barres · SL ${sl}% · TP ${tp}%`,
        params: { stopLossPercent: sl, takeProfitPercent: tp },
      });
    }
  }
  return specs;
}

function toBacktestCandles(candles: JyntrackCandle[]): BacktestCandle[] {
  return candles.map((c) => ({
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? 0,
  }));
}

export function runStrategyLabOnCandles(
  symbol: string,
  interval: string,
  effectiveInterval: string,
  candles: JyntrackCandle[],
  initialBalance = 10000,
  riskPerTrade = 2,
): JyntrackStrategyLab {
  const bars = toBacktestCandles(candles);
  const split = Math.floor(bars.length * 0.7);
  const train = bars.slice(0, split);
  const test = bars.slice(split);
  if (train.length < 40 || test.length < 40) {
    throw new JyntrackDataError('NOT_ENOUGH_DATA', 'not-enough-data');
  }
  const safeBalance = Math.max(100, Math.min(1_000_000, Number(initialBalance) || 10000));
  const safeRisk = Math.max(0.1, Math.min(5, Number(riskPerTrade) || 2));

  const ranked = buildStrategyGrid()
    .map((spec) => {
      const trainResult = runBacktest(
        train,
        {
          name: spec.name,
          type: spec.type,
          ...spec.params,
        },
        safeBalance,
        safeRisk,
      );
      const score =
        trainResult.totalTrades >= 3
          ? trainResult.totalReturnPercent - trainResult.maxDrawdownPercent * 0.35 + Math.min(3, trainResult.profitFactor)
          : -999;
      return { spec, trainResult, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const candidates: JyntrackStrategyCandidate[] = ranked.map(({ spec, trainResult }) => {
    const testResult = runBacktest(
      test,
      {
        name: spec.name,
        type: spec.type,
        ...spec.params,
      },
      safeBalance,
      safeRisk,
    );
    return {
      id: spec.id,
      type: spec.type,
      name: spec.name,
      params: spec.params,
      train: metricsFromResult(trainResult),
      test: metricsFromResult(testResult),
    };
  });

  const buyHoldTrain = ((train[train.length - 1].close / train[0].close) - 1) * 100;
  const buyHoldTest = ((test[test.length - 1].close / test[0].close) - 1) * 100;

  const bestSpec = ranked[0];
  let best: JyntrackStrategyLab['best'] = null;
  if (bestSpec) {
    const testResult = runBacktest(
      test,
      {
        name: bestSpec.spec.name,
        type: bestSpec.spec.type,
        ...bestSpec.spec.params,
      },
      safeBalance,
      safeRisk,
    );
    best = {
      candidateId: bestSpec.spec.id,
      equityCurve: testResult.equityCurve.slice(-160).map((point) => ({
        timestamp: point.timestamp,
        balance: round(point.balance, 2),
      })),
    };
  }

  const warnings = new Set<string>(['IN_SAMPLE_SELECTION']);
  if (test.length < 80) warnings.add('SMALL_TEST_SAMPLE');
  if (candidates.every((candidate) => candidate.test.totalTrades === 0)) warnings.add('NO_TRADES');

  return {
    success: true,
    symbol,
    interval,
    effectiveInterval,
    generatedAt: Date.now(),
    initialBalance: safeBalance,
    trainBars: train.length,
    testBars: test.length,
    candidates,
    buyHold: {
      trainPct: round(buyHoldTrain, 2),
      testPct: round(buyHoldTest, 2),
    },
    best,
    warnings: Array.from(warnings),
  };
}

export async function runStrategyLab(input: {
  symbol?: unknown;
  interval?: unknown;
  initialBalance?: unknown;
  riskPercent?: unknown;
}): Promise<JyntrackStrategyLab> {
  const symbol = normaliseSymbol(input.symbol);
  const interval = normaliseInterval(input.interval);
  const data = await fetchJyntrackCandles(symbol, interval, 300);
  return runStrategyLabOnCandles(
    symbol,
    interval,
    data.effectiveInterval,
    data.candles,
    Number(input.initialBalance) || 10000,
    Number(input.riskPercent) || 2,
  );
}

function aggregateHorizon(
  events: Array<{ forward: Array<number | null>; direction: 'UP' | 'DOWN' }>,
  horizon: number,
): JyntrackEventHorizon {
  const values = events
    .map((event) => event.forward[horizon - 1])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!values.length) {
    return { horizon, count: 0, meanPct: null, medianPct: null, positiveRatePct: null, continuationRatePct: null, stdevPct: null };
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const continuation = events.filter((event) => {
    const value = event.forward[horizon - 1];
    if (typeof value !== 'number') return false;
    return event.direction === 'UP' ? value > 0 : value < 0;
  }).length;
  return {
    horizon,
    count: values.length,
    meanPct: round(mean(values), 3),
    medianPct: round(quantile(sorted, 0.5), 3),
    positiveRatePct: round((values.filter((v) => v > 0).length / values.length) * 100, 1),
    continuationRatePct: round((continuation / values.length) * 100, 1),
    stdevPct: round(stdev(values), 3),
  };
}

export function runEventStudyOnCandles(
  symbol: string,
  interval: string,
  effectiveInterval: string,
  candles: JyntrackCandle[],
  benchmark: JyntrackCandle[] | null,
  benchmarkSymbol: string | null,
  threshold = 2,
): JyntrackEventStudy {
  const returns = logReturns(candles);
  if (returns.length < 40) throw new JyntrackDataError('NOT_ENOUGH_DATA', 'not-enough-data');
  const mu = mean(returns);
  const sigma = stdev(returns);
  if (sigma <= 0) throw new JyntrackDataError('NOT_ENOUGH_DATA', 'not-enough-data');

  const benchmarkMap = new Map<string, number>();
  if (benchmark) {
    const useDate = effectiveInterval === '1d';
    for (const candle of benchmark) benchmarkMap.set(useDate ? dateKey(candle.timestamp) : String(candle.timestamp), candle.close);
  }
  const useDate = effectiveInterval === '1d';

  const selected: number[] = [];
  for (let i = 0; i < returns.length; i++) {
    if (Math.abs((returns[i] - mu) / sigma) < threshold) continue;
    if (selected.length && i - selected[selected.length - 1] < 5) continue;
    if (i + 11 >= returns.length) continue;
    selected.push(i);
  }

  const episodes: JyntrackEventEpisode[] = selected.slice(-24).map((index) => {
    const candle = candles[index + 1];
    const shockPct = returns[index] * 100;
    const direction: 'UP' | 'DOWN' = returns[index] >= 0 ? 'UP' : 'DOWN';
    const forward: Array<number | null> = [];
    const benchmarkForward: Array<number | null> = [];
    for (const horizon of [1, 3, 5, 10]) {
      const targetIndex = index + 1 + horizon;
      const targetClose = candles[targetIndex]?.close;
      forward.push(Number.isFinite(targetClose) ? round((targetClose / candle.close - 1) * 100, 3) : null);
      if (benchmark) {
        const eventKey = useDate ? dateKey(candle.timestamp) : String(candle.timestamp);
        const futureCandle = candles[targetIndex];
        const futureKey = futureCandle ? (useDate ? dateKey(futureCandle.timestamp) : String(futureCandle.timestamp)) : null;
        const baseBenchmark = benchmarkMap.get(eventKey);
        const futureBenchmark = futureKey ? benchmarkMap.get(futureKey) : undefined;
        benchmarkForward.push(
          baseBenchmark && futureBenchmark && baseBenchmark > 0
            ? round((futureBenchmark / baseBenchmark - 1) * 100, 3)
            : null,
        );
      }
    }
    return {
      timestamp: candle.timestamp,
      date: new Date(candle.timestamp).toISOString(),
      direction,
      shockPct: round(shockPct, 3),
      forward,
      benchmarkForward,
    };
  });

  const benchmarkEpisodes = benchmark
    ? episodes.map((episode) => ({
        direction: episode.direction,
        forward: episode.benchmarkForward,
      }))
    : null;

  const warnings = new Set<string>();
  if (selected.length < 5) warnings.add('EVENT_SAMPLE_SMALL');
  if (episodes.length < selected.length) warnings.add('EPISODES_TRUNCATED');

  return {
    success: true,
    symbol,
    benchmarkSymbol,
    interval,
    effectiveInterval,
    threshold,
    generatedAt: Date.now(),
    sampleBars: candles.length,
    target: [1, 3, 5, 10].map((horizon) => aggregateHorizon(episodes, horizon)),
    benchmark: benchmarkEpisodes ? [1, 3, 5, 10].map((horizon) => aggregateHorizon(benchmarkEpisodes, horizon)) : null,
    episodes: episodes.slice().reverse(),
    warnings: Array.from(warnings),
  };
}

export async function runEventStudy(input: {
  symbol?: unknown;
  interval?: unknown;
  benchmark?: unknown;
  threshold?: unknown;
}): Promise<JyntrackEventStudy> {
  const symbol = normaliseSymbol(input.symbol);
  const interval = normaliseInterval(input.interval);
  const benchmarkInput = input.benchmark ? normaliseSymbol(input.benchmark) : null;
  const benchmarkSymbol = benchmarkInput && benchmarkInput !== symbol ? benchmarkInput : null;
  const threshold = Math.max(1, Math.min(3.5, Number(input.threshold) || 2));
  const data = await fetchJyntrackCandles(symbol, interval, 300);
  let benchmarkData: JyntrackMarketData | null = null;
  if (benchmarkSymbol) {
    try {
      benchmarkData = await fetchJyntrackCandles(benchmarkSymbol, interval, 300);
    } catch {
      benchmarkData = null;
    }
  }
  return runEventStudyOnCandles(
    symbol,
    interval,
    data.effectiveInterval,
    data.candles,
    benchmarkData?.candles ?? null,
    benchmarkData ? benchmarkSymbol : null,
    threshold,
  );
}

/**
 * Pure comparison between a stored hypothesis and the candles observed since
 * its creation. No hidden model, no simulated observation: only real closes.
 */
export function evaluateReality(
  request: JyntrackRealityRequest,
  candles: JyntrackCandle[],
  source: { source: string; sourceName: string; freshness: string; effectiveInterval: string },
): JyntrackRealityCheck {
  const horizon = Math.max(1, Math.min(120, Math.floor(Number(request.horizon) || 48)));
  const baselinePrice = Number(request.baselinePrice);
  const baselineTimestamp = Number(request.baselineTimestamp);
  const observed = candles.filter((candle) => candle.timestamp > baselineTimestamp).sort((a, b) => a.timestamp - b.timestamp);
  const step = Math.min(observed.length, horizon);
  const last = observed[observed.length - 1];
  const warnings = new Set<string>();
  if (observed.length < horizon) warnings.add('NOT_MATURED');

  const expectedBand = (request.bands || []).find((band) => band.step === step) || (request.bands || [])[request.bands.length - 1] || null;
  const expected = expectedBand
    ? { p05: expectedBand.p05, p25: expectedBand.p25, p50: expectedBand.p50, p75: expectedBand.p75, p95: expectedBand.p95 }
    : null;

  if (!last || !Number.isFinite(baselinePrice) || baselinePrice <= 0) {
    return {
      success: true,
      symbol: request.symbol,
      interval: request.interval,
      baselineTimestamp,
      observedBars: observed.length,
      horizon,
      matured: false,
      baselinePrice,
      lastPrice: baselinePrice,
      lastTimestamp: baselineTimestamp,
      observedReturnPct: 0,
      expected,
      bracket: 'NO_DATA',
      inside50: false,
      inside90: false,
      assessment: 'PENDING',
      invalidated: false,
      realized: { maxReturnPct: 0, minReturnPct: 0, maxDrawdownPct: 0 },
      coverageLimited: false,
      source: source.source,
      sourceName: source.sourceName,
      freshness: source.freshness,
      warnings: Array.from(new Set([...warnings, 'NO_NEW_DATA'])),
    };
  }

  let maxPrice = baselinePrice;
  let minPrice = baselinePrice;
  let peak = baselinePrice;
  let worstDrawdown = 0;
  for (const candle of observed) {
    if (candle.close > maxPrice) maxPrice = candle.close;
    if (candle.close < minPrice) minPrice = candle.close;
    if (candle.close > peak) peak = candle.close;
    const drawdown = ((peak - candle.close) / peak) * 100;
    if (drawdown > worstDrawdown) worstDrawdown = drawdown;
  }

  const observedReturnPct = (last.close / baselinePrice - 1) * 100;
  const bracket = expected ? bracketFor(last.close, expectedBand as JyntrackBand) : 'NO_DATA';
  const inside50 = Boolean(expected && last.close >= expected.p25 && last.close <= expected.p75);
  const inside90 = Boolean(expected && last.close >= expected.p05 && last.close <= expected.p95);

  const invalidated =
    (request.invalidationLow != null && last.close <= request.invalidationLow) ||
    (request.invalidationHigh != null && last.close >= request.invalidationHigh);

  const elapsedEstimate = Math.floor((Date.now() - baselineTimestamp) / intervalMs(source.effectiveInterval || request.interval));
  const coverageLimited = elapsedEstimate > Math.max(observed.length + 2, 300);
  if (coverageLimited) warnings.add('COVERAGE_LIMITED');

  const matured = observed.length >= horizon;
  let assessment: JyntrackRealityCheck['assessment'];
  if (invalidated) assessment = 'CONTRADICTED';
  else if (inside50) assessment = 'ON_TRACK';
  else if (inside90) assessment = 'EDGE';
  else assessment = 'CONTRADICTED';

  return {
    success: true,
    symbol: request.symbol,
    interval: request.interval,
    baselineTimestamp,
    observedBars: observed.length,
    horizon,
    matured,
    baselinePrice,
    lastPrice: round(last.close, 8),
    lastTimestamp: last.timestamp,
    observedReturnPct: round(observedReturnPct, 3),
    expected,
    bracket,
    inside50,
    inside90,
    assessment,
    invalidated,
    realized: {
      maxReturnPct: round((maxPrice / baselinePrice - 1) * 100, 3),
      minReturnPct: round((minPrice / baselinePrice - 1) * 100, 3),
      maxDrawdownPct: round(worstDrawdown, 3),
    },
    coverageLimited,
    source: source.source,
    sourceName: source.sourceName,
    freshness: source.freshness,
    warnings: Array.from(warnings),
  };
}

export async function runRealityCheck(request: JyntrackRealityRequest): Promise<JyntrackRealityCheck> {
  const symbol = normaliseSymbol(request.symbol);
  const interval = normaliseInterval(request.interval);
  const data = await fetchJyntrackCandles(symbol, interval, 300);
  return evaluateReality(
    { ...request, symbol, interval },
    data.candles,
    {
      source: data.source,
      sourceName: data.sourceName,
      freshness: data.freshness,
      effectiveInterval: data.effectiveInterval,
    },
  );
}
