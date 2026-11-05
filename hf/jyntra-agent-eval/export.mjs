// Materialises the publishable Hugging Face dataset artifact.
//
// Source of truth: benchmarks/datasets/jyntra-agent-scenarios.v1.json
// Output: hf/jyntra-agent-eval/data/{scenarios.jsonl, reference-results.csv, metrics.json}
//
// Nothing is published automatically. Uploading requires an explicit operator
// action and a Hugging Face token (see hf/jyntra-agent-eval/README.md).

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const datasetPath = path.join(root, 'benchmarks', 'datasets', 'jyntra-agent-scenarios.v1.json');
const resultsPath = path.join(root, 'benchmarks', 'results', 'results.json');
const csvPath = path.join(root, 'benchmarks', 'results', 'agents.csv');
const outDir = path.join(root, 'hf', 'jyntra-agent-eval', 'data');

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const lines = dataset.scenarios.map((s) =>
  JSON.stringify({
    id: s.id,
    description: s.description,
    symbol: s.symbol,
    timeframe: s.timeframe,
    context: s.context,
    prior_analysis: s.priorAnalysis,
    agent_fixtures: s.fixtures,
    cross_check: s.crossCheck ?? null,
    expected: s.expected,
    provenance: {
      kind: 'synthetic-fixture',
      dataset: dataset.datasetId,
      version: dataset.version,
      license: dataset.license,
    },
  }),
);
fs.writeFileSync(path.join(outDir, 'scenarios.jsonl'), lines.join('\n') + '\n');

if (fs.existsSync(csvPath)) {
  fs.copyFileSync(csvPath, path.join(outDir, 'reference-results.csv'));
}

if (fs.existsSync(resultsPath)) {
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const agent = (results.results || []).find((r) => r.benchmarkId === 'agent-orchestration-v1');
  fs.writeFileSync(
    path.join(outDir, 'metrics.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'benchmarks/results/results.json',
        agentEvaluation: agent?.metrics ?? null,
        caveat: 'Replay evaluation of the orchestration contract. Not a profitability benchmark.',
      },
      null,
      2,
    ),
  );
}

const info = {
  datasetId: dataset.datasetId,
  version: dataset.version,
  rows: lines.length,
  files: fs.readdirSync(outDir),
};
process.stdout.write(JSON.stringify(info, null, 2));
