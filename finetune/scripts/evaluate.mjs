#!/usr/bin/env node
/**
 * Evaluator for the JYNTRA structured-risk adapter.
 *
 * It compares real model outputs against the held-out reference split. It does
 * not generate predictions and does not invent metrics: with missing files it
 * prints usage and exits non-zero.
 *
 * Usage:
 *   node finetune/scripts/evaluate.mjs \
 *     --references finetune/data/test.jsonl \
 *     --predictions finetune/out/test-predictions.jsonl \
 *     [--out finetune/out/metrics.json]
 *
 * Prediction line shape: {"id":"jyntra-risk-001","output":{...}}
 */
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.references || !args.predictions) {
  console.error('Usage: node finetune/scripts/evaluate.mjs --references <test.jsonl> --predictions <predictions.jsonl> [--out <metrics.json>]');
  process.exit(1);
}

const readJsonl = (file) =>
  fs
    .readFileSync(path.resolve(file), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));

const references = readJsonl(args.references);
const predictions = readJsonl(args.predictions);
const byId = new Map(predictions.map((row) => [row.id, row.output ?? row]));
const required = ['stance', 'riskRewardRatio', 'primaryRisk', 'invalidation', 'explanation'];
const stances = new Set(['APPROVED', 'CAUTION', 'REJECTED']);

let matched = 0;
let schemaValid = 0;
let stanceCorrect = 0;
let rejectedTotal = 0;
let rejectedCorrect = 0;
let rrPairs = 0;
let rrAbsError = 0;
let fieldsPresent = 0;

for (const reference of references) {
  const output = byId.get(reference.id);
  if (!output) continue;
  matched += 1;

  const present = required.filter((key) => output[key] !== undefined && output[key] !== null && output[key] !== '').length;
  fieldsPresent += present / required.length;

  const valid =
    present === required.length &&
    stances.has(output.stance) &&
    (output.riskRewardRatio === null || (typeof output.riskRewardRatio === 'number' && Number.isFinite(output.riskRewardRatio)));
  if (valid) schemaValid += 1;

  if (output.stance === reference.stance) stanceCorrect += 1;
  if (reference.riskRewardRatio < 1.5) {
    rejectedTotal += 1;
    if (output.stance === 'REJECTED') rejectedCorrect += 1;
  }
  if (typeof output.riskRewardRatio === 'number' && Number.isFinite(output.riskRewardRatio)) {
    rrPairs += 1;
    rrAbsError += Math.abs(output.riskRewardRatio - reference.riskRewardRatio);
  }
}

const ratio = (value, total) => (total > 0 ? Number((value / total).toFixed(4)) : null);
const metrics = {
  executedAt: new Date().toISOString(),
  references: path.resolve(args.references),
  predictions: path.resolve(args.predictions),
  counts: { references: references.length, predictions: predictions.length, matched },
  metrics: {
    coverage: ratio(matched, references.length),
    schemaValidRate: ratio(schemaValid, matched),
    fieldCoverage: matched > 0 ? Number((fieldsPresent / matched).toFixed(4)) : null,
    stanceAccuracy: ratio(stanceCorrect, matched),
    rejectedRecall: ratio(rejectedCorrect, rejectedTotal),
    riskRewardMae: rrPairs > 0 ? Number((rrAbsError / rrPairs).toFixed(4)) : null,
  },
};

const serialized = JSON.stringify(metrics, null, 2) + '\n';
if (args.out) {
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  fs.writeFileSync(path.resolve(args.out), serialized, 'utf8');
}
process.stdout.write(serialized);
