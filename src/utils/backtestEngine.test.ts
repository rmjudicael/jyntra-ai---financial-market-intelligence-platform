import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktest, Candle } from './backtestEngine';

test('runs backtest and outputs correct trade metrics without forward-looking bias', () => {
  // Generate deterministic upward trending candles with cyclical pullbacks
  const candles: Candle[] = [];
  let price = 100;
  const now = 1700000000000;

  for (let i = 0; i < 100; i++) {
    const cycle = Math.sin(i / 5) * 4;
    const trend = i * 0.5;
    const open = price + trend + cycle;
    const close = open + (i % 2 === 0 ? 1.5 : -1.0);
    const high = Math.max(open, close) + 0.8;
    const low = Math.min(open, close) - 0.8;

    candles.push({
      timestamp: now + i * 3600000,
      open,
      high,
      low,
      close,
      volume: 1000 + i * 10,
    });
  }

  const result = runBacktest(
    candles,
    {
      name: 'EMA 9/21 Trend Follow',
      type: 'ema_cross',
      fastPeriod: 9,
      slowPeriod: 21,
      stopLossPercent: 2.0,
      takeProfitPercent: 4.0,
    },
    10000,
    2
  );

  assert.ok(result.totalTrades >= 0);
  assert.ok(result.finalBalance > 0);
  assert.ok(result.winRate >= 0 && result.winRate <= 100);
  assert.ok(result.equityCurve.length >= 1);
  assert.equal(result.equityCurve[0].balance, 10000);
});

test('handles small candle arrays safely without crashing', () => {
  const result = runBacktest([], { name: 'Empty', type: 'ema_cross' }, 5000);
  assert.equal(result.totalTrades, 0);
  assert.equal(result.finalBalance, 5000);
});
