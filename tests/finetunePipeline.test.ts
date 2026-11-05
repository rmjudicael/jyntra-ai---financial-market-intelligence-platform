import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jyntra-finetune-'));

const run = (script: string, args: string[], expectStatus = 0) => {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, expectStatus, `${script} exited ${result.status}: ${result.stderr}`);
  return result;
};

const readJsonl = (file: string) =>
  fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

/* 1. The generator produces a deterministic, complete split. */
{
  run('finetune/data/generate.mjs', [tmp]);
  const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
  assert.equal(manifest.synthetic, true);
  assert.equal(manifest.seed, 20261105);
  assert.deepEqual(manifest.counts, { train: 70, validation: 10, test: 10 });

  const seen = new Set();
  for (const [split, expected] of Object.entries({ train: 70, validation: 10, test: 10 })) {
    const rows = readJsonl(path.join(tmp, `${split}.jsonl`));
    assert.equal(rows.length, expected, `${split} row count`);
    for (const row of rows) {
      for (const key of manifest.schema) assert.ok(key in row, `${split} missing ${key}`);
      assert.equal(row.synthetic, true);
      assert.ok(row.entry > 0 && row.stopLoss > 0 && row.takeProfit1 > 0);
      const risk = Math.abs(row.entry - row.stopLoss);
      const reward = Math.abs(row.takeProfit1 - row.entry);
      const rr = Number((reward / risk).toFixed(2));
      assert.ok(Math.abs(rr - row.riskRewardRatio) <= 0.01, `R:R mismatch in ${row.id}`);
      const expectedStance = row.riskRewardRatio < 1.5 ? 'REJECTED' : row.riskRewardRatio < 1.8 ? 'CAUTION' : 'APPROVED';
      assert.equal(row.stance, expectedStance, `stance rule in ${row.id}`);
      assert.ok(row.explanation.length <= 400);
      assert.ok(!seen.has(row.id), `duplicate id ${row.id}`);
      seen.add(row.id);
    }
  }

  const trainBlocks = fs.readFileSync(path.join(tmp, 'train.txt'), 'utf8').split('<|sft|>').length - 1;
  assert.equal(trainBlocks, 70);
  assert.ok(!fs.existsSync(path.join(tmp, 'test.txt')), 'test split must not leak into training text');
  console.log('finetunePipeline 1 PASS: deterministic 70/10/10 split + schema + R:R rule');
}

/* 2. The evaluator refuses to run without real predictions. */
{
  run('finetune/scripts/evaluate.mjs', [], 1);
  console.log('finetunePipeline 2 PASS: evaluator refuses missing inputs');
}

/* 3. The evaluator scores a perfect synthetic self-check correctly. */
{
  const testRows = readJsonl(path.join(tmp, 'test.jsonl'));
  const predictions = testRows.map((row) => ({
    id: row.id,
    output: {
      stance: row.stance,
      riskRewardRatio: row.riskRewardRatio,
      primaryRisk: row.primaryRisk,
      invalidation: row.invalidation,
      explanation: row.explanation,
    },
  }));
  const predictionsFile = path.join(tmp, 'predictions.jsonl');
  fs.writeFileSync(predictionsFile, predictions.map((p) => JSON.stringify(p)).join('\n') + '\n');
  const outFile = path.join(tmp, 'metrics.json');
  run('finetune/scripts/evaluate.mjs', ['--references', path.join(tmp, 'test.jsonl'), '--predictions', predictionsFile, '--out', outFile]);

  const metrics = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.equal(metrics.counts.matched, 10);
  assert.equal(metrics.metrics.coverage, 1);
  assert.equal(metrics.metrics.schemaValidRate, 1);
  assert.equal(metrics.metrics.stanceAccuracy, 1);
  assert.equal(metrics.metrics.rejectedRecall, 1);
  assert.equal(metrics.metrics.riskRewardMae, 0);
  console.log('finetunePipeline 3 PASS: evaluator metrics on synthetic self-check');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\nAll fine-tuning pipeline tests PASSED');
