import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateReality,
  runEventStudyOnCandles,
  runStrategyLabOnCandles,
  type JyntrackCandle,
} from '../server/jyntrack.ts';
import { JYNTRACK_COPY } from '../src/i18n/jyntrackCopy.ts';
import { JYNTRACK_SCENARIO_IDS } from '../src/types/jyntrack.ts';
import type { JyntrackBand, JyntrackRealityRequest } from '../src/types/jyntrack.ts';

/** Deterministic synthetic series: no network, no randomness between runs. */
function makeCandles(count: number, start = 100): JyntrackCandle[] {
  let price = start;
  let seed = 42;
  const out: JyntrackCandle[] = [];
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const shock = i % 37 === 0 && i > 0 ? 0.045 : 0;
    const open = price;
    price = price * Math.exp((rnd() - 0.5) * 0.02 + 0.0004 + shock);
    out.push({
      timestamp: Date.UTC(2025, 0, 1) + i * 3_600_000,
      open,
      high: Math.max(open, price) * 1.002,
      low: Math.min(open, price) * 0.998,
      close: price,
      volume: 1000,
    });
  }
  return out;
}

function band(step: number, p05: number, p25: number, p50: number, p75: number, p95: number): JyntrackBand {
  return { step, timestamp: Date.UTC(2025, 0, 2) + step * 3_600_000, p05, p25, p50, p75, p95, mean: p50 };
}

test('Reality check compares a hypothesis with the closes actually observed', () => {
  const candles: JyntrackCandle[] = [
    { timestamp: 1000, open: 100, high: 100, low: 100, close: 100, volume: 1 },
    { timestamp: 2000, open: 100, high: 101, low: 100, close: 101, volume: 1 },
    { timestamp: 3000, open: 101, high: 103, low: 101, close: 103, volume: 1 },
  ];
  const request: JyntrackRealityRequest = {
    symbol: 'TESTUSDT',
    interval: '1h',
    baselineTimestamp: 1000,
    baselinePrice: 100,
    horizon: 2,
    bands: [band(0, 99, 100, 100, 100, 101), band(1, 95, 99, 101, 103, 106), band(2, 90, 95, 100, 105, 110)],
    invalidationLow: 80,
    invalidationHigh: 120,
  };
  const check = evaluateReality(request, candles, {
    source: 'TEST',
    sourceName: 'Test series',
    freshness: 'TEST',
    effectiveInterval: '1h',
  });

  assert.equal(check.observedBars, 2);
  assert.equal(check.matured, true);
  assert.equal(check.observedReturnPct, 3);
  assert.equal(check.bracket, 'P50_P75');
  assert.equal(check.inside50, true);
  assert.equal(check.inside90, true);
  assert.equal(check.invalidated, false);
  assert.equal(check.assessment, 'ON_TRACK');
  assert.equal(check.realized.maxReturnPct, 3);
  assert.equal(check.realized.minReturnPct, 0);

  const broken = evaluateReality({ ...request, invalidationHigh: 102 }, candles, {
    source: 'TEST',
    sourceName: 'Test series',
    freshness: 'TEST',
    effectiveInterval: '1h',
  });
  assert.equal(broken.invalidated, true);
  assert.equal(broken.assessment, 'CONTRADICTED');

  const notMatured = evaluateReality({ ...request, horizon: 5 }, candles, {
    source: 'TEST',
    sourceName: 'Test series',
    freshness: 'TEST',
    effectiveInterval: '1h',
  });
  assert.equal(notMatured.matured, false);
  assert.ok(notMatured.warnings.includes('NOT_MATURED'));
  assert.equal(notMatured.expected?.p50, 100);
});

test('Event study measures only forward windows that really exist', () => {
  const candles = makeCandles(420);
  const study = runEventStudyOnCandles('TESTUSDT', '1h', '1h', candles, null, null, 2);

  assert.equal(study.success, true);
  assert.deepEqual(study.target.map((row) => row.horizon), [1, 3, 5, 10]);
  assert.equal(study.episodes.length > 0, true);
  assert.equal(study.episodes.length <= 24, true);

  for (const episode of study.episodes) {
    assert.equal(episode.forward.length, 4);
    assert.equal(episode.benchmarkForward.length, 0);
    assert.ok(Math.abs(episode.shockPct) > 0);
    for (const value of episode.forward) {
      assert.ok(value === null || Number.isFinite(value));
    }
  }

  // Episodes are displayed most recent first.
  const timestamps = study.episodes.map((episode) => episode.timestamp);
  assert.deepEqual(timestamps, timestamps.slice().sort((a, b) => b - a));

  for (const row of study.target) {
    assert.ok(row.count >= 0);
    assert.ok(row.count <= study.episodes.length);
    if (row.count > 0) {
      assert.ok(row.meanPct != null && Number.isFinite(row.meanPct));
      assert.ok(row.continuationRatePct != null && row.continuationRatePct >= 0 && row.continuationRatePct <= 100);
      assert.ok(row.positiveRatePct != null && row.positiveRatePct >= 0 && row.positiveRatePct <= 100);
    }
  }
});

test('Strategy lab selects on train and reports a genuine out-of-sample test', () => {
  const candles = makeCandles(320);
  const lab = runStrategyLabOnCandles('TESTUSDT', '1h', '1h', candles, 10_000, 2);

  assert.equal(lab.success, true);
  assert.equal(lab.trainBars + lab.testBars, candles.length);
  assert.ok(lab.candidates.length > 0 && lab.candidates.length <= 8);
  assert.ok(Number.isFinite(lab.buyHold.trainPct));
  assert.ok(Number.isFinite(lab.buyHold.testPct));

  for (const candidate of lab.candidates) {
    assert.equal(candidate.train.totalTrades >= 3, true, 'train candidate must have tradable signal');
    for (const metric of [candidate.train, candidate.test]) {
      assert.ok(Number.isFinite(metric.totalReturnPercent));
      assert.ok(Number.isFinite(metric.maxDrawdownPercent));
      assert.ok(metric.totalTrades >= 0);
      assert.ok(metric.profitFactor >= 0);
    }
  }

  assert.ok(lab.best);
  assert.equal(lab.best?.candidateId, lab.candidates[0].id);
  assert.ok((lab.best?.equityCurve.length ?? 0) > 0);
  for (const point of lab.best?.equityCurve ?? []) {
    assert.ok(Number.isFinite(point.balance) && point.balance > 0);
  }
});

test('JYNTRACK page copy is complete in FR, EN and MG', () => {
  const keyPaths = (value: unknown, prefix = ''): string[] => {
    if (!value || typeof value !== 'object') return [prefix];
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      keyPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  };

  const fr = keyPaths(JYNTRACK_COPY.fr).sort();
  assert.deepEqual(keyPaths(JYNTRACK_COPY.en).sort(), fr);
  assert.deepEqual(keyPaths(JYNTRACK_COPY.mg).sort(), fr);

  for (const lang of ['fr', 'en', 'mg'] as const) {
    assert.deepEqual(Object.keys(JYNTRACK_COPY[lang].scenario).sort(), [...JYNTRACK_SCENARIO_IDS].sort());
    for (const path of fr) {
      const value = path.split('.').reduce<any>((acc, key) => acc?.[key], JYNTRACK_COPY[lang]);
      assert.equal(typeof value, 'string', `${lang}.${path}`);
      assert.ok((value as string).trim().length > 0, `${lang}.${path} is empty`);
    }
  }
});
