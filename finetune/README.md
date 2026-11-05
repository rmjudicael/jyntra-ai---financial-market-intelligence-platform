# JYNTRA fine-tuning pipeline — structured risk adapter

Status: **pipeline prepared, training not executed**. The measured hardware
(15.9 GB RAM, no GPU, 20.7 GB free disk, no C++ toolchain) cannot train an
admissible 30B open-weight model before the deadline. `docs/fine-tuning.md`
contains the full audit. No metric in this directory is a model result.

## Why this exists

JYNTRA already routes financial analysis through Meta models. This pipeline
prepares a small, local LoRA/QLoRA adapter that learns one narrow job:

> turn a trade plan into the strict risk JSON consumed by
> `src/server/fineTunedAdapter.ts`.

The adapter is an **explanation/audit layer**. It never overrides the Risk
Analyst veto and never replaces Muse Spark or Muse Wonder.

## Contents

| Path | Purpose |
|---|---|
| `data/generate.mjs` | deterministic generator for 90 synthetic fixtures (70/10/10) |
| `data/train.jsonl`, `validation.jsonl`, `test.jsonl` | labelled reference splits |
| `data/train.txt`, `validation.txt` | llama.cpp `<\|sft\|>` training blocks |
| `config/muse-glimmer-30b-qlora.env` | intended LoRA hyper-parameters and hardware envelope |
| `scripts/evaluate.mjs` | real before/after evaluator (JSON validity, stance accuracy, R:R MAE) |

## Reproduce the dataset

```bash
node finetune/data/generate.mjs finetune/data
```

The generator is seeded (`20261105`) and deterministic. Every row is marked
`synthetic: true` with a provenance string. It is arithmetic scaffolding, not
market data, and must never be presented as performance.

## Train (requires adequate GPU hardware)

```bash
# 1. Build llama.cpp with training examples, no Hugging Face involved.
git clone https://github.com/ggml-org/llama.cpp
cmake -S llama.cpp -B llama.cpp/build -DLLAMA_BUILD_EXAMPLES=ON -DGGML_CUDA=ON
cmake --build llama.cpp/build --config Release -j

# 2. Fetch a Meta open-weight GGUF from ModelScope (not Hugging Face).
curl -L -o Muse-Glimmer-30B-Q4_K_M.gguf \
  https://www.modelscope.cn/models/bartowski/Muse-Glimmer-30B-GGUF/resolve/master/Muse-Glimmer-30B-Q4_K_M.gguf

# 3. Train the LoRA adapter.
./llama.cpp/build/bin/llama-finetune \
  -m Muse-Glimmer-30B-Q4_K_M.gguf \
  -f finetune/data/train.txt \
  --sample-start '<|sft|>' \
  -c 512 -b 1 -ub 1 -t 8 \
  --adam-iter 240 \
  --lora-out finetune/adapters/jyntra-risk-muse-glimmer-30b-lora-v1.bin
```

## Evaluate (real outputs only)

Produce one prediction line per test id:

```json
{"id":"jyntra-risk-081","output":{"stance":"CAUTION","riskRewardRatio":1.6,"primaryRisk":"...","invalidation":"...","explanation":"..."}}
```

Then:

```bash
node finetune/scripts/evaluate.mjs \
  --references finetune/data/test.jsonl \
  --predictions finetune/out/test-predictions.jsonl \
  --out finetune/out/metrics.json
```

The evaluator reports coverage, schema-valid rate, field coverage, stance
accuracy, rejected recall and R:R mean absolute error. It never fabricates a
prediction; missing files exit non-zero.

## Serve the adapter to JYNTRA

```bash
./llama.cpp/build/bin/llama-server \
  -m Muse-Glimmer-30B-Q4_K_M.gguf \
  --lora finetune/adapters/jyntra-risk-muse-glimmer-30b-lora-v1.bin \
  --host 127.0.0.1 --port 8080
```

```env
JYNTRA_FINETUNED_BASE_URL=http://127.0.0.1:8080/v1
JYNTRA_FINETUNED_MODEL_ID=jyntra-risk-lora
JYNTRA_FINETUNED_ADAPTER_ID=jyntra-risk-muse-glimmer-30b-lora-v1
JYNTRA_FINETUNED_BASE_MODEL=Muse-Glimmer-30B
```

`GET /api/ai/fine-tuned/status` then reports `READY`; without an adapter it
reports `FINETUNED_NOT_CONFIGURED`, never a simulated success.

## Honest result table

| Item | Status |
|---|---|
| Dataset generated | yes (90 synthetic fixtures) |
| Training executed | **no** |
| Adapter artefact | **none** |
| Before/after metrics | **none** |
| Runtime integration | yes (`src/server/fineTunedAdapter.ts`) |
| Reason | hardware + toolchain + deadline |
