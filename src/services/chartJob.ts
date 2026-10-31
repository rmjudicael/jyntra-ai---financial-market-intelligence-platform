/**
 * Persistent chart-analysis job runner (client side).
 *
 * The heavy work runs on the server. This module keeps the job id + owner
 * token in localStorage, polls the real server state, mirrors progress into
 * the workflow store, and survives page navigation and reloads. It is a plain
 * module (not a React hook) so an analysis keeps reporting progress even when
 * the Chart Analysis page is unmounted.
 */
import {
  createWorkflowRun,
  finishWorkflowRun,
  loadChartAnalysisState,
  saveChartAnalysisState,
  updateWorkflowStep,
} from './workflowStore';
import { saveLastAnalysis } from '../utils/prerequisites';

const JOB_KEY = 'jyntra_v1_chart_job';
const EVENT = 'jyntra_chart_job_update';
const POLL_MS = 2200;
const MAX_WAIT_MS = 12 * 60 * 1000;

export type ChartJobStatus = 'queued' | 'running' | 'success' | 'error';

export interface ChartJobState {
  jobId: string;
  token: string;
  status: ChartJobStatus;
  createdAt: number;
  updatedAt: number;
  symbol: string;
  timeframe: string;
  workflowRunId: string;
  imageBase64?: string;
  result?: any;
  error?: string;
  steps?: Array<{ id: string; title: string; status: string; detail?: string; at?: number }>;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let polling = false;
let startedAt = 0;

function emit() {
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* non-browser environment */
  }
}

export function loadChartJob(): ChartJobState | null {
  try {
    const raw = localStorage.getItem(JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.jobId || !parsed?.token) return null;
    return parsed as ChartJobState;
  } catch {
    return null;
  }
}

function save(state: ChartJobState) {
  try {
    localStorage.setItem(JOB_KEY, JSON.stringify(state));
  } catch {
    /* quota: keep the in-memory state, the analysis itself is unaffected */
  }
  emit();
}

export function clearChartJob() {
  try {
    localStorage.removeItem(JOB_KEY);
  } catch {
    /* noop */
  }
  if (timer) clearTimeout(timer);
  timer = null;
  polling = false;
  emit();
}

function mirrorSteps(runId: string, steps: ChartJobState['steps']) {
  if (!runId || !Array.isArray(steps)) return;
  for (const step of steps) {
    const status =
      step.status === 'success' ? 'success' : step.status === 'error' ? 'error' : step.status === 'running' ? 'running' : 'idle';
    updateWorkflowStep(runId, step.id, status as any, step.detail);
  }
}

function finishSuccess(state: ChartJobState, payload: any) {
  const analysis = payload?.analysis;
  if (!analysis) {
    state.status = 'error';
    state.error = 'Le résultat reçu est incomplet. Veuillez relancer l’analyse.';
    if (state.workflowRunId) finishWorkflowRun(state.workflowRunId, 'error', state.error);
    return;
  }
  state.result = payload;
  state.status = 'success';
  state.error = undefined;

  const prov = 'JYNTRA AI';
  if (state.workflowRunId) {
    updateWorkflowStep(state.workflowRunId, 'result', 'success', `Recommandation : ${analysis.recommendation || 'NO_TRADE'}`);
    finishWorkflowRun(state.workflowRunId, 'success');
  }
  saveChartAnalysisState({
    analysis,
    symbol: state.symbol,
    timeframe: state.timeframe,
    providerInfo: prov,
    workflowRunId: state.workflowRunId,
    imageBase64: state.imageBase64,
    result: payload,
    at: Date.now(),
  });
  saveLastAnalysis({
    symbol: state.symbol,
    timeframe: state.timeframe,
    recommendation: analysis?.recommendation,
    trend: analysis?.visualObservations?.trend,
    at: Date.now(),
  });
}

