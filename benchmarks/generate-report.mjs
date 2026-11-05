import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const R = path.join('benchmarks','results');
const suites = [
  { name: 'financial', file: 'financial.js' },
  { name: 'ai-engine', file: 'ai-engine.js' },
];

const results = [];
for (const suite of suites) {
  const filePath = path.join('benchmarks', suite.file);
  try {
    const output = execFileSync(process.execPath, [filePath], { cwd: process.cwd(), encoding: 'utf8', timeout: 60000 });
    const parsed = JSON.parse(output.trim());
    results.push(parsed);
    console.log(`[benchmarks] Suite ${suite.name}: ${parsed.cases.length} cases, ${parsed.cases.filter(c=>c.success).length} passed`);
  } catch (err) {
    console.error(`[benchmarks] Suite ${suite.name} failed:`, err.message);
    results.push({ benchmarkId: suite.name, module: suite.name, error: err.message, cases: [] });
  }
}

const totalCases = results.reduce((a,r)=>a+r.cases.length,0);
const passedCases = results.reduce((a,r)=>a+r.cases.filter(c=>c.success).length,0);
const allLatencies = results.flatMap(r=>r.cases).filter(c=>c.latencyMs);
const avgLat = allLatencies.length ? Math.round((allLatencies.reduce((a,c)=>a+c.latencyMs,0)/allLatencies.length)*100)/100 : 0;

const all = {
  benchmarkSuite: 'JYNTRA AI Quantitative Benchmarks',
  executedAt: new Date().toISOString(),
  nodeVersion: process.version,
  results,
  summary: {
    totalSuites: results.length,
    totalCases,
    passedCases,
    failedCases: totalCases - passedCases,
    averageLatencyMs: avgLat,
  },
};

fs.writeFileSync(path.join(R,'results.json'), JSON.stringify(all,null,2));

// Markdown
const mdLines = [
  '# JYNTRA AI — Quantitative Benchmark Results',
  '',
  `Executed at: ${all.executedAt}`,
  `Node.js: ${all.nodeVersion}`,
  '',
  '## Summary',
  '',
  '| Metric | Value |',
  '|------|-------|',
  `| Total suites | ${all.summary.totalSuites} |`,
  `| Total cases | ${all.summary.totalCases} |`,
  `| Passed | ${all.summary.passedCases} |`,
  `| Failed | ${all.summary.failedCases} |`,
  `| Average latency (ms) | ${all.summary.averageLatencyMs} |`,
  '',
];
for (const r of all.results) {
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
fs.writeFileSync(path.join(R,'results.md'), mdLines.join('\n'));
console.log('Done. Summary:', JSON.stringify(all.summary));
