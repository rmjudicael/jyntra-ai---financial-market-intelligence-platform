// JYNTRA AI — Financial Calculation Benchmarks
// Deterministic benchmarks for risk calculations, backtest engine, and market structure parsing.
// No external API dependencies. All results computed from synthetic deterministic fixtures.

import { calculateRisk } from '../src/utils/riskCalculator.js';
import { runBacktest } from '../src/utils/backtestEngine.js';

const FIXTURE_CANDLES = [];
const basePrice = 50000;
for (let i = 0; i < 200; i++) {
  const drift = (Math.sin(i / 20) * 200) + (i * 5);
  const volatility = Math.random() * 100 - 50;
  const open = basePrice + drift + volatility;
  const close = basePrice + drift + volatility + (Math.random() * 40 - 20);
  const high = Math.max(open, close) + Math.random() * 30;
  const low = Math.min(open, close) - Math.random() * 30;
  FIXTURE_CANDLES.push({
    timestamp: Date.now() - (200 - i) * 3600000,
    open,
    high,
    low,
    close,
    volume: 100 + Math.random() * 1000,
  });
}

const results = {
  benchmarkId: 'financial-v1',
  executedAt: new Date().toISOString(),
  module: 'financial-calculations',
  cases: [],
};

// --- Risk Calculator Benchmarks ---
const riskCases = [
  { name: 'Valid LONG trade R:R=2.0', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Valid SHORT trade R:R=2.0', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 90, isLong: false } },
  { name: 'Invalid: zero capital', params: { accountBalance: 0, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Invalid: SL above entry (LONG)', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 110, isLong: true } },
  { name: 'High risk > 3%', params: { accountBalance: 10000, riskPercentage: 5, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true } },
  { name: 'Low R:R < 1.5', params: { accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 102, isLong: true } },
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

// --- Backtest Benchmarks ---
const strategyConfigs = [
  { name: 'EMA Cross', config: { name: 'EMA Cross', type: 'ema_cross', fastPeriod: 12, slowPeriod: 26, stopLossPercent: 2, takeProfitPercent: 4 } },
  { name: 'RSI Reversal', config: { name: 'RSI Reversal', type: 'rsi_reversal', rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossPercent: 2, takeProfitPercent: 4 } },
  { name: 'Breakout', config: { name: 'Breakout', type: 'breakout', stopLossPercent: 2, takeProfitPercent: 4 } },
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

console.log(JSON.stringify(results, null, 2));
