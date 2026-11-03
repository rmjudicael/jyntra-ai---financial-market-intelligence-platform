export type JyntrackScenarioId =
  | 'continuation'
  | 'reversal'
  | 'consolidation'
  | 'vol_shock'
  | 'correlation_break'
  | 'event_reaction';

export const JYNTRACK_SCENARIO_IDS: JyntrackScenarioId[] = [
  'continuation',
  'reversal',
  'consolidation',
  'vol_shock',
  'correlation_break',
  'event_reaction',
];

export interface JyntrackBand {
  step: number;
  timestamp: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
}

export interface JyntrackTerminal {
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
  medianReturnPct: number;
  p05ReturnPct: number;
  p95ReturnPct: number;
  probUpPct: number;
  probGain1Pct: number;
  probLoss1Pct: number;
  var95Pct: number;
  cvar95Pct: number;
  expectedMaxDrawdownPct: number;
  probTouchInvalidationPct: number | null;
}

export interface JyntrackScenario {
  id: JyntrackScenarioId;
  available: boolean;
  reason?: string;
  sampleSize: number;
  eventCount?: number;
  eventDates?: string[];
  terminal: JyntrackTerminal | null;
  bands: JyntrackBand[];
  invalidationLow: number | null;
  invalidationHigh: number | null;
  correlation?: {
    benchmarkSymbol: string;
    historical: number;
    simulated: number;
  };
}

export interface JyntrackInitialConditions {
  lastPrice: number;
  asOf: number;
  bars: number;
  firstTimestamp: number;
  lastTimestamp: number;
  perBarVolPct: number;
  annualizedVolPct: number;
  perBarDriftPct: number;
  annualizedDriftPct: number;
  trendSlopePctPerBar: number;
  momentum20Pct: number;
  atr14Pct: number;
  source: string;
  sourceName: string;
  freshness: string;
}

export interface JyntrackAssumptions {
  method: string;
  blockSize: number;
  paths: number;
  horizon: number;
  seed: number;
  driftAdjustmentPct: number;
  confidenceLevel: number;
  limitations: string[];
}

export interface JyntrackSimulation {
  success: true;
  symbol: string;
  benchmarkSymbol: string | null;
  interval: string;
  effectiveInterval: string;
  generatedAt: number;
  initial: JyntrackInitialConditions;
  assumptions: JyntrackAssumptions;
  scenarios: JyntrackScenario[];
  warnings: string[];
}

export interface JyntrackSimulationRequest {
  symbol: string;
  interval: string;
  horizon: number;
  paths: number;
  benchmark?: string | null;
  driftAdjustmentPct?: number;
}

export type JyntrackAgentRole = 'strategist' | 'opponent' | 'researcher' | 'risk' | 'judge';

export interface JyntrackAgentReport {
  role: JyntrackAgentRole;
  status: 'done' | 'error';
  model?: string;
  provider?: string;
  latencyMs?: number;
  text?: string;
  reason?: string;
}

export interface JyntrackWarRoom {
  success: true;
  mode: 'quick' | 'full';
  agents: JyntrackAgentReport[];
  calls: number;
  timestamp: number;
}

export interface JyntrackWarRoomRequest {
  symbol: string;
  interval: string;
  language: 'fr' | 'en' | 'mg';
  mode: 'quick' | 'full';
  brief?: string;
  simulation: JyntrackSimulation;
}

export interface JyntrackStrategyMetrics {
  totalReturnPercent: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  finalBalance: number;
  expectancy: number;
}

export interface JyntrackStrategyCandidate {
  id: string;
  type: 'ema_cross' | 'rsi_reversal' | 'breakout';
  name: string;
  params: Record<string, number>;
  train: JyntrackStrategyMetrics;
  test: JyntrackStrategyMetrics;
}

