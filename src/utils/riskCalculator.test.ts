import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRisk } from './riskCalculator';

test('calculates correct LONG position sizing and R:R ratio', () => {
  const result = calculateRisk({
    accountBalance: 10000,
    riskPercentage: 1, // 1% = $100 risk
    entryPrice: 60000,
    stopLossPrice: 59000, // $1000 distance
    takeProfitPrice: 63000, // $3000 distance
    isLong: true,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.riskAmount, 100);
  assert.equal(result.rewardAmount, 300);
  assert.equal(result.riskRewardRatio, 3.0);
  assert.equal(result.positionSize, 0.1); // 100 / 1000 = 0.1 BTC
  assert.equal(result.positionValue, 6000);
});

test('detects invalid Stop-Loss configuration for LONG', () => {
  const result = calculateRisk({
    accountBalance: 5000,
    riskPercentage: 2,
    entryPrice: 100,
    stopLossPrice: 105, // SL higher than entry on long
    takeProfitPrice: 120,
    isLong: true,
  });

  assert.equal(result.isValid, false);
  assert.ok(result.warnings.some(w => w.includes('doit être inférieur')));
});

test('calculates correct SHORT trade parameters', () => {
  const result = calculateRisk({
    accountBalance: 20000,
    riskPercentage: 1.5, // $300 risk
    entryPrice: 3000,
    stopLossPrice: 3100, // $100 distance
    takeProfitPrice: 2800, // $200 distance
    isLong: false,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.riskAmount, 300);
  assert.equal(result.rewardAmount, 600);
  assert.equal(result.riskRewardRatio, 2.0);
  assert.equal(result.positionSize, 3); // 300 / 100 = 3 units
});
