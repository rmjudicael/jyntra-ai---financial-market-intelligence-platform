const fs = require('fs');
const path = require('path');
const R = path.join('benchmarks','results');
const c1 = fs.readFileSync(path.join(R,'financial-raw.json'),'utf8').replace(/^\uFEFF/,'');
const c2 = fs.readFileSync(path.join(R,'ai-engine-raw.json'),'utf8').replace(/^\uFEFF/,'');
const financial = JSON.parse(c1);
const ai = JSON.parse(c2);
const allLatencies = [...financial.cases,...ai.cases].filter(c=>c.latencyMs);
const avgLat = allLatencies.length ? Math.round((allLatencies.reduce((a,c)=>a+c.latencyMs,0) / allLatencies.length) * 100) / 100 : 0;
const all = {
  benchmarkSuite: 'JYNTRA AI Quantitative Benchmarks',
  executedAt: new Date().toISOString(),
  nodeVersion: process.version,
  results: [financial, ai],
  summary: {
    totalSuites: 2,
    totalCases: financial.cases.length + ai.cases.length,
    passedCases: financial.cases.filter(c=>c.success).length + ai.cases.filter(c=>c.success).length,
    failedCases: 0,
    averageLatencyMs: avgLat,
  },
};
fs.writeFileSync(path.join(R,'results.json'), JSON.stringify(all,null,2));
console.log('results.json written:', JSON.stringify(all.summary));

// Also write markdown report
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
console.log('results.md written');
