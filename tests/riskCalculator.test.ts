import assert from 'node:assert';
import { calculateRisk } from '../src/utils/riskCalculator.js';

// --- Valid LONG trade ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true });
  assert.equal(r.isValid, true);
  assert.equal(r.riskAmount, 100);
  assert.equal(r.positionSize, 20);
  assert.equal(r.riskRewardRatio, 2);
  assert.equal(r.warningCodes.length, 0);
}

// --- Valid SHORT trade ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 2, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 90, isLong: false });
  assert.equal(r.isValid, true);
  assert.equal(r.riskAmount, 200);
  assert.equal(r.positionSize, 40);
  assert.equal(r.riskRewardRatio, 2);
}

// --- Invalid: zero capital ---
{
  const r = calculateRisk({ accountBalance: 0, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true });
  assert.equal(r.isValid, false);
  assert.equal(r.warningCodes.includes('CAPITAL_POSITIVE'), true);
}

// --- Invalid: SL above entry for LONG ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 105, takeProfitPrice: 110, isLong: true });
  assert.equal(r.isValid, false);
  assert.equal(r.warningCodes.includes('LONG_SL'), true);
}

// --- Invalid: TP below entry for LONG ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 90, isLong: true });
  assert.equal(r.isValid, false);
  assert.equal(r.warningCodes.includes('LONG_TP'), true);
}

// --- High risk warning ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 5, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 110, isLong: true });
  assert.equal(r.warningCodes.includes('HIGH_RISK'), true);
}

// --- Low R:R warning ---
{
  const r = calculateRisk({ accountBalance: 10000, riskPercentage: 1, entryPrice: 100, stopLossPrice: 95, takeProfitPrice: 102, isLong: true });
  assert.equal(r.warningCodes.includes('LOW_RR'), true);
  assert.equal(r.riskRewardRatio, 0.4);
}

// --- Position size precision ---
{
  const r = calculateRisk({ accountBalance: 50000, riskPercentage: 2, entryPrice: 3333.33, stopLossPrice: 3300.00, takeProfitPrice: 3400.00, isLong: true });
  assert.equal(r.isValid, true);
  assert.ok(r.positionSize > 0);
  assert.ok(r.riskRewardRatio > 0);
}

console.log('riskCalculator tests: PASS (valid LONG, valid SHORT, zero capital, invalid SL, invalid TP, high risk, low R:R, precision)');
