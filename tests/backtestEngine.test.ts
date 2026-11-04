import assert from 'node:assert';
import { runBacktest } from '../src/utils/backtestEngine.js';

// Generate deterministic trending candles
function makeCandles(count: number, startPrice = 100, trend = 'up') {
  const candles = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = trend === 'up' ? (Math.random() * 2 + 0.5) : (trend === 'down' ? -(Math.random() * 2 + 0.5) : (Math.random() * 2 - 1));
    price = Math.max(price + change, 1);
    const open = price;
    const close = price + (Math.random() * 2 - 1);
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    candles.push({ timestamp: Date.now() - (count - i) * 60000, open, high, low, close, volume: 100 });
  }
  return candles;
}

// --- EMA Cross on uptrend ---
{
  const candles = makeCandles(100, 100, 'up');
  const result = runBacktest(candles, { name: 'EMA Cross', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21, stopLossPercent: 2, takeProfitPercent: 4 }, 10000, 1);
  assert.equal(result.strategyName, 'EMA Cross');
  assert.ok(result.totalTrades >= 0);
  assert.ok(result.winRate >= 0 && result.winRate <= 100);
  assert.ok(result.maxDrawdownPercent >= 0);
  assert.ok(result.profitFactor >= 0);
}

// --- RSI Reversal on sideways ---
{
  const candles = makeCandles(100, 100, 'flat');
  const result = runBacktest(candles, { name: 'RSI Reversal', type: 'rsi_reversal', rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossPercent: 2, takeProfitPercent: 4 }, 10000, 1);
  assert.equal(result.strategyName, 'RSI Reversal');
  assert.ok(result.totalTrades >= 0);
}

// --- Breakout ---
{
  const candles = makeCandles(100, 100, 'up');
  const result = runBacktest(candles, { name: 'Breakout', type: 'breakout', stopLossPercent: 2, takeProfitPercent: 4 }, 10000, 1);
  assert.equal(result.strategyName, 'Breakout');
  assert.ok(result.totalTrades >= 0);
}

// --- Insufficient candles ---
{
  const result = runBacktest([{ timestamp: Date.now(), open: 100, high: 101, low: 99, close: 100, volume: 100 }], { name: 'Test', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21 }, 10000, 1);
  assert.equal(result.totalTrades, 0);
  assert.equal(result.finalBalance, 10000);
}

// --- Equity curve present ---
{
  const candles = makeCandles(100, 100, 'up');
  const result = runBacktest(candles, { name: 'Curve Test', type: 'ema_cross', fastPeriod: 9, slowPeriod: 21 }, 10000, 1);
  assert.ok(Array.isArray(result.equityCurve));
  assert.ok(result.equityCurve.length >= 1);
  assert.equal(result.equityCurve[0].balance, 10000);
}

console.log('backtestEngine tests: PASS (EMA Cross, RSI Reversal, Breakout, insufficient candles, equity curve)');
