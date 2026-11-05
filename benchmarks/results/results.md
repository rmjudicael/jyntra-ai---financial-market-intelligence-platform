# JYNTRA AI — Quantitative Benchmark Results

Executed at: 2026-11-05T01:13:25.436Z
Node.js: v26.4.0

## Summary

| Metric | Value |
|------|-------|
| Total suites | 3 |
| Total cases | 30 |
| Passed | 30 |
| Failed | 0 |
| Average latency (ms) | 0.3 |

## financial-v2 (financial-calculations)

Executed: 2026-11-05T01:13:25.740Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Valid LONG trade R:R=2.0 | 0.25 | false |  |
| Valid SHORT trade R:R=2.0 | 0.01 | false |  |
| Valid LONG trade R:R=3.0 | 0.01 | false |  |
| Invalid: zero capital | 0 | false |  |
| Invalid: SL above entry (LONG) | 0.04 | false |  |
| Invalid: TP below entry (LONG) | 0.01 | false |  |
| Invalid: SL below entry (SHORT) | 0.01 | false |  |
| High risk > 3% | 0.01 | false |  |
| Low R:R < 1.5 | 0.02 | false |  |
| Exact 1.5 R:R boundary | 0.04 | false |  |
| Backtest: EMA Cross (uptrend) | 0.87 | true |  |
| Backtest: RSI Reversal (ranging) | 0.14 | true |  |
| Backtest: Breakout (trending) | 0.6 | true |  |
| Backtest: EMA Cross (no SL/TP) | 0.1 | true |  |
| Backtest determinism (two runs, identical output) | 0.17 | true | Identical results across runs |

## ai-engine-v1 (ai-engine-routing)

Executed: 2026-11-05T01:13:26.231Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Meta first model success | 1.32 | true | muse-spark-1.3 |
| Meta quota fallback to alternate model | 0.27 | true | m2 |
| Meta exhausted -> Gemini fallback | 0.28 | true | gemini |
| All providers down -> honest failure | 0.06 | false | NO_TIER_AVAILABLE |
| 401 stops chain (no model burning) | 0.16 | true | GEMINI |
| Non-chat model ID exclusion | 0 | true | Excluded IDs: sam-3.1, muse-voice-transcribe-1.0, muse-image-1.0 |

## agent-orchestration-v1 (multi-agent-orchestration)

Executed: 2026-11-05T01:13:26.485Z
Mode: **replay** — model outputs are labeled fixtures, not live calls

### Metrics

| Metric | Value |
|------|-------|
| mode | replay |
| datasetId | jyntra-agent-scenarios |
| datasetVersion | 1.0.0 |
| scenarios | 9 |
| verdictAccuracy | 1 |
| schemaConformance | 1 |
| riskVetoAgreement | 1 |
| contradictionAgreement | 1 |
| successAgreement | 1 |
| openWeightVetoAgreement | 1 |
| casesPassed | 9 |
| meanLatencyMs | 0.44 |
| totalModelCalls | 55 |
| note | Replay mode: model outputs are labeled fixtures. Measures orchestration contract and determinism, not trading profitability. |

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| clean-buy | 2.97 | true |  |
| clean-sell | 0.27 | true |  |
| macro-conflict | 0.1 | true |  |
| rr-veto | 0.09 | true |  |
| risk-rejected | 0.08 | true |  |
| redteam-no-trade | 0.07 | true |  |
| neutral-consensus | 0.06 | true |  |
| missing-agent | 0.07 | true |  |
| openweight-veto | 0.25 | true |  |
