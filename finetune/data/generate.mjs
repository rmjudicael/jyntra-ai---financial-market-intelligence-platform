#!/usr/bin/env node
/**
 * Deterministic generator for the JYNTRA structured-risk fine-tuning fixtures.
 *
 * The data is SYNTHETIC. It is generated from arithmetic rules, not from market
 * observations, and must never be presented as realised market data or as a
 * performance claim. Its only purpose is to teach a small open-weight model the
 * exact JSON contract used by `src/server/fineTunedAdapter.ts`.
 *
 * Usage: node finetune/data/generate.mjs [outputDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const outputDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('finetune/data');
const SEED = 20261105;

let state = SEED >>> 0;
const random = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x1_0000_0000;
};
const pick = (items) => items[Math.floor(random() * items.length)];
const round = (value, digits = 2) => Number(value.toFixed(digits));

const SYMBOLS = [
  { symbol: 'BTC/USDT', price: 64_200 },
  { symbol: 'ETH/USDT', price: 3_150 },
  { symbol: 'EUR/USD', price: 1.086 },
  { symbol: 'XAU/USD', price: 2_340 },
  { symbol: 'SPX500', price: 5_520 },
  { symbol: 'NASDAQ100', price: 19_800 },
];
const TIMEFRAMES = ['15M', '1H', '4H', '1D'];
const RISK_REWARDS = [0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0];
const RISK_PERCENTS = [0.008, 0.012, 0.018, 0.025, 0.035];

function stanceFor(rr) {
  if (rr < 1.5) return 'REJECTED';
  if (rr < 1.8) return 'CAUTION';
  return 'APPROVED';
}

function explanationFor({ rr, stance, riskPct, long }) {
  const direction = long ? 'long' : 'short';
  const risk = `R:R ${rr.toFixed(2)}`;
  const budget = `risque ${(riskPct * 100).toFixed(1)}%`;
  if (stance === 'REJECTED') {
    return `${risk} sous le minimum de 1.5 (${budget}); le setup ${direction} est rejete par la regle deterministe.`;
  }
  if (stance === 'CAUTION') {
    return `${risk} proche du minimum de 1.5 (${budget}); le setup ${direction} reste conditionnel.`;
  }
  return `${risk} au-dessus du minimum de 1.5 (${budget}); le setup ${direction} respecte le plan de risque.`;
}

function makeFixture(index) {
  const { symbol, price } = pick(SYMBOLS);
  const timeframe = pick(TIMEFRAMES);
  const long = random() >= 0.5;
  const entry = round(price * (1 + (random() - 0.5) * 0.04), price < 10 ? 4 : 2);
  const riskPct = pick(RISK_PERCENTS);
  const rrTarget = pick(RISK_REWARDS);
  const riskDistance = entry * riskPct;
  const rewardDistance = riskDistance * rrTarget;

  const stopLoss = long ? round(entry - riskDistance, price < 10 ? 4 : 2) : round(entry + riskDistance, price < 10 ? 4 : 2);
  const takeProfit1 = long
    ? round(entry + rewardDistance, price < 10 ? 4 : 2)
    : round(entry - rewardDistance, price < 10 ? 4 : 2);

  const rr = round(Math.abs(takeProfit1 - entry) / Math.abs(entry - stopLoss), 2);
  const stance = stanceFor(rr);
  const verdict = stance === 'REJECTED' ? 'NO_TRADE' : long ? 'BUY' : 'SELL';

  return {
    id: `jyntra-risk-${String(index + 1).padStart(3, '0')}`,
    synthetic: true,
    provenance: 'deterministic arithmetic fixture; not market data',
    symbol,
    timeframe,
    verdict,
    entry,
    stopLoss,
    takeProfit1,
    riskRewardRatio: rr,
    stance,
    primaryRisk: long
      ? `Cloture sous le stop ${stopLoss} invalide la structure haussiere.`
      : `Cloture au-dessus du stop ${stopLoss} invalide la structure baissiere.`,
    invalidation: long ? `Cloture 1H sous ${stopLoss}.` : `Cloture 1H au-dessus de ${stopLoss}.`,
    explanation: explanationFor({ rr, stance, riskPct, long }),
  };
}

const fixtures = Array.from({ length: 90 }, (_, index) => makeFixture(index));

// Deterministic Fisher-Yates shuffle before splitting.
for (let i = fixtures.length - 1; i > 0; i -= 1) {
  const j = Math.floor(random() * (i + 1));
  [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
}

const splits = {
  train: fixtures.slice(0, 70),
  validation: fixtures.slice(70, 80),
  test: fixtures.slice(80, 90),
};

const instruction = [
  'Tu es le module de risque de JYNTRA AI.',
  'A partir du plan fourni, produis uniquement un objet JSON avec les cles:',
  'stance (APPROVED|CAUTION|REJECTED), riskRewardRatio (number|null),',
  'primaryRisk (string), invalidation (string), explanation (string).',
  'Ne promets aucun gain et n inventes aucune donnee.',
].join(' ');

function toSftBlock(fixture) {
  const request = {
    symbol: fixture.symbol,
    timeframe: fixture.timeframe,
    verdict: fixture.verdict,
    entry: fixture.entry,
    stopLoss: fixture.stopLoss,
    takeProfit1: fixture.takeProfit1,
  };
  const response = {
    stance: fixture.stance,
    riskRewardRatio: fixture.riskRewardRatio,
    primaryRisk: fixture.primaryRisk,
    invalidation: fixture.invalidation,
    explanation: fixture.explanation,
  };
  return `<|sft|>\n### Instruction\n${instruction}\n\n### Input\n${JSON.stringify(request)}\n\n### Response\n${JSON.stringify(response)}\n`;
}

fs.mkdirSync(outputDir, { recursive: true });
for (const [name, rows] of Object.entries(splits)) {
  const jsonl = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
  fs.writeFileSync(path.join(outputDir, `${name}.jsonl`), jsonl, 'utf8');
  if (name !== 'test') {
    fs.writeFileSync(path.join(outputDir, `${name}.txt`), rows.map(toSftBlock).join(''), 'utf8');
  }
}

const manifest = {
  seed: SEED,
  generatedAt: new Date().toISOString(),
  synthetic: true,
  provenance: 'deterministic arithmetic fixtures; not market data',
  counts: Object.fromEntries(Object.entries(splits).map(([name, rows]) => [name, rows.length])),
  schema: ['id', 'synthetic', 'provenance', 'symbol', 'timeframe', 'verdict', 'entry', 'stopLoss', 'takeProfit1', 'riskRewardRatio', 'stance', 'primaryRisk', 'invalidation', 'explanation'],
  rule: 'stance=REJECTED when riskRewardRatio < 1.5; CAUTION when < 1.8; APPROVED otherwise',
};
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Generated ${fixtures.length} synthetic fixtures in ${outputDir}`);
for (const [name, rows] of Object.entries(splits)) console.log(`  ${name}: ${rows.length}`);
