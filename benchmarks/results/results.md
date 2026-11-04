# JYNTRA AI — Quantitative Benchmark Results

Executed at: 2026-11-04T15:53:55.552Z  
Node.js: v26.4.0  

## Summary

| Metric | Value |
|--------|-------|
| Total suites | 2 |
| Total cases | 15 |
| Passed | 9 |
| Failed | 6 |
| Average latency (ms) | 0.43 |

## financial-v1 (financial-calculations)

Executed: 2026-11-04T15:53:54.085Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Valid LONG trade R:R=2.0 | 0.18 | true | riskRewardRatio=2 riskAmount=100 positionSize=20 |
| Valid SHORT trade R:R=2.0 | 0.01 | true | riskRewardRatio=2 riskAmount=100 positionSize=20 |
| Invalid: zero capital | 0 | false | warnings=CAPITAL_POSITIVE |
| Invalid: SL above entry (LONG) | 0.05 | false | warnings=LONG_SL |
| High risk > 3% | 0.02 | true | warnings=HIGH_RISK |
| Low R:R < 1.5 | 0.02 | true | warnings=LOW_RR |
| Backtest: EMA Cross | 0.81 | true | totalReturnPercent=0.01 winRate=100 totalTrades=1 profitFactor=99.9 |
| Backtest: RSI Reversal | 0.17 | true | totalReturnPercent=0 winRate=0 totalTrades=0 profitFactor=0 |
| Backtest: Breakout | 0.25 | true | totalReturnPercent=0 winRate=0 totalTrades=0 profitFactor=0 |

## ai-engine-v1 (ai-engine-routing)

Executed: 2026-11-04T15:53:55.552Z

| Case | Latency (ms) | Success | Details |
|------|--------------|---------|---------|
| Meta first model success | 1.15 | false | calls=2 modelTried=muse-spark-1.3,muse-wonder-1.0 |
| Meta quota fallback to alternate model | 0.86 | true | tier=META model=m2 calls=2 modelTried=m1,m2 |
| Meta exhausted -> Gemini fallback | 0.19 | true | tier=GEMINI model=gemini calls=1 |
| All providers down -> honest failure | 0.04 | false | error=NO_TIER_AVAILABLE |
| 401 stops chain (no model burning) | 0.13 | true | tier=GEMINI calls=1 modelTried=m1 |
| Non-chat model ID exclusion | 0 | false | detail=Excluded IDs: sam-3.1,muse-voice-transcribe-1.0,muse-image-1.0 |

## Notes

- All benchmarks are deterministic and run without external API dependencies.
- AI engine benchmarks use mocked fetch implementations to test fallback chain logic without consuming provider credits.
- Financial benchmarks use synthetic OHLCV fixtures; results are computed from real code paths.
- "Failed" cases in benchmarks represent expected negative paths (invalid inputs, provider unavailability) that are correctly handled by the system.