export interface JyntrackStrategyLab {
  success: true;
  symbol: string;
  interval: string;
  effectiveInterval: string;
  generatedAt: number;
  initialBalance: number;
  trainBars: number;
  testBars: number;
  candidates: JyntrackStrategyCandidate[];
  buyHold: { trainPct: number; testPct: number };
  best: {
    candidateId: string;
    equityCurve: { timestamp: number; balance: number }[];
  } | null;
  warnings: string[];
}

export interface JyntrackEventHorizon {
  horizon: number;
  count: number;
  meanPct: number | null;
  medianPct: number | null;
  positiveRatePct: number | null;
  /** Share of events whose forward move kept the initial shock direction. */
  continuationRatePct: number | null;
  stdevPct: number | null;
}

export interface JyntrackEventEpisode {
  timestamp: number;
  date: string;
  direction: 'UP' | 'DOWN';
  shockPct: number;
  forward: Array<number | null>;
  benchmarkForward: Array<number | null>;
}

export interface JyntrackEventStudy {
  success: true;
  symbol: string;
  benchmarkSymbol: string | null;
  interval: string;
  effectiveInterval: string;
  threshold: number;
  generatedAt: number;
  sampleBars: number;
  target: JyntrackEventHorizon[];
  benchmark: JyntrackEventHorizon[] | null;
  episodes: JyntrackEventEpisode[];
  warnings: string[];
}

export type JyntrackBracket =
  | 'BELOW_P05'
  | 'P05_P25'
  | 'P25_P50'
  | 'P50_P75'
  | 'P75_P95'
  | 'ABOVE_P95'
  | 'NO_DATA';

export interface JyntrackRealityCheck {
  success: true;
  symbol: string;
  interval: string;
  baselineTimestamp: number;
  observedBars: number;
  horizon: number;
  matured: boolean;
  baselinePrice: number;
  lastPrice: number;
  lastTimestamp: number;
  observedReturnPct: number;
  expected: { p05: number; p25: number; p50: number; p75: number; p95: number } | null;
  bracket: JyntrackBracket;
  inside50: boolean;
  inside90: boolean;
  assessment: 'PENDING' | 'ON_TRACK' | 'EDGE' | 'CONTRADICTED';
  invalidated: boolean;
  realized: {
    maxReturnPct: number;
    minReturnPct: number;
    maxDrawdownPct: number;
  };
  coverageLimited: boolean;
  source: string;
  sourceName: string;
  freshness: string;
  warnings: string[];
}

export interface JyntrackRealityRequest {
  symbol: string;
  interval: string;
  baselineTimestamp: number;
  baselinePrice: number;
  horizon: number;
  bands: JyntrackBand[];
  invalidationLow: number | null;
  invalidationHigh: number | null;
}

export interface JyntrackCheckSnapshot {
  at: number;
  observedBars: number;
  observedReturnPct: number;
  lastPrice: number;
  bracket: JyntrackBracket;
  assessment: JyntrackRealityCheck['assessment'];
  invalidated: boolean;
}

export interface JyntrackRecord {
  id: string;
  userId: string;
  symbol: string;
  interval: string;
  effectiveInterval: string;
  horizon: number;
  scenarioId: JyntrackScenarioId;
  createdAt: number;
  baselineTimestamp: number;
  baselinePrice: number;
  expectedTerminalPct: number;
  bands: JyntrackBand[];
  invalidationLow: number | null;
  invalidationHigh: number | null;
  source: string;
  sourceName: string;
  checkHistory: JyntrackCheckSnapshot[];
  lastCheck?: JyntrackRealityCheck;
}

export interface JyntrackCalibration {
  samples: number;
  matured: number;
  inside50RatePct: number | null;
  inside90RatePct: number | null;
  meanBiasPct: number | null;
  meanAbsoluteErrorPct: number | null;
  invalidatedCount: number;
}

export const JYNTRACK_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'SPX',
  'NDQ',
  'UKX',
] as const;

export const JYNTRACK_INTERVALS = ['15m', '1h', '4h', '1d'] as const;
export const JYNTRACK_BENCHMARKS = ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'EURUSD', 'SPX'] as const;
