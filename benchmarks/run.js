// JYNTRA AI — Benchmark Runner
// Runs all benchmark suites and produces JSON + Markdown reports.
// Usage: tsx benchmarks/run.js

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmarks');
const RESULTS_DIR = path.join(BENCHMARK_DIR, 'results');

// Resolve tsx via npx (works cross-platform including Windows)
const TSX_BIN = 'npx';

const suites = [
  { name: 'financial', file: 'financial.js' },
  { name: 'ai-engine', file: 'ai-engine.js' },
];

const allResults = {
  benchmarkSuite: 'JYNTRA AI Quantitative Benchmarks',
  executedAt: new Date().toISOString(),
  nodeVersion: process.version,
  results: [],
  summary: {},
};

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

for (const suite of suites) {
  const filePath = path.join(BENCHMARK_DIR, suite.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[benchmarks] Skipping missing suite: ${suite.file}`);
    continue;
  }
  console.log(`[benchmarks] Running suite: ${suite.name}`);
  try {
    const output = execFileSync(TSX_BIN, ['tsx', filePath], { cwd: process.cwd(), encoding: 'utf8', timeout: 60000 });
    const parsed = JSON.parse(output.trim());
    allResults.results.push(parsed);
  } catch (err) {
    console.error(`[benchmarks] Suite ${suite.name} failed:`, err.message);
    allResults.results.push({
      benchmarkId: suite.name,
      executedAt: new Date().toISOString(),
      module: suite.name,
      error: err.message,
      cases: [],
    });
  }
}

// Compute summary
let totalCases = 0;
let passedCases = 0;
let totalLatency = 0;
let latencyCount = 0;
for (const r of allResults.results) {
  for (const c of (r.cases || [])) {
    totalCases++;
    if (c.success !== false) passedCases++;
    if (c.latencyMs) { totalLatency += c.latencyMs; latencyCount++; }
  }
}
allResults.summary = {
  totalSuites: allResults.results.length,
  totalCases,
  passedCases,
  failedCases: totalCases - passedCases,
  averageLatencyMs: latencyCount ? Math.round((totalLatency / latencyCount) * 100) / 100 : 0,
};

// Write JSON report
const jsonPath = path.join(RESULTS_DIR, 'results.json');
fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));

// Write Markdown report
const mdLines = [
  '# JYNTRA AI — Quantitative Benchmark Results',
  '',
  `Executed at: ${allResults.executedAt}`,
  `Node.js: ${allResults.nodeVersion}`,
  '',
  '## Summary',
  '',
  `| Metric | Value |`,
  `|------|-------|`,
  `| Total suites | ${allResults.summary.totalSuites} |`,
  `| Total cases | ${allResults.summary.totalCases} |`,
  `| Passed | ${allResults.summary.passedCases} |`,
  `| Failed | ${allResults.summary.failedCases} |`,
  `| Average latency (ms) | ${allResults.summary.averageLatencyMs} |`,
  '',
];

for (const r of allResults.results) {
  mdLines.push(`## ${r.benchmarkId} (${r.module})`);
  mdLines.push('');
  mdLines.push(`Executed: ${r.executedAt}`);
  mdLines.push('');
  if (r.error) {
    mdLines.push(`Error: ${r.error}`);
    mdLines.push('');
    continue;
  }
  mdLines.push('| Case | Latency (ms) | Success | Details |');
  mdLines.push('|------|--------------|---------|---------|');
  for (const c of r.cases) {
    const detail = c.detail || c.error || c.model || c.tier || '';
    mdLines.push(`| ${c.name} | ${c.latencyMs ?? 'N/A'} | ${c.success ?? false} | ${detail} |`);
  }
  mdLines.push('');
}

const mdPath = path.join(RESULTS_DIR, 'results.md');
fs.writeFileSync(mdPath, mdLines.join('\n'));

console.log(`\n[benchmarks] Complete. Reports written to ${RESULTS_DIR}/`);
console.log(JSON.stringify(allResults.summary, null, 2));
