# Fine-tuning feasibility — Meta open-weight models

Status: **not executed**. This document records the real hardware and model
audit performed on 2026-11-05, the reproducible path that was prepared, and
the exact reason training could not run before the submission freeze. No
training metric, adapter file or evaluation result is claimed.

## 1. Hardware audit (measured)

| Resource | Measured value |
|---|---|
| CPU | Intel Core i5-4670, 4 cores / 4 threads |
| RAM | 15.9 GB |
| GPU | none (`nvidia-smi` absent) |
| Free disk (C:) | 20.7 GB |
| PyTorch | 2.15.0+cpu, `cuda=False` |
| C/C++ toolchain | no `cl.exe`, `gcc`, `clang++`, `cmake`, `ninja` |

## 2. Candidate models (real sizes, ModelScope mirror)

| Model | Role | Size | Local verdict |
|---|---|---|---|
| `meta-models/Muse-Glimmer-30B` | admissible 30B dense | BF16 ~58 GB | cannot download or train |
| `bartowski/Muse-Glimmer-30B-GGUF` Q2_K | 30B quantised | 11.0 GB | fits disk, not trainable on 4 CPU cores in the window |
| `bartowski/Muse-Glimmer-30B-GGUF` Q4_K_M | 30B quantised | 17.3 GB | exceeds free disk |
| `meta-models/Muse-Spark-Open-816B` | admissible 816B MoE | BF16 / NVFP4 | needs a multi-GPU node; impossible locally |

These are download sizes, not training requirements. LoRA/QLoRA training keeps
the base weights plus activations, gradients and optimiser state; a 30B model
does not fit in 15.9 GB of RAM even at 2-bit, and a 4-core CPU cannot complete a
useful epoch in the available window.

## 3. What was actually verified

- ModelScope (non-Hugging-Face) serves the Muse Glimmer GGUF files and a
  Meta Llama 3.2 1B GGUF; no Hugging Face account, token, Hub or API is used.
- A Meta Llama 3.2 1B F16 GGUF download was started from ModelScope
  (`unsloth/Llama-3.2-1B-Instruct-GGUF`, 2.48 GB) and reached 391 MB before it
  was stopped: at the observed throughput the download alone would not finish
  before the freeze.
- The prebuilt llama.cpp Windows CPU release `b12123` was inspected. It ships
  inference, quantisation and server binaries, but **not** `llama-finetune`;
  training requires a local build with CMake and a C++ compiler, neither of
  which is installed.
- The runtime integration is implemented and merged in PR #3:
  `src/server/fineTunedAdapter.ts` plus `GET /api/ai/fine-tuned/status`.
  It stays disabled and reports `FINETUNED_NOT_CONFIGURED` until a real
  adapter is served.

## 4. Reproducible path for a GPU host

The following commands are the intended pipeline. They were **not** executed
here; they are provided so the work can be reproduced on adequate hardware.
They deliberately avoid Hugging Face.

```bash
# 1. Build llama.cpp with the training example (CPU or CUDA).
git clone https://github.com/ggml-org/llama.cpp
cmake -S llama.cpp -B llama.cpp/build -DLLAMA_BUILD_EXAMPLES=ON -DGGML_CUDA=ON
cmake --build llama.cpp/build --config Release -j

# 2. Fetch the base checkpoint from ModelScope (not Hugging Face).
curl -L -o Muse-Glimmer-30B-Q2_K.gguf \
  https://www.modelscope.cn/models/bartowski/Muse-Glimmer-30B-GGUF/resolve/master/Muse-Glimmer-30B-Q2_K.gguf

# 3. Fine-tune a LoRA adapter on the JYNTRA structured-risk dataset.
#    train.txt uses one <|sft|> block per example, one JSON-derived
#    instruction/response pair per block.
./llama.cpp/build/bin/llama-finetune \
  -m Muse-Glimmer-30B-Q2_K.gguf \
  -f finetune/data/train.txt \
  --sample-start '<|sft|>' \
  -c 512 -b 1 -ub 1 -t 8 \
  --adam-iter 120 \
  --lora-out finetune/adapters/jyntra-risk-lora-v1.bin

# 4. Evaluate base vs adapter on the held-out split.
./llama.cpp/build/bin/llama-cli -m Muse-Glimmer-30B-Q2_K.gguf \
  --lora finetune/adapters/jyntra-risk-lora-v1.bin \
  -f finetune/data/test.txt -n 256 --temp 0

# 5. Serve the adapter to JYNTRA AI.
./llama.cpp/build/bin/llama-server -m Muse-Glimmer-30B-Q2_K.gguf \
  --lora finetune/adapters/jyntra-risk-lora-v1.bin \
  --host 127.0.0.1 --port 8080
```

Then set:

```env
JYNTRA_FINETUNED_BASE_URL=http://127.0.0.1:8080/v1
JYNTRA_FINETUNED_MODEL_ID=jyntra-risk-lora
JYNTRA_FINETUNED_ADAPTER_ID=jyntra-risk-muse-glimmer-30b-lora-v1
JYNTRA_FINETUNED_BASE_MODEL=Muse-Glimmer-30B
```

## 5. Dataset contract (prepared, not generated as a claim of quality)

Each example is a JSON object with:

| Field | Type | Rule |
|---|---|---|
| `id` | string | stable fixture id |
| `symbol` | string | instrument label |
| `entry` | number | positive |
| `stopLoss` | number | positive, coherent with direction |
| `takeProfit1` | number | positive |
| `riskRewardRatio` | number | computed from the three prices |
| `stance` | string | `APPROVED`, `CAUTION` or `REJECTED` |
| `primaryRisk` | string | factual, no price prediction |
| `invalidation` | string | level that invalidates the setup |
| `explanation` | string | max 400 characters, no profit promise |

The data is synthetic and must be labelled as such. It is not market data and
must never be presented as realised performance.

## 6. Honest scoring position

| Criterion | Claim |
|---|---|
| Fine-tuning executed | **No** |
| Adapter produced | **No** |
| Before/after metrics | **None** |
| Runtime integration ready | **Yes** (PR #3) |
| Reproducible commands documented | **Yes** (this file) |
| Reason for the gap | 15.9 GB RAM, no GPU, no C++ toolchain, 20.7 GB free disk, and a hard freeze |

Claiming the +0.5 fine-tuning bonus without a trained adapter would be false.
The correct submission position is zero points on that bonus, with the runtime
and reproduction path documented for a future run.
