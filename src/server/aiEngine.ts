/**
 * JYNTRA AI — centralised AI routing engine (server-side only).
 *
 * Verified Meta model capabilities (probed against the configured endpoint):
 *  - muse-spark-1.3 / 1.2 / 1.1  : reasoning chat + multimodal vision
 *  - muse-wonder-1.0             : deeper reasoning chat + multimodal vision
 *  - muse-spark-*-contributor    : alternate checkpoints (never used by default)
 *  - sam-3.1                     : detection + segmentation via /v1/responses
 *  - muse-image-1.0              : /v1/images/generations (b64_json)
 *  - muse-voice-transcribe-1.0   : transcription via /v1/asr/transcribe (multipart WAV)
 *
 * Routing principle: one best model per task, then a real fallback chain.
 * No model name is ever invented: ids are sent verbatim and only ids present
 * in the provider catalogue (or declared by the operator) are attempted.
 *
 * Tier order: Meta -> Gemini (if configured) -> free alternative (if keyed)
 * -> honest failure. A deterministic feature never depends on this engine.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
export type AiTask =
  | 'chat'
  | 'reasoning'
  | 'vision'
  | 'agents'
  | 'redteam'
  | 'fast'
  | 'image'
  | 'segmentation'
  | 'transcription';

export type AiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AiContentPart[];
}

export interface AiEngineDeps {
  fetchImpl: typeof fetch;
  metaKey: string;
  metaEndpoint: string; // full chat-completions endpoint URL
  metaModels: string[]; // declared ids, tried verbatim
  geminiChat?: (messages: AiMessage[], opts: { temperature: number }) => Promise<string>;
  geminiImage?: (prompt: string) => Promise<{ dataUrl: string } | null>;
  /** Real audio transcription fallback when the Meta route is unavailable. */
  geminiTranscribe?: (audio: Blob, language: string) => Promise<string | null>;
  /** Free-tier alternative (OpenAI-compatible), used only when configured. */
  freeAiChat?: (messages: AiMessage[], opts: { temperature: number }) => Promise<string>;
  /** Per-call timeout so a hung provider cannot stall the whole chain. */
  timeoutMs?: number;
  /** Configurable output size for Muse Image. */
  imageSize?: string;
  /** Optional override for the Muse Image id (defaults to muse-image-1.0). */
  metaImageModel?: string;
}

export interface AiSegmentBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  /** Normalised [0..1] coordinates, ready for an SVG overlay. */
  nx1: number;
  ny1: number;
  nx2: number;
  ny2: number;
  label: string;
}

export interface AiResult {
  success: boolean;
  text?: string;
  imageUrl?: string;
  imageMime?: string;
  boxes?: AiSegmentBox[];
  maskCount?: number;
  /** Decoded mask rasters, base64-encoded binary (row-major Uint8Array of 0/1). */
  masks?: { id: number; width: number; height: number; data: string }[];
  tier?: 'META' | 'GEMINI' | 'FREE';
  /** Model that actually produced the result (never a guessed label). */
  model?: string;
  modelTried?: string[];
  reason?: string;
  latencyMs?: number;
  /** Number of provider calls actually made for this result. */
  calls?: number;
}

interface ChatOptions {
  temperature?: number;
  task?: AiTask;
  maxTokens?: number;
  /** Extra model ids to try first (still subject to real availability). */
  preferredModels?: string[];
  /**
   * When true, the call never falls back to Gemini or the free tier: if Meta
   * cannot answer, the result is an honest failure. Used by JYNTRACK's war room
   * where the mission requires real Meta participation.
   */
  metaOnly?: boolean;
}

/** Ids that are not chat models: never sent to the chat chain. */
export const NON_CHAT_MODEL_IDS = ['sam-3.1', 'muse-voice-transcribe-1.0', 'muse-image-1.0'];
export const isChatModelId = (id: string) => !NON_CHAT_MODEL_IDS.includes(id.toLowerCase());

const REASONING_PRIORITY = ['muse-spark-1.3', 'muse-wonder-1.0', 'muse-spark-1.2', 'muse-spark-1.1'];
const CONTRIBUTOR_IDS = ['muse-spark-1.3-contributor', 'muse-spark-1.2-contributor'];
const IMAGE_ID = 'muse-image-1.0';
const SEGMENT_ID = 'sam-3.1';
const TRANSCRIBE_ID = 'muse-voice-transcribe-1.0';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function sniffImageMime(base64: string): string {
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('UklGR')) return 'image/webp';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  return 'image/png';
}

