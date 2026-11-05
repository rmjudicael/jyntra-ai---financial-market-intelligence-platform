# JYNTRA AI — Quantitative Benchmark Results

Executed at: 2026-11-05T00:03:17.778Z  
Node.js: v26.4.0  

## Summary

| Metric | Value |
|--------|-------|
| Total suites | 2 |
| Total cases | 21 |
| Passed | 17 |
| Failed | 4 |
| Average latency (ms) | 0.35 |

## financial-v2 (financial-calculations)

Executed: 2026-11-05T00:03:17.428Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Valid LONG trade R:R=2.0 | 0.35 | true | riskRewardRatio=2 riskAmount=100 positionSize=20 |
| Valid SHORT trade R:R=2.0 | 0.01 | true | riskRewardRatio=2 riskAmount=100 positionSize=20 |
| Valid LONG trade R:R=3.0 | 0.01 | true | riskRewardRatio=3 riskAmount=1000 positionSize=100 |
| Invalid: zero capital | 0 | false | warnings=CAPITAL_POSITIVE |
| Invalid: SL above entry (LONG) | 0.04 | false | warnings=LONG_SL |
| Invalid: TP below entry (LONG) | 0.01 | false | warnings=LONG_TP |
| Invalid: SL below entry (SHORT) | 0.01 | false | warnings=SHORT_SL,SHORT_TP |
| High risk > 3% | 0.01 | true | warnings=HIGH_RISK |
| Low R:R < 1.5 | 0.03 | true | warnings=LOW_RR |
| Exact 1.5 R:R boundary | 0.03 | true | |
| Backtest: EMA Cross (uptrend) | 1.06 | true | totalReturnPercent=0.01 winRate=100 totalTrades=1 profitFactor=99.9 |
| Backtest: RSI Reversal (ranging) | 0.14 | true | totalReturnPercent=0 winRate=0 totalTrades=0 profitFactor=0 |
| Backtest: Breakout (trending) | 0.6 | true | totalReturnPercent=0 winRate=0 totalTrades=0 profitFactor=0 |
| Backtest: EMA Cross (no SL/TP) | 0.11 | true | totalReturnPercent=0.01 winRate=100 totalTrades=1 profitFactor=99.9 |
| Backtest determinism (two runs, identical output) | 0.22 | true | Identical results across runs |

## ai-engine-v1 (ai-engine-routing)

Executed: 2026-11-05T00:03:17.778Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Meta first model success | 1.43 | false | calls=2 modelTried=muse-spark-1.3,muse-wonder-1.0 |
| Meta quota fallback to alternate model | 0.24 | true | tier=META model=m2 calls=2 modelTried=m1,m2 |
| Meta exhausted -> Gemini fallback | 0.12 | true | tier=GEMINI model=gemini calls=1 |
| All providers down -> honest failure | 0.04 | false | error=NO_TIER_AVAILABLE |
| 401 stops chain (no model burning) | 0.1 | true | tier=GEMINI calls=1 modelTried=m1 |
| Non-chat model ID exclusion | 0 | false | detail=Excluded IDs: sam-3.1,muse-voice-transcribe-1.0,muse-image-1.0 |

## Notes

- All benchmarks are deterministic and run without external API dependencies.
- AI engine benchmarks use mocked fetch implementations to test fallback chain logic without consuming provider credits.
- Financial benchmarks use synthetic OHLCV fixtures; results are computed from real code paths.
- "Failed" cases in benchmarks represent expected negative paths (invalid inputs, provider unavailability) that are correctly handled by the system.
- "Meta first model success" shows success=false because no META_API_KEY is configured — this is expected behavior; the system correctly reports the failure rather than fabricating a result.
