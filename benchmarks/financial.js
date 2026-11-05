// JYNTRA AI — Financial Calculation Benchmarks
// Deterministic benchmarks for risk calculations, backtest engine, and market structure parsing.
// No external API dependencies. All results computed from synthetic deterministic fixtures.
// No Math.random: every fixture value is fixed and reproducible.

import { calculateRisk } from '../src/utils/riskCalculator.js';
import { runBacktest } from '../src/utils/backtestEngine.js';

// --- Deterministic fixture: 200 candles with known structure ---
const FIXTURE_CANDLES = [];
const basePrice = 50000;
for (let i = 0; i < 200; i++) {
  // Deterministic drift: sine wave + linear trend
  const drift = Math.sin(i / 20) * 200 + i * 4;
  // Deterministic volatility cycle
  const vol = (i % 17) * 3.5 - 29.75;
  const open = basePrice + drift + vol;
  const close = basePrice + drift + vol + ((i % 11) * 2.1 - 10.55);
  const high = Math.max(open, close) + ((i % 7) * 2 + 1);
  const low = Math.min(open, close) - ((i % 9) * 1.5 + 1);
  FIXTURE_CANDLES.push({
    timestamp: Date.now() - (200 - i) * 3600000,
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
    volume: 100 + (i % 50) * 20,
  });
}

const results = {
  benchmarkId: 'financial-v2',
  executedAt: new Date().toISOString(),
  module: 'financial-calculations',
  cases: [],
};

// ============================================================================
// 1. RISK CALCULATOR BENCHMARKS (deterministic)
// ============================================================================
const riskCases = [
  { name: 'Valid LONG trade R:R=2.0', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Valid SHORT trade R:R=2.0', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 90, isLong: false } },
  { name: 'Valid LONG trade R:R=3.0', params: { accountBalance: 50000, riskPercentage: 2, entryPrice: 200, stopLossPrice: 190, takeProfitPrice: 230, isLong: true } },
  { name: 'Invalid: zero capital', params: { accountBalance: 0, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Invalid: SL above entry (LONG)', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 110, isLong: true } },
  { name: 'Invalid: TP below entry (LONG)', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 90, isLong: true } },
  { name: 'Invalid: SL below entry (SHORT)', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: false } },
  { name: 'High risk > 3%', params: { accountBalance: 10000, riskPercentage: 5, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Low R:R < 1.5', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 102, isLong: true } },
  { name: 'Exact 1.5 R:R boundary', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 107.5, isLong: true } },
];

for (const tc of riskCases) {
  const start = process.hrtime.bigint();
  const result = calculateRisk(tc.params);
  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1_000_000;
  results.cases.push({
    category: 'risk-calculator',
    name: tc.name,
    latencyMs: Math.round(latencyMs * 100) / 100,
    isValid: result.isValid,
    riskRewardRatio: result.riskRewardRatio,
    riskAmount: result.riskAmount,
    positionSize: result.positionSize,
    warnings: result.warningCodes,
  });
}

// ============================================================================
// 2. BACKTEST ENGINE BENCHMARKS (deterministic)
// ============================================================================
const strategyConfigs = [
  { name: 'EMA Cross (uptrend)', config: { name: 'EMA Cross', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21, stopLossPercent: 2, takeProfitPercent: 4 } },
  { name: 'RSI Reversal (ranging)', config: { name: 'RSI Reversal', type: 'rsi_reversal', rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossPercent: 2, takeProfitPercent: 4 } },
  { name: 'Breakout (trending)', config: { name: 'Breakout', type: 'breakout', stopLossPercent: 2, takeProfitPercent: 4 } },
  { name: 'EMA Cross (no SL/TP)', config: { name: 'EMA Cross', type: 'ema_cross', fastPeriod: 12, slowPeriod: 26 } },
];

for (const { name, config } of strategyConfigs) {
  const start = process.hrtime.bigint();
  let btResult;
  try {
    btResult = runBacktest(FIXTURE_CANDLES, config, 10000, 0.01);
  } catch (e) {
    btResult = { error: e.message };
  }
  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1_000_000;
  results.cases.push({
    category: 'backtest-engine',
    name: `Backtest: ${name}`,
    latencyMs: Math.round(latencyMs * 100) / 100,
    success: !!btResult && !btResult.error,
    totalReturnPercent: btResult?.totalReturnPercent ?? 0,
    winRate: btResult?.winRate ?? 0,
    totalTrades: btResult?.totalTrades ?? 0,
    maxDrawdownPercent: btResult?.maxDrawdownPercent ?? 0,
    profitFactor: btResult?.profitFactor ?? 0,
    error: btResult?.error ?? null,
  });
}

// ============================================================================
// 3. MARKET STRUCTURE DETERMINISM CHECK
// ============================================================================
// Verify that running the same backtest twice produces identical results.
const startDet = process.hrtime.bigint();
const bt1 = runBacktest(FIXTURE_CANDLES, { name: 'Determinism', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21 }, 10000, 0.01);
const bt2 = runBacktest(FIXTURE_CANDLES, { name: 'Determinism', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21 }, 10000, 0.01);
const endDet = process.hrtime.bigint();
const determinismOk =
  bt1.finalBalance === bt2.finalBalance &&
  bt1.totalTrades === bt2.totalTrades &&
  bt1.winRate === bt2.winRate &&
  bt1.maxDrawdownPercent === bt2.maxDrawdownPercent;

results.cases.push({
  category: 'determinism',
  name: 'Backtest determinism (two runs, identical output)',
  latencyMs: Math.round(Number(endDet - startDet) / 1_000_000 * 100) / 100,
  success: determinismOk,
  detail: determinismOk ? 'Identical results across runs' : 'Results differ between runs',
});

console.log(JSON.stringify(results, null, 2));