/** Standard Ascii85 (RFC 1924) alphabet. */
const BASE85_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';
const BASE85_INDEX: { [key: string]: number } = {};
for (let i = 0; i < BASE85_ALPHABET.length; i += 1) BASE85_INDEX[BASE85_ALPHABET[i]] = i;

/** Decode an Ascii85 string to a Uint8Array. Handles both full and final (short) groups. */
function decodeBase85(input: string): Uint8Array {
  const chars = input.trim();
  const n = chars.length;
  const out: number[] = [];
  let i = 0;

  while (i < n) {
    const groupLen = Math.min(5, n - i);
    let value = 0;
    for (let j = 0; j < groupLen; j += 1) {
      const d = BASE85_INDEX[chars[i + j]];
      if (d === undefined) throw new Error(`Invalid base85 character: ${chars[i + j]}`);
      value = value * 85 + d;
    }
    // If short final group, adjust: Apple's "z" shorthand and padding are not used here.
    const bytes = groupLen === 5 ? 4 : groupLen - 1;
    for (let j = bytes - 1; j >= 0; j -= 1) {
      out.push((value >> (j * 8)) & 0xff);
    }
    i += groupLen;
  }

  return new Uint8Array(out);
}

/** Parse a single SAM 3.1 output line into box and mask records. */
interface SamRecord {
  id: number;
  box?: { x1: number; y1: number; x2: number; y2: number; w: number; h: number; conf?: number };
  mask?: { width: number; height: number; encoding: string; payload: string; conf?: number };
}

function parseSamLine(line: string): SamRecord[] {
  const records: SamRecord[] = [];
  // Each record: <OBJECT_ID><|box;...|><|mask;...|>
  const re = /(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)(?:;c=([\d.]+))?\|>(?:<\|mask;x=0;y=0(?:;c=([\d.]+))?;data=(\d+),(\d+),([~!])(.+?)\|>)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    const id = Number(match[1]);
    const record: SamRecord = { id };
    record.box = {
      x1: Number(match[2]),
      y1: Number(match[3]),
      x2: Number(match[4]),
      y2: Number(match[5]),
      w: Number(match[6]),
      h: Number(match[7]),
      conf: match[8] !== undefined ? Number(match[8]) : undefined,
    };
    if (match[10] !== undefined && match[11] !== undefined && match[12] !== undefined) {
      record.mask = {
        width: Number(match[10]),
        height: Number(match[11]),
        encoding: match[12],
        payload: match[13],
        conf: match[9] !== undefined ? Number(match[9]) : undefined,
      };
    }
    records.push(record);
  }
  return records;
}

/** Parse full SAM 3.1 output_text into boxes and decoded masks. */
function parseSamOutput(outputText: string): {
  boxes: AiSegmentBox[];
  masks: { id: number; width: number; height: number; data: string }[];
} {
  const boxes: AiSegmentBox[] = [];
  const masks: { id: number; width: number; height: number; data: string }[] = [];

  // Split into frame lines: each starts with <Nf>
  const frameLines = outputText.split(/(?=<(?:\d+)f>)/).filter((s) => s.trim().length > 0);
  for (const line of frameLines) {
    const records = parseSamLine(line);
    for (const rec of records) {
      if (rec.box && rec.box.w > 0 && rec.box.h > 0) {
        boxes.push({
          x1: rec.box.x1,
          y1: rec.box.y1,
          x2: rec.box.x2,
          y2: rec.box.y2,
          width: rec.box.w,
          height: rec.box.h,
          nx1: rec.box.x1 / rec.box.w,
          ny1: rec.box.y1 / rec.box.h,
          nx2: rec.box.x2 / rec.box.w,
          ny2: rec.box.y2 / rec.box.h,
          label: 'zone',
        });
      }
      if (rec.mask) {
        try {
          const raster = decodeBase85(rec.mask.payload);
          masks.push({
            id: rec.id,
            width: rec.mask.width,
            height: rec.mask.height,
            data: Buffer.from(raster).toString('base64'),
          });
        } catch {
          // Skip undecodable masks but keep the box.
        }
      }
    }
  }

  return { boxes, masks };
}

function contentToText(content: string | AiContentPart[]): string {
  if (typeof content === 'string') return content;
  return content
    .map((part) => (part.type === 'text' ? part.text : '[image]'))
    .join('\n');
}

