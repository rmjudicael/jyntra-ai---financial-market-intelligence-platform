// JYNTRA AI — Benchmark Runner
// Runs all benchmark suites and produces JSON + Markdown reports.
// Usage: tsx benchmarks/run.js

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmarks');
const RESULTS_DIR = path.join(BENCHMARK_DIR, 'results');

// Run tsx through the current Node binary: no .cmd/.ps1 shim, no shell
// quoting issues on Windows runners.
const TSX_CLI = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');

const suites = [
  { name: 'financial', file: 'financial.js' },
  { name: 'ai-engine', file: 'ai-engine.js' },
  { name: 'agents', file: 'agents.js' },
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
    const output = execFileSync(process.execPath, [TSX_CLI, filePath], { cwd: process.cwd(), encoding: 'utf8', timeout: 120000 });
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
    if (c.success !== false || c.expectedFailure === true) passedCases++;
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
  if (r.mode) mdLines.push(`Mode: **${r.mode}**${r.mode === 'replay' ? ' — model outputs are labeled fixtures, not live calls' : ''}`);
  mdLines.push('');
  if (r.metrics) {
    mdLines.push('### Metrics');
    mdLines.push('');
    mdLines.push('| Metric | Value |');
    mdLines.push('|------|-------|');
    for (const [k, v] of Object.entries(r.metrics)) {
      if (typeof v === 'object') continue;
      mdLines.push(`| ${k} | ${v} |`);
    }
    mdLines.push('');
  }
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

// Fail the run when a labeled agent scenario regresses. Deterministic replays
// must be green, otherwise CI would report a false success.
const agentSuite = allResults.results.find((r) => r.benchmarkId === 'agent-orchestration-v1');
if (agentSuite?.metrics && agentSuite.metrics.casesPassed < agentSuite.metrics.scenarios) {
  console.error(`[benchmarks] Agent evaluation regression: ${agentSuite.metrics.casesPassed}/${agentSuite.metrics.scenarios} passed`);
  process.exitCode = 1;
}
for (const r of allResults.results) {
  if (r.error) {
    console.error(`[benchmarks] Suite failed: ${r.module}: ${r.error}`);
    process.exitCode = 1;
  }
}