function finishError(state: ChartJobState, message: string) {
  state.status = 'error';
  state.error = message || 'L’analyse n’a pas pu aboutir. Veuillez réessayer.';
  if (state.workflowRunId) {
    updateWorkflowStep(state.workflowRunId, 'result', 'error', state.error);
    finishWorkflowRun(state.workflowRunId, 'error', state.error);
  }
}

async function pollOnce() {
  const state = loadChartJob();
  if (!state || state.status === 'success' || state.status === 'error') return;

  if (!startedAt) startedAt = Date.now();
  if (Date.now() - startedAt > MAX_WAIT_MS) {
    finishError(state, 'L’analyse a dépassé le temps maximal. Vous pouvez la relancer.');
    save(state);
    return;
  }

  try {
    const res = await fetch(`/api/ai/jobs/${encodeURIComponent(state.jobId)}`, {
      headers: { 'x-job-token': state.token },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (res.status === 404) {
      finishError(state, 'Cette opération a expiré. Vous pouvez relancer l’analyse.');
      save(state);
      return;
    }
    if (!res.ok || !data?.success || !data?.job) {
      // Transient read failure: keep the job alive and retry.
      state.updatedAt = Date.now();
      save(state);
      return;
    }

    const job = data.job;
    state.status = job.status === 'success' ? 'success' : job.status === 'error' ? 'error' : job.status === 'running' ? 'running' : 'queued';
    state.steps = job.steps;
    state.updatedAt = Date.now();
    mirrorSteps(state.workflowRunId, job.steps);

    if (job.status === 'success') {
      finishSuccess(state, job.result);
    } else if (job.status === 'error') {
      finishError(state, job.error || 'L’analyse n’a pas pu aboutir.');
    }
    save(state);
  } catch {
    // Offline or server restart: retry without pretending the job is done.
    state.updatedAt = Date.now();
    save(state);
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  const state = loadChartJob();
  if (!state || state.status === 'success' || state.status === 'error') {
    polling = false;
    timer = null;
    return;
  }
  polling = true;
  timer = setTimeout(async () => {
    await pollOnce();
    const next = loadChartJob();
    if (next && (next.status === 'queued' || next.status === 'running')) schedule();
    else polling = false;
  }, POLL_MS);
}

export function resumeChartJob() {
  const state = loadChartJob();
  if (!state) return;
  if (state.status === 'queued' || state.status === 'running') {
    if (!startedAt) startedAt = state.createdAt || Date.now();
    if (!polling) {
      void pollOnce().finally(schedule);
    }
  }
}

export interface StartChartJobInput {
  symbol: string;
  timeframe: string;
  customPrompt?: string;
  imageBase64?: string;
  userId: string;
}

export async function startChartJob(input: StartChartJobInput): Promise<ChartJobState> {
  clearChartJob();
  const run = createWorkflowRun(input.userId, input.symbol, input.timeframe, 'chart-analysis');
  updateWorkflowStep(run.id, 'reception', 'running', 'Graphique reçu, préparation de l’analyse…');

  const payload: any = {
    symbol: input.symbol,
    timeframe: input.timeframe,
    customPrompt: input.customPrompt || '',
    async: true,
  };
  if (input.imageBase64) payload.imageBase64 = input.imageBase64;

  const res = await fetch('/api/ai/analyze-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data?.jobId) {
    const message = typeof data?.error === 'string' ? data.error : 'Impossible de lancer l’analyse.';
    updateWorkflowStep(run.id, 'reception', 'error', message);
    finishWorkflowRun(run.id, 'error', message);
    throw new Error(message);
  }

  const state: ChartJobState = {
    jobId: data.jobId,
    token: data.token,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    symbol: input.symbol,
    timeframe: input.timeframe,
    workflowRunId: run.id,
    imageBase64: input.imageBase64,
    steps: data.steps,
  };
  startedAt = Date.now();
  save(state);
  mirrorSteps(run.id, data.steps);
  void pollOnce().finally(schedule);
  return state;
}

export function subscribeChartJob(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function getStoredAnalysis(): any | null {
  return loadChartAnalysisState();
}
