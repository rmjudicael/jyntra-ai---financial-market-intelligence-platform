import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type JobStatus = 'queued' | 'running' | 'success' | 'error';
export type JobStepStatus = 'idle' | 'running' | 'success' | 'error';

export interface JobStep {
  id: string;
  title: string;
  status: JobStepStatus;
  detail?: string;
  at?: number;
}

export interface JobRecord {
  id: string;
  token: string;
  kind: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  steps: JobStep[];
  result?: unknown;
  error?: string;
}

export interface PublicJob {
  id: string;
  kind: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  steps: JobStep[];
  result?: unknown;
  error?: string;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_JOBS = 120;
const storeDir = process.env.JOB_STORE_DIR || path.join(process.cwd(), '.data');
const storeFile = path.join(storeDir, 'jobs.json');

const jobs = new Map<string, JobRecord>();
let loaded = false;
let flushTimer: NodeJS.Timeout | null = null;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = fs.readFileSync(storeFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const job of parsed as JobRecord[]) {
        if (!job?.id || !job?.token) continue;
        if (job.expiresAt && job.expiresAt < Date.now()) continue;
      if (job.status === 'queued' || job.status === 'running') {
        job.status = 'error';
        job.error = 'L’opération a été interrompue par un redémarrage du service. Vous pouvez la relancer.';
        job.steps = (job.steps || []).map((s) =>
          s.status === 'running' ? { ...s, status: 'error' as JobStepStatus, detail: job.error } : s,
        );
        job.updatedAt = Date.now();
      }
        jobs.set(job.id, job);
      }
    }
  } catch {
    /* first run or unreadable file: start empty */
  }
  prune();
}

function prune() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.expiresAt < now) jobs.delete(id);
  }
  if (jobs.size > MAX_JOBS) {
    const ordered = [...jobs.values()].sort((a, b) => a.createdAt - b.createdAt);
    for (const job of ordered.slice(0, jobs.size - MAX_JOBS)) jobs.delete(job.id);
  }
}

function persist() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.mkdirSync(storeDir, { recursive: true });
      const list = [...jobs.values()].slice(-MAX_JOBS);
      const tmp = `${storeFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(list), 'utf8');
      fs.renameSync(tmp, storeFile);
    } catch {
      /* persistence is best-effort; in-memory state stays authoritative */
    }
  }, 250);
  flushTimer.unref?.();
}

export function createJob(kind: string, steps: Array<{ id: string; title: string }>): JobRecord {
  load();
  const now = Date.now();
  const job: JobRecord = {
    id: `job_${crypto.randomBytes(18).toString('hex')}`,
    token: crypto.randomBytes(24).toString('hex'),
    kind,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    expiresAt: now + TTL_MS,
    steps: steps.map((s) => ({ ...s, status: 'idle' })),
  };
  jobs.set(job.id, job);
  persist();
  return job;
}

export function getJob(id: string): JobRecord | null {
  load();
  return jobs.get(id) || null;
}

export function ownsJob(job: JobRecord, token: string | undefined): boolean {
  if (!token || typeof token !== 'string' || token.length !== job.token.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(job.token), Buffer.from(token));
  } catch {
    return false;
  }
}

export function updateJob(
  id: string,
  patch: Partial<Pick<JobRecord, 'status' | 'result' | 'error'>>,
): JobRecord | null {
  const job = getJob(id);
  if (!job) return null;
  Object.assign(job, patch);
  job.updatedAt = Date.now();
  persist();
  return job;
}

export function setStep(
  id: string,
  stepId: string,
  status: JobStepStatus,
  detail?: string,
): JobRecord | null {
  const job = getJob(id);
  if (!job) return null;
  const step = job.steps.find((s) => s.id === stepId);
  if (step) {
    step.status = status;
    if (detail !== undefined) step.detail = detail;
    step.at = Date.now();
  }
  job.updatedAt = Date.now();
  persist();
  return job;
}

export function publicJob(job: JobRecord): PublicJob {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    steps: job.steps,
    result: job.result,
    error: job.error,
  };
}

const sweeper = setInterval(() => {
  prune();
  persist();
}, 30 * 60 * 1000);
sweeper.unref?.();