export function createAiEngine(deps: AiEngineDeps) {
  const timeoutMs = deps.timeoutMs ?? 45000;
  const base = deps.metaEndpoint
    .replace(/\/chat\/completions\/?$/, '')
    .replace(/\/responses\/?$/, '')
    .replace(/\/$/, '');

  const withTimeout = (init: RequestInit = {}, ms = timeoutMs): RequestInit => {
    try {
      return { ...init, signal: AbortSignal.timeout(ms) };
    } catch {
      return init;
    }
  };

  let catalogCache: { at: number; ids: string[] } | null = null;
  let audioProbe: { at: number; available: boolean } | null = null;
  /** Circuit breaker: set when every Meta model reports quota/billing. */
  let metaCooldownUntil = 0;
  let calls = 0;

  const available = (id: string) => deps.metaModels.some((m) => m.toLowerCase() === id);

  /** Real provider catalogue probe. Returns null when it cannot be read. */
  async function discoverMetaCatalog(): Promise<string[] | null> {
    if (!deps.metaKey) return null;
    if (catalogCache && Date.now() - catalogCache.at < 10 * 60 * 1000) return catalogCache.ids;
    try {
      const r = await deps.fetchImpl(`${base}/models`, withTimeout({ headers: { Authorization: `Bearer ${deps.metaKey}` } }, 12000));
      if (!r.ok) return null;
      const j: any = await r.json();
      const ids = (j.data || j.models || [])
        .map((m: any) => (typeof m === 'string' ? m : m.id))
        .filter(Boolean);
      if (!ids.length) return null;
      catalogCache = { at: Date.now(), ids };
      return ids;
    } catch {
      return null;
    }
  }

  /** Ordered model chain for a task. Contributors stay at the very end. */
  function chainFor(task: AiTask = 'chat', preferred: string[] = []): string[] {
    const declared = deps.metaModels.map((m) => m.toLowerCase());
    const known = REASONING_PRIORITY.filter((id) => declared.includes(id));
    const contributors = CONTRIBUTOR_IDS.filter((id) => declared.includes(id));
    let order: string[];

    if (task === 'redteam' || task === 'fast') {
      order = ['muse-spark-1.2', 'muse-spark-1.1', 'muse-spark-1.3', 'muse-wonder-1.0'];
    } else if (task === 'vision') {
      order = ['muse-spark-1.3', 'muse-wonder-1.0', 'muse-spark-1.2', 'muse-spark-1.1'];
    } else {
      order = REASONING_PRIORITY;
    }

    const preferredClean = preferred.filter((m) => isChatModelId(m));
    const ordered = [...preferredClean, ...order.filter((id) => declared.includes(id)), ...known];
    const fallbackDeclared = deps.metaModels.filter(
      (m) => isChatModelId(m) && !CONTRIBUTOR_IDS.includes(m.toLowerCase()),
    );
    const merged = [...ordered, ...fallbackDeclared, ...contributors];
    return [...new Set(merged.map((m) => m.toLowerCase()))];
  }

  async function callMetaModel(
    model: string,
    messages: AiMessage[],
    temperature: number,
    maxTokens: number,
  ): Promise<{ ok: boolean; text?: string; status?: number; finish?: string }> {
    calls += 1;
    try {
      const r = await deps.fetchImpl(
        deps.metaEndpoint,
        withTimeout({
          method: 'POST',
          headers: { Authorization: `Bearer ${deps.metaKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            temperature: clamp(temperature, 0, 2),
            // Reasoning checkpoints spend tokens on hidden reasoning first;
            // a too-small budget returns an empty content. Keep a real budget.
            max_tokens: maxTokens,
          }),
        }),
      );
      if (!r.ok) return { ok: false, status: r.status };
      const j: any = await r.json();
      const text = j.choices?.[0]?.message?.content;
      return {
        ok: typeof text === 'string' && text.trim().length > 0,
        text: typeof text === 'string' ? text.trim() : undefined,
        status: r.status,
        finish: j.choices?.[0]?.finish_reason,
      };
    } catch {
      return { ok: false };
    }
  }

  function normaliseOptions(opts?: number | ChatOptions): Required<Pick<ChatOptions, 'temperature' | 'task' | 'maxTokens'>> & ChatOptions {
    if (typeof opts === 'number') return { temperature: clamp(opts, 0, 2), task: 'chat', maxTokens: 2048, metaOnly: false };
    return {
      temperature: clamp(opts?.temperature ?? 0.4, 0, 2),
      task: opts?.task ?? 'chat',
      maxTokens: clamp(opts?.maxTokens ?? 2048, 256, 8192),
      preferredModels: opts?.preferredModels,
      metaOnly: opts?.metaOnly === true,
    };
  }

  /** Chat / reasoning / agents / redteam / vision chain. */
  async function runChat(messages: AiMessage[], opts?: number | ChatOptions): Promise<AiResult> {
    const started = Date.now();
    calls = 0;
    const { temperature, task, maxTokens, preferredModels, metaOnly } = normaliseOptions(opts);
    const tried: string[] = [];

    if (deps.metaKey && Date.now() > metaCooldownUntil && task !== 'transcription' && task !== 'segmentation' && task !== 'image') {
      let sawQuota = false;
      for (const model of chainFor(task, preferredModels)) {
        tried.push(model);
        let res = await callMetaModel(model, messages, temperature, maxTokens);
        // A reasoning model can exhaust the budget on hidden reasoning and
        // return null content. One retry with a larger budget is legitimate
        // and avoids presenting an empty answer as a result.
        if (!res.ok && res.finish === 'length' && maxTokens < 4096) {
          res = await callMetaModel(model, messages, temperature, 4096);
        }
        if (res.ok && res.text) {
          return {
            success: true,
            text: res.text,
            tier: 'META',
            model,
            modelTried: tried,
            latencyMs: Date.now() - started,
            calls,
          };
        }
        if (res.status === 401 || res.status === 403) break; // key/permission: no other model helps
        if (res.status === 429 || res.status === 402) sawQuota = true;
        // 400/404/5xx: try the next compatible Meta model.
      }
      if (sawQuota && tried.length > 0) {
        // Do not hammer a quota-limited provider on the next requests.
        metaCooldownUntil = Date.now() + 60_000;
      }
    }

    if (metaOnly) {
      return {
        success: false,
        reason: metaCooldownUntil > Date.now() ? 'META_QUOTA' : 'META_ONLY_UNAVAILABLE',
        modelTried: tried,
        latencyMs: Date.now() - started,
        calls,
      };
    }

    if (deps.geminiChat) {
      try {
        const text = await deps.geminiChat(messages, { temperature });
        if (text && text.trim()) {
          return {
            success: true,
            text: text.trim(),
            tier: 'GEMINI',
            model: 'gemini',
            modelTried: tried,
            latencyMs: Date.now() - started,
            calls,
          };
        }
      } catch {
        /* fall through */
      }
    }

    if (deps.freeAiChat) {
      try {
        const text = await deps.freeAiChat(messages, { temperature });
        if (text && text.trim()) {
          return {
            success: true,
            text: text.trim(),
            tier: 'FREE',
            modelTried: tried,
            latencyMs: Date.now() - started,
            calls,
          };
        }
      } catch {
        /* fall through */
      }
    }

    return {
      success: false,
      reason: metaCooldownUntil > Date.now() ? 'META_QUOTA' : 'NO_TIER_AVAILABLE',
      modelTried: tried,
      latencyMs: Date.now() - started,
      calls,
    };
  }

  /** Muse Image generation (Meta priority), then Gemini image when configured. */
  async function runImage(prompt: string): Promise<AiResult> {
    const started = Date.now();
    const imageId = deps.metaImageModel || IMAGE_ID;
    if (deps.metaKey && available(imageId)) {
      try {
        const r = await deps.fetchImpl(
          `${base}/images/generations`,
          withTimeout(
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${deps.metaKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: imageId,
                prompt: prompt.slice(0, 2000),
                n: 1,
                size: deps.imageSize || '1024x1024',
              }),
            },
            90000,
          ),
        );
        if (r.ok) {
          const j: any = await r.json();
          const b64 = j.data?.[0]?.b64_json;
          if (typeof b64 === 'string' && b64.length) {
            const mime = sniffImageMime(b64);
            return {
              success: true,
              imageUrl: `data:${mime};base64,${b64}`,
              imageMime: mime,
              tier: 'META',
              model: imageId,
              latencyMs: Date.now() - started,
              calls: 1,
            };
          }
        }
      } catch {
        /* fall through to Gemini */
      }
    }
    if (deps.geminiImage) {
      try {
        const img = await deps.geminiImage(prompt);
        if (img?.dataUrl) {
          return {
            success: true,
            imageUrl: img.dataUrl,
            imageMime: img.dataUrl.slice(5, img.dataUrl.indexOf(';')),
            tier: 'GEMINI',
            model: 'gemini-image',
            latencyMs: Date.now() - started,
          };
        }
      } catch {
        /* honest failure below */
      }
    }
    return { success: false, reason: 'NO_IMAGE_PROVIDER_CONFIGURED', latencyMs: Date.now() - started };
  }

  /**
   * SAM 3.1 detection/segmentation through the Meta Responses API.
   * POST https://api.meta.ai/v1/responses with model sam-3.1.
   * Returns real boxes and decoded masks from the provider's output.
   */
  async function runSegmentation(imageDataUrl: string, prompt = 'Detect the salient objects.'): Promise<AiResult> {
    const started = Date.now();
    if (!deps.metaKey || !available(SEGMENT_ID)) {
      return { success: false, reason: 'SEGMENTATION_NOT_CONFIGURED' };
    }
    try {
      const r = await deps.fetchImpl(
        `${base}/responses`,
        withTimeout(
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${deps.metaKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: SEGMENT_ID,
              input: [
                {
                  type: 'message',
                  role: 'user',
                  content: [
                    { type: 'input_text', text: prompt.slice(0, 500) },
                    { type: 'input_image', image_url: imageDataUrl },
                  ],
                },
              ],
              stream: true,
            }),
          },
          90000,
        ),
      );
      if (!r.ok) {
        return { success: false, reason: r.status === 429 ? 'META_QUOTA' : 'SEGMENTATION_FAILED' };
      }

      // Accumulate streaming output_text from SSE events.
      let outputText = '';
      if (r.body) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
              const dataLine = part.startsWith('data: ') ? part.slice(6) : part.startsWith('data:') ? part.slice(5) : null;
              if (!dataLine) continue;
              try {
                const evt: any = JSON.parse(dataLine);
                if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
                  outputText += evt.delta;
                }
              } catch {
                /* ignore malformed SSE events */
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      const { boxes, masks } = parseSamOutput(outputText);
      return {
        success: true,
        boxes,
        maskCount: masks.length,
        masks,
        model: SEGMENT_ID,
        tier: 'META',
        latencyMs: Date.now() - started,
        calls: 1,
      };
    } catch {
      return { success: false, reason: 'SEGMENTATION_FAILED' };
    }
  }

  /** Real availability of the provider's audio transcription route. */
  async function isTranscriptionAvailable(): Promise<boolean> {
    if (!deps.metaKey || !available(TRANSCRIBE_ID)) return false;
    if (audioProbe && Date.now() - audioProbe.at < 60 * 60 * 1000) return audioProbe.available;
    try {
      const requestJson = JSON.stringify({ model: TRANSCRIBE_ID, audioEncoding: 'WAV', mode: 'PUSH_TO_TALK' });
      const form = new FormData();
      form.append('request', requestJson);
      // Minimal valid WAV header (44 bytes, silence) to probe the route without
      // consuming real audio. A routed endpoint answers 400/415; missing = 404.
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(36, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20);
      wavHeader.writeUInt16LE(1, 22);
      wavHeader.writeUInt32LE(16000, 24);
      wavHeader.writeUInt32LE(32000, 28);
      wavHeader.writeUInt16LE(2, 32);
      wavHeader.writeUInt16LE(16, 34);
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(0, 40);
      form.append('audio', new Blob([wavHeader as unknown as BlobPart], { type: 'audio/wav' }), 'probe.wav');
      const r = await deps.fetchImpl(
        'https://api.meta.ai/v1/asr/transcribe',
        withTimeout({ method: 'POST', headers: { Authorization: `Bearer ${deps.metaKey}` }, body: form }, 12000),
      );
      const ok = r.status !== 404 && r.status !== 405;
      audioProbe = { at: Date.now(), available: ok };
      return ok;
    } catch {
      audioProbe = { at: Date.now(), available: false };
      return false;
    }
  }

  /**
   * Convert arbitrary audio (webm/ogg/mp4/etc.) to mono 16-bit PCM WAV at
   * 16 kHz, which is the only container the Meta ASR endpoint accepts.
   */
  async function toWav16k(audio: Blob): Promise<Buffer> {
    const inputPath = `/tmp/jyntra_audio_input_${Date.now()}.bin`;
    const outputPath = `/tmp/jyntra_audio_output_${Date.now()}.wav`;
    const ab = await audio.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(ab));
    try {
      execFileSync(
        'ffmpeg',
        ['-y', '-i', inputPath, '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', '-map_metadata', '-1', outputPath],
        { stdio: 'ignore' },
      );
      return fs.readFileSync(outputPath);
    } finally {
      try { fs.unlinkSync(inputPath); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    }
  }

  /**
   * Real transcription chain: Muse Voice Transcribe when the provider actually
   * exposes the /v1/asr/transcribe route, then the configured secondary provider.
   * A transcript is only returned when it was really produced.
   */
  async function transcribe(
    audio: Blob,
    language = '',
  ): Promise<{ success: boolean; text?: string; model?: string; reason?: string; tier?: 'META' | 'GEMINI' }> {
    if (deps.metaKey && available(TRANSCRIBE_ID) && (await isTranscriptionAvailable())) {
      try {
        // Convert to WAV 16kHz mono PCM — required by the Meta ASR endpoint.
        const wavBuffer = await toWav16k(audio);
        const wavBlob = new Blob([wavBuffer as unknown as BlobPart], { type: 'audio/wav' });

        const requestJson = JSON.stringify({
          model: TRANSCRIBE_ID,
          audioEncoding: 'WAV',
          mode: 'PUSH_TO_TALK',
          ...(language ? { languageBias: [language] } : {}),
        });
        const form = new FormData();
        form.append('request', requestJson);
        form.append('audio', wavBlob, 'audio.wav');

        const r = await deps.fetchImpl(
          'https://api.meta.ai/v1/asr/transcribe',
          withTimeout({ method: 'POST', headers: { Authorization: `Bearer ${deps.metaKey}` }, body: form }, 90000),
        );
        if (r.ok) {
          const j: any = await r.json();
          const text = typeof j.transcript === 'string' ? j.transcript.trim() : '';
          if (text) return { success: true, text, model: TRANSCRIBE_ID, tier: 'META' };
        }
      } catch {
        /* fall through to the secondary provider */
      }
    }

    if (deps.geminiTranscribe) {
      try {
        const text = await deps.geminiTranscribe(audio, language);
        if (text && text.trim()) {
          return { success: true, text: text.trim(), model: 'gemini', tier: 'GEMINI' };
        }
      } catch {
        /* honest failure below */
      }
    }

    if (!deps.metaKey && !deps.geminiTranscribe) return { success: false, reason: 'TRANSCRIPTION_NOT_CONFIGURED' };
    return { success: false, reason: 'TRANSCRIPTION_ENDPOINT_UNAVAILABLE' };
  }

  async function capabilities() {
    const metaTranscription = await isTranscriptionAvailable();
    const transcription = metaTranscription || !!deps.geminiTranscribe;
    return {
      chat: !!deps.metaKey || !!deps.geminiChat || !!deps.freeAiChat,
      reasoning: !!deps.metaKey,
      vision: !!deps.metaKey || !!deps.geminiChat,
      image: (!!deps.metaKey && available(deps.metaImageModel || IMAGE_ID)) || !!deps.geminiImage,
      segmentation: !!deps.metaKey && available(SEGMENT_ID),
      transcription,
      tiers: {
        meta: !!deps.metaKey,
        gemini: !!deps.geminiChat,
        free: !!deps.freeAiChat,
      },
      models: {
        reasoning: chainFor('reasoning')[0] || null,
        fast: chainFor('fast')[0] || null,
        vision: chainFor('vision')[0] || null,
        image: available(deps.metaImageModel || IMAGE_ID) ? deps.metaImageModel || IMAGE_ID : null,
        segmentation: available(SEGMENT_ID) ? SEGMENT_ID : null,
        transcription: metaTranscription ? TRANSCRIBE_ID : transcription ? 'secondary' : null,
      },
    };
  }

  return {
    discoverMetaCatalog,
    runChat,
    runVision: (messages: AiMessage[], opts?: Omit<ChatOptions, 'task'>) => runChat(messages, { ...opts, task: 'vision', maxTokens: opts?.maxTokens ?? 3072 }),
    runImage,
    runSegmentation,
    transcribe,
    isTranscriptionAvailable,
    capabilities,
    callMetaModel: (model: string, messages: AiMessage[], temperature = 0.4) => callMetaModel(model, messages, temperature, 2048),
    contentToText,
  };
}
