---
license: cc-by-4.0
language:
  - fr
  - en
tags:
  - multi-agent
  - finance
  - evaluation
  - orchestration
  - synthetic
  - meta
pretty_name: JYNTRA Agent Evaluation Scenarios
size_categories:
  - n<1K
task_categories:
  - text-generation
---

# JYNTRA Agent Evaluation Scenarios

Labeled decision scenarios for evaluating a **six-agent financial analysis
orchestrator**. The dataset is published by the JYNTRA AI project for
reproducible evaluation of agent contracts, risk vetoes and disagreement
handling.

> **This is a synthetic evaluation dataset, not market data.**
> It contains author-written scenario fixtures, not real prices, not real
> trades and not investment advice. It does **not** demonstrate trading
> profitability.

## Why this dataset exists

Most multi-agent demos are evaluated by reading the output and deciding that
it "looks good". This dataset replaces that with a fixed contract:

| Field | Meaning |
|---|---|
| `agent_fixtures` | The six agent responses replayed into the orchestrator |
| `expected.verdict` | The verdict the deterministic contract must produce (`BUY` / `SELL` / `NO_TRADE`) |
| `expected.riskVeto` | Whether the Risk Analyst veto must fire |
| `expected.minContradictions` | Minimum number of cross-agent contradictions the detector must surface |
| `expected.schemaValidAgents` | How many agent outputs satisfy the closed-vocabulary schema |
| `expected.success` | Whether the orchestration may report success |
| `cross_check` | Optional open-weight audit result and its severity |

Labels were defined **before** running the harness. The orchestrator never sees
`expected`.

## Files

```
data/scenarios.jsonl       9 labeled scenarios (one JSON object per line)
data/reference-results.csv Per-scenario outcome produced by the harness
data/metrics.json          Aggregate metrics and the replay caveat
```

## Reference metrics (replay mode)

Produced by `npx tsx benchmarks/agents.js` on the JYNTRA AI repository:

| Metric | Value |
|---|---|
| Scenarios | 9 |
| Verdict accuracy | 1.000 |
| Schema conformance | 1.000 |
| Risk-veto agreement | 1.000 |
| Contradiction agreement | 1.000 |
| Success agreement | 1.000 |
| Open-weight veto agreement | 1.000 |

These numbers measure **contract compliance of the orchestrator**, given the
fixtures. They say nothing about the quality of any language model on real
market data.

## Minimal usage

```python
import json

rows = [json.loads(line) for line in open("data/scenarios.jsonl")]
scenario = rows[0]

print(scenario["expected"]["verdict"])
print(scenario["agent_fixtures"]["risk"])
```

To reproduce the full evaluation, use the JYNTRA AI repository:

```bash
npm test
npm run bench
```

## Construction

- 9 scenarios covering: clean BUY, clean SELL, macro/technical conflict,
  R:R veto, explicit Risk rejection, red-team-driven NO_TRADE, neutral
  consensus, missing-agent failure, open-weight high-severity veto.
- Each scenario contains six agent fixtures and one expected outcome.
- The harness runs the **real** `MultiAgentOrchestrator` with a replay engine;
  no network calls and no model inference are involved.

## Limitations

- Synthetic fixtures; no statistical claim about predictive performance.
- French-language agent arguments; schema field names are English.
- Single-author labeling: no inter-annotator agreement.
- Does not cover execution slippage, fees, liquidity or live market regimes.
- The open-weight audit scenario is a replayed result, not a live inference.

## License

CC-BY-4.0. Attribution: RAMIELSON Geoffroy Judicaël — JYNTRA AI.

## Citation

```bibtex
@dataset{jyntra_agent_eval_2026,
  title  = {JYNTRA Agent Evaluation Scenarios},
  author = {Ramielson, Geoffroy Judica{\"e}l},
  year   = {2026},
  note   = {Synthetic labeled scenarios for multi-agent financial orchestration},
  url    = {https://github.com/rmjudicael/jyntra-ai---financial-market-intelligence-platform}
}
```
