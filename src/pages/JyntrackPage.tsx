import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserSession } from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { JYNTRACK_COPY, type JyntrackLang } from '../i18n/jyntrackCopy';
import { JyntrackStore } from '../services/jyntrackStore';
import {
  JYNTRACK_BENCHMARKS,
  JYNTRACK_INTERVALS,
  JYNTRACK_SCENARIO_IDS,
  JYNTRACK_SYMBOLS,
} from '../types/jyntrack';
import type {
  JyntrackAgentRole,
  JyntrackCalibration,
  JyntrackEventStudy,
  JyntrackRealityCheck,
  JyntrackRecord,
  JyntrackScenarioId,
  JyntrackSimulation,
  JyntrackStrategyLab,
  JyntrackWarRoom,
} from '../types/jyntrack';
import { ScenarioFanChart, SCENARIO_COLORS } from '../components/jyntrack/ScenarioFanChart';
import { EquityCurveChart } from '../components/jyntrack/EquityCurveChart';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ChartCandlestick,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Database,
  FlaskConical,
  Gauge,
  GitBranch,
  Info,
  Layers,
  Loader2,
  Orbit,
  Play,
  Radar,
  RefreshCw,
  Save,
  Scale,
  ShieldAlert,
  Swords,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

type Tab = 'worlds' | 'warRoom' | 'strategies' | 'events' | 'reality';

const SOURCE_LABELS: Record<string, string> = {
  BINANCE: 'Binance',
  ECB_FRANKFURTER: 'BCE · Frankfurter',
  YAHOO_FINANCE: 'Yahoo Finance',
};

const ROLE_ICONS: Record<JyntrackAgentRole, React.ComponentType<{ className?: string }>> = {
  strategist: Target,
  opponent: Swords,
  researcher: Radar,
  risk: ShieldAlert,
  judge: Scale,
};

function symbolLabel(symbol: string): string {
  if (symbol === 'XAUUSD') return 'XAU/USD';
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 10 ? 2 : abs >= 1 ? 4 : 6;
  return value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(digits, abs >= 1000 ? 0 : 2) });
}

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function errorCode(error: unknown): string {
  return typeof (error as any)?.code === 'string' ? (error as any).code : '';
}

async function postJson<T>(url: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error: any = new Error(payload?.code || 'request-failed');
    error.code = payload?.code;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

const Metric: React.FC<{ label: string; value: string; hint?: string; tone?: 'default' | 'up' | 'down' | 'warning' }> = ({
  label,
  value,
  hint,
  tone = 'default',
}) => {
  const toneClass =
    tone === 'up' ? 'text-emerald-400 light:text-emerald-600' : tone === 'down' ? 'text-rose-400 light:text-rose-600' : tone === 'warning' ? 'text-amber-400 light:text-amber-600' : 'text-white light:text-slate-900';
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 light:bg-white light:border-slate-200">
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1.5 text-lg font-bold font-mono ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
};

const StatusPill: React.FC<{ tone: 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan'; children: React.ReactNode }> = ({ tone, children }) => {
  const classes: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 light:text-amber-600 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 light:text-rose-600 border-rose-500/30',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/30 light:text-slate-600',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 light:text-cyan-700',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide ${classes[tone]}`}>{children}</span>;
};

export const JyntrackPage: React.FC<{ session: UserSession }> = ({ session }) => {
  const { language } = useLanguage();
  const lang: JyntrackLang = language === 'en' ? 'en' : language === 'mg' ? 'mg' : 'fr';
  const copy = JYNTRACK_COPY[lang];

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setIntervalValue] = useState('1h');
  const [horizon, setHorizon] = useState(48);
  const [paths, setPaths] = useState(600);
  const [benchmark, setBenchmark] = useState('ETHUSDT');
  const [simulation, setSimulation] = useState<JyntrackSimulation | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [selected, setSelected] = useState<JyntrackScenarioId>('continuation');
  const [tab, setTab] = useState<Tab>('worlds');

  const [warRoom, setWarRoom] = useState<JyntrackWarRoom | null>(null);
  const [warRoomLoading, setWarRoomLoading] = useState(false);
  const [warRoomError, setWarRoomError] = useState<string | null>(null);
  const [warMode, setWarMode] = useState<'quick' | 'full'>('full');
  const [brief, setBrief] = useState('');

  const [strategyLab, setStrategyLab] = useState<JyntrackStrategyLab | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);

  const [eventStudy, setEventStudy] = useState<JyntrackEventStudy | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(2);

  const [records, setRecords] = useState<JyntrackRecord[]>([]);
  const [calibration, setCalibration] = useState<JyntrackCalibration>(() =>
    JyntrackStore.calibration(session.userId),
  );
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [realityError, setRealityError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [lang],
  );

  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium' }),
    [lang],
  );

  const refreshRecords = useCallback(() => {
    setRecords(JyntrackStore.list(session.userId));
    setCalibration(JyntrackStore.calibration(session.userId));
  }, [session.userId]);

  const errorMessage = useCallback(
    (error: unknown): string => {
      const code = errorCode(error);
      const status = Number((error as any)?.status) || 0;
      if (code === 'NOT_ENOUGH_DATA') return copy.errors.notEnoughData;
      if (code === 'MARKET_SOURCE_UNAVAILABLE' || code === 'MARKET_SOURCE_INVALID') return copy.errors.market;
      if (code === 'RATE_LIMITED' || status === 429) return copy.errors.rateLimited;
      if (code === 'META_NOT_CONFIGURED') return copy.errors.metaRequired;
      if (code === 'META_UNAVAILABLE') return copy.errors.metaUnavailable;
      if (code === 'META_QUOTA') return copy.errors.aiQuota;
      if (code === 'INVALID_HYPOTHESIS' || code === 'SIMULATION_REQUIRED') return copy.errors.invalid;
      if (code === 'UNSUPPORTED_SYMBOL') return copy.errors.unsupported;
      if (error instanceof TypeError) return copy.errors.network;
      if ((error as any)?.name === 'TimeoutError' || (error as any)?.name === 'AbortError') return copy.errors.network;
      return copy.errors.generic;
    },
    [copy],
  );

  const calibrationDrift = calibration.matured >= 5 && calibration.meanBiasPct != null ? calibration.meanBiasPct : 0;

  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    setSimError(null);
    try {
      const result = await postJson<JyntrackSimulation>(
        '/api/jyntrack/simulate',
        {
          symbol,
          interval,
          horizon,
          paths,
          benchmark: benchmark && benchmark !== symbol ? benchmark : null,
          driftAdjustmentPct: calibrationEnabled ? calibrationDrift : 0,
        },
        45_000,
      );
      setSimulation(result);
      setSelected((previous) => {
        const current = result.scenarios.find((scenario) => scenario.id === previous && scenario.available);
        if (current) return previous;
        return result.scenarios.find((scenario) => scenario.available)?.id || 'continuation';
      });
      setWarRoom(null);
      setWarRoomError(null);
      setStrategyLab(null);
      setStrategyError(null);
      setEventStudy(null);
      setEventError(null);
    } catch (error) {
      setSimError(errorMessage(error));
    } finally {
      setSimLoading(false);
    }
  }, [symbol, interval, horizon, paths, benchmark, calibrationEnabled, calibrationDrift, errorMessage]);

  useEffect(() => {
    void runSimulation();
    refreshRecords();
    // Initial load only: the user controls every subsequent run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedScenario = simulation?.scenarios.find((scenario) => scenario.id === selected) || null;
  const selectedCopy = copy.scenario[selected];

  const warningLabel = (code: string) => copy.warnings[code] || copy.assumptions.warnings;
  const sourceLabel = (code: string) => SOURCE_LABELS[code] || copy.initial.source;
  const reasonLabel = (reason?: string) => {
    if (reason === 'META_QUOTA') return copy.errors.aiQuota;
    if (reason === 'META_ONLY_UNAVAILABLE' || reason === 'NO_TIER_AVAILABLE' || reason === 'META_UNAVAILABLE') return copy.errors.metaUnavailable;
    return copy.warRoom.statusError;
  };
  const bracketLabel = (bracket: string) => copy.reality.brackets[bracket] || copy.reality.brackets.NO_DATA;
  const assessmentLabel = (assessment: string) => copy.reality.assessments[assessment] || copy.reality.assessments.PENDING;
  const assessmentTone = (assessment: string): 'emerald' | 'amber' | 'rose' | 'slate' =>
    assessment === 'ON_TRACK' ? 'emerald' : assessment === 'EDGE' ? 'amber' : assessment === 'CONTRADICTED' ? 'rose' : 'slate';

  const saveScenario = () => {
    if (!simulation || !selectedScenario?.available || !selectedScenario.terminal) return;
    const record: JyntrackRecord = {
      id: `jtr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      userId: session.userId,
      symbol: simulation.symbol,
      interval: simulation.interval,
      effectiveInterval: simulation.effectiveInterval,
      horizon: simulation.assumptions.horizon,
      scenarioId: selectedScenario.id,
      createdAt: Date.now(),
      baselineTimestamp: simulation.initial.lastTimestamp,
      baselinePrice: simulation.initial.lastPrice,
      expectedTerminalPct: selectedScenario.terminal.medianReturnPct,
      bands: selectedScenario.bands,
      invalidationLow: selectedScenario.invalidationLow,
      invalidationHigh: selectedScenario.invalidationHigh,
      source: simulation.initial.source,
      sourceName: simulation.initial.sourceName,
      checkHistory: [],
    };
    JyntrackStore.save(record);
    refreshRecords();
    setNotice(copy.scenarioSection.saved);
    setTab('reality');
  };

  const runWarRoom = async () => {
    if (!simulation) return;
    setWarRoomLoading(true);
    setWarRoomError(null);
    try {
      const result = await postJson<JyntrackWarRoom>(
        '/api/jyntrack/war-room',
        {
          symbol: simulation.symbol,
          interval: simulation.interval,
          language: lang,
          mode: warMode,
          brief,
          simulation,
        },
        210_000,
      );
      setWarRoom(result);
    } catch (error) {
      setWarRoomError(errorMessage(error));
    } finally {
      setWarRoomLoading(false);
    }
  };

  const runStrategyLab = async () => {
    if (!simulation) return;
    setStrategyLoading(true);
    setStrategyError(null);
    try {
      const result = await postJson<JyntrackStrategyLab>(
        '/api/jyntrack/strategies',
        { symbol, interval, initialBalance, riskPercent },
        45_000,
      );
      setStrategyLab(result);
    } catch (error) {
      setStrategyError(errorMessage(error));
    } finally {
      setStrategyLoading(false);
    }
  };

  const runEventStudy = async () => {
    if (!simulation) return;
    setEventLoading(true);
    setEventError(null);
    try {
      const result = await postJson<JyntrackEventStudy>(
        '/api/jyntrack/event-study',
        { symbol, interval, benchmark: benchmark && benchmark !== symbol ? benchmark : null, threshold },
        45_000,
      );
      setEventStudy(result);
    } catch (error) {
      setEventError(errorMessage(error));
    } finally {
      setEventLoading(false);
    }
  };

  const verifyRecord = async (record: JyntrackRecord) => {
    setCheckingId(record.id);
    setRealityError(null);
    try {
      const check = await postJson<JyntrackRealityCheck>(
        '/api/jyntrack/reality-check',
        {
          symbol: record.symbol,
          interval: record.interval,
          baselineTimestamp: record.baselineTimestamp,
          baselinePrice: record.baselinePrice,
          horizon: record.horizon,
          bands: record.bands,
          invalidationLow: record.invalidationLow,
          invalidationHigh: record.invalidationHigh,
        },
        30_000,
      );
      JyntrackStore.appendCheck(session.userId, record.id, check);
      refreshRecords();
    } catch (error) {
      setRealityError(errorMessage(error));
    } finally {
      setCheckingId(null);
    }
  };

  const deleteRecord = (record: JyntrackRecord) => {
    if (!window.confirm(copy.reality.confirmDelete)) return;
    JyntrackStore.remove(session.userId, record.id);
    refreshRecords();
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'worlds', label: copy.tabs.worlds, icon: Orbit },
    { id: 'warRoom', label: copy.tabs.warRoom, icon: BrainCircuit },
    { id: 'strategies', label: copy.tabs.strategies, icon: FlaskConical },
    { id: 'events', label: copy.tabs.events, icon: GitBranch },
    { id: 'reality', label: copy.tabs.reality, icon: Radar },
  ];

  const availableScenarios = simulation?.scenarios.filter((scenario) => scenario.available) || [];
  const pipelineRoles: JyntrackAgentRole[] = warMode === 'full'
    ? ['strategist', 'opponent', 'researcher', 'risk', 'judge']
    : ['strategist', 'opponent', 'judge'];

  return (
    <div className="jyntrack-page min-h-screen bg-[#080B10] text-slate-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 light:bg-slate-50 light:text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#07131A] via-[#080B10] to-[#0A0F1A] p-6 sm:p-9 light:from-cyan-50 light:via-white light:to-slate-50 light:border-cyan-200">
          <div aria-hidden="true" className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-cyan-400 light:text-cyan-700 light:border-cyan-300">
              <ChartCandlestick className="w-3.5 h-3.5" />
              {copy.badge}
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white light:text-slate-900">
              JYN<span className="text-cyan-400 light:text-cyan-600">TRACK</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-300 light:text-slate-600">{copy.subtitle}</p>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-500">{copy.intro}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {copy.heroChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/50 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 light:text-slate-600 light:bg-white light:border-slate-200 light:text-slate-600"
                >
                  <CircleDot className="w-3 h-3 text-cyan-500" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.controls.asset}</span>
              <select
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/60 light:bg-slate-50 light:border-slate-300 light:text-cyan-700"
              >
                {JYNTRACK_SYMBOLS.map((item) => (
                  <option key={item} value={item}>{symbolLabel(item)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.controls.interval}</span>
              <select
                value={interval}
                onChange={(event) => setIntervalValue(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 light:bg-slate-50 light:border-slate-300"
              >
                {JYNTRACK_INTERVALS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.controls.horizon}</span>
              <select
                value={horizon}
                onChange={(event) => setHorizon(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 light:bg-slate-50 light:border-slate-300"
              >
                {[24, 48, 72].map((item) => (
                  <option key={item} value={item}>{item} {copy.controls.barsUnit}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.controls.paths}</span>
              <select
                value={paths}
                onChange={(event) => setPaths(Number(event.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 light:bg-slate-50 light:border-slate-300"
              >
                {[300, 600, 1000].map((item) => (
                  <option key={item} value={item}>{formatNumber(item)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.controls.benchmark}</span>
              <select
                value={benchmark}
                onChange={(event) => setBenchmark(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 light:bg-slate-50 light:border-slate-300"
              >
                <option value="">{copy.controls.none}</option>
                {JYNTRACK_BENCHMARKS.filter((item) => item !== symbol).map((item) => (
                  <option key={item} value={item}>{symbolLabel(item)}</option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                onClick={() => void runSimulation()}
                disabled={simLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{simLoading ? copy.controls.running : copy.controls.run}</span>
              </button>
            </div>
          </div>

          {calibration.samples > 0 && (
            <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/5 px-3.5 py-3 light:bg-violet-50 light:border-violet-200">
              <label className={`flex items-start gap-2.5 ${calibration.matured >= 5 ? 'cursor-pointer' : 'opacity-70'}`}>
                <input
                  type="checkbox"
                  checked={calibrationEnabled}
                  disabled={calibration.matured < 5}
                  onChange={(event) => setCalibrationEnabled(event.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-violet-500"
                />
                <span className="text-[11px] leading-relaxed text-slate-300 light:text-slate-600">
                  <span className="font-semibold text-slate-200 light:text-slate-800">{copy.controls.calibration}</span>
                  {calibration.matured >= 5 ? (
                    <> — {copy.controls.drift} {formatPct(calibrationDrift, 2)}</>
                  ) : (
                    <> — {copy.controls.calibrationUnavailable}</>
                  )}
                  <span className="block text-slate-500">{copy.controls.calibrationHelp}</span>
                </span>
              </label>
            </div>
          )}

          {simError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{simError}</span>
            </div>
          )}

          {simulation && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Database className="w-3 h-3" />{sourceLabel(simulation.initial.source)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" />{dateFormatter.format(new Date(simulation.initial.asOf))}</span>
              <span className="inline-flex items-center gap-1.5"><Layers className="w-3 h-3" />{simulation.initial.bars} {copy.controls.barsUnit}</span>
              <span className="inline-flex items-center gap-1.5"><Activity className="w-3 h-3" />{simulation.effectiveInterval}</span>
              {simulation.warnings.map((warning) => (
                <span key={warning} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 text-amber-500">
                  <AlertTriangle className="w-3 h-3" />
                  {warningLabel(warning)}
                </span>
              ))}
            </div>
          )}
        </section>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            {notice}
          </div>
        )}

        {/* Tabs */}
        <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="JYNTRACK modules">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-[11px] sm:text-xs font-bold transition-colors ${
                  active
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 light:text-cyan-700 light:bg-cyan-50 light:border-cyan-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 light:bg-white light:border-slate-200 light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Worlds */}
        {tab === 'worlds' && (
          <div className="space-y-6">
            {simulation && (
              <>
                <section className="space-y-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white light:text-slate-900">{copy.initial.title}</h2>
                    <p className="text-xs text-slate-500">{copy.initial.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    <Metric label={copy.initial.lastPrice} value={formatPrice(simulation.initial.lastPrice)} />
                    <Metric label={copy.initial.annualVol} value={formatPct(simulation.initial.annualizedVolPct, 1)} tone="warning" />
                    <Metric
                      label={copy.initial.momentum}
                      value={formatPct(simulation.initial.momentum20Pct, 2)}
                      tone={simulation.initial.momentum20Pct >= 0 ? 'up' : 'down'}
                    />
                    <Metric label={copy.initial.atr} value={formatPct(simulation.initial.atr14Pct, 2)} />
                    <Metric label={copy.initial.effective} value={simulation.effectiveInterval} hint={simulation.initial.sourceName} />
                    <Metric label={copy.initial.bars} value={formatNumber(simulation.initial.bars)} hint={dateFormatter.format(new Date(simulation.initial.asOf))} />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 light:bg-white light:border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-lg font-black text-white light:text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
                        {copy.chart.title}
                      </h2>
                      <p className="text-xs text-slate-500 max-w-3xl">{copy.chart.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: SCENARIO_COLORS[selected].stroke }} />{copy.chart.median}</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: SCENARIO_COLORS[selected].stroke }} />{copy.chart.band50}</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm opacity-30" style={{ background: SCENARIO_COLORS[selected].stroke }} />{copy.chart.band90}</span>
                    </div>
                  </div>

                  <ScenarioFanChart
                    scenarios={simulation.scenarios}
                    selected={selected}
                    horizon={simulation.assumptions.horizon}
                    labels={Object.fromEntries(JYNTRACK_SCENARIO_IDS.map((id) => [id, copy.scenario[id].name])) as Record<JyntrackScenarioId, string>}
                    baselinePrice={simulation.initial.lastPrice}
                  />

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {simulation.scenarios.map((scenario) => {
                      const color = SCENARIO_COLORS[scenario.id];
                      const active = scenario.id === selected;
                      return (
                        <button
                          key={scenario.id}
                          onClick={() => setSelected(scenario.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            active ? `${color.chip} ring-1 ring-inset` : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 light:bg-white light:border-slate-200 light:hover:border-slate-300'
                          } ${!scenario.available ? 'opacity-55' : ''}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color.stroke }} />
                            <span className={`text-[11px] font-bold ${active ? color.text : 'text-slate-300 light:text-slate-600'}`}>{copy.scenario[scenario.id].name}</span>
                          </div>
                          <div className="mt-1.5 font-mono text-sm font-bold text-slate-100 light:text-slate-900">
                            {scenario.terminal ? formatPct(scenario.terminal.medianReturnPct, 2) : '—'}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">
                            {scenario.terminal ? `P(up) ${scenario.terminal.probUpPct.toFixed(0)}%` : copy.scenarioSection.unavailable}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 space-y-5 light:bg-white light:border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCENARIO_COLORS[selected].stroke }} />
                          <h2 className="text-xl font-black text-white light:text-slate-900">{selectedCopy.name}</h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{selectedCopy.tagline}</p>
                      </div>
                      {selectedScenario?.available && (
                        <button
                          onClick={saveScenario}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-400 light:text-cyan-700 hover:bg-cyan-500/20 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {copy.scenarioSection.save}
                        </button>
                      )}
                    </div>

                    {!selectedScenario?.available ? (
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-300">
                        <div className="font-semibold">{copy.scenarioSection.unavailable}</div>
                        <div className="mt-1 text-amber-500/90">
                          {selectedScenario?.reason === 'EVENT_SAMPLE_TOO_SMALL'
                            ? copy.warnings.EVENT_SAMPLE_SMALL
                            : selectedScenario?.reason === 'BENCHMARK_UNAVAILABLE'
                              ? copy.warnings.BENCHMARK_MISALIGNED
                              : copy.demoNotice}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 light:bg-slate-50 light:border-slate-200">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 mb-1.5">{copy.scenarioSection.hypothesis}</div>
                            <p className="text-[12px] leading-relaxed text-slate-300 light:text-slate-600">{selectedCopy.hypothesis}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 light:bg-slate-50 light:border-slate-200">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.scenarioSection.conditions}</div>
                            <p className="text-[12px] leading-relaxed text-slate-300 light:text-slate-600">{selectedCopy.initial}</p>
                            <p className="mt-2 text-[11px] font-mono text-slate-500">
                              {formatPrice(simulation.initial.lastPrice)} · {copy.initial.annualVol} {formatPct(simulation.initial.annualizedVolPct, 1)} · {copy.initial.momentum} {formatPct(simulation.initial.momentum20Pct, 2)}
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 mb-2">{copy.scenarioSection.catalysts}</div>
                            <ul className="space-y-1.5">
                              {selectedCopy.catalysts.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-[12px] text-slate-300 light:text-slate-600">
                                  <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-500 mb-2">{copy.scenarioSection.invalidators}</div>
                            <ul className="space-y-1.5">
                              {selectedCopy.invalidators.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-[12px] text-slate-300 light:text-slate-600">
                                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 light:bg-slate-50 light:border-slate-200">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500 mb-1.5">{copy.scenarioSection.consequences}</div>
                            <p className="text-[12px] leading-relaxed text-slate-300 light:text-slate-600">{selectedCopy.consequences}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 light:bg-slate-50 light:border-slate-200">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-500 mb-1.5">{copy.scenarioSection.risks}</div>
                            <p className="text-[12px] leading-relaxed text-slate-300 light:text-slate-600">{selectedCopy.risks}</p>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-500 mb-2">{copy.scenarioSection.confirmations}</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedCopy.confirmations.map((item) => (
                              <span key={item} className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-1.5 text-[10px] text-sky-400 light:text-sky-600">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {selectedScenario?.correlation && (
                          <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 text-[11px] text-violet-300">
                            <span className="font-mono uppercase tracking-wider text-violet-400 light:text-violet-600">{symbolLabel(selectedScenario.correlation.benchmarkSymbol)}</span>
                            {' · '}
                            {copy.table.scenario}: {formatNumber(selectedScenario.correlation.historical, 2)} → {formatNumber(selectedScenario.correlation.simulated, 2)}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    {selectedScenario?.terminal && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Metric label="P05" value={formatPrice(selectedScenario.terminal.p05)} tone="down" />
                          <Metric label="P95" value={formatPrice(selectedScenario.terminal.p95)} tone="up" />
                          <Metric label="P50" value={formatPrice(selectedScenario.terminal.p50)} />
                          <Metric label={copy.table.probabilityUp} value={`${selectedScenario.terminal.probUpPct.toFixed(1)}%`} />
                          <Metric label={copy.table.var} value={`${selectedScenario.terminal.var95Pct.toFixed(2)}%`} tone="down" />
                          <Metric label={copy.table.drawdown} value={`${selectedScenario.terminal.expectedMaxDrawdownPct.toFixed(2)}%`} tone="warning" />
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-[11px] space-y-2 light:bg-white light:border-slate-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">{copy.scenarioSection.sample}</span>
                            <span className="font-mono text-slate-300 light:text-slate-600">{formatNumber(selectedScenario.sampleSize)}</span>
                          </div>
                          {selectedScenario.eventCount != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">{copy.scenarioSection.eventsUsed}</span>
                              <span className="font-mono text-slate-300 light:text-slate-600">{formatNumber(selectedScenario.eventCount)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">{copy.scenarioSection.invalidation}</span>
                            <span className="font-mono text-slate-300 light:text-slate-600">
                              {selectedScenario.invalidationLow != null ? formatPrice(selectedScenario.invalidationLow) : '—'}
                              {selectedScenario.invalidationHigh != null ? ` / ${formatPrice(selectedScenario.invalidationHigh)}` : ''}
                            </span>
                          </div>
                          {selectedScenario.terminal.probTouchInvalidationPct != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">{copy.table.invalidation} %</span>
                              <span className="font-mono text-slate-300 light:text-slate-600">{selectedScenario.terminal.probTouchInvalidationPct.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 light:bg-white light:border-slate-200">
                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
                        <Info className="w-3.5 h-3.5" />
                        {copy.assumptions.title}
                      </div>
                      <dl className="space-y-1.5 text-[10px] font-mono">
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">{copy.assumptions.block}</dt><dd className="text-slate-300 light:text-slate-600">{simulation.assumptions.blockSize}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">{copy.assumptions.paths}</dt><dd className="text-slate-300 light:text-slate-600">{formatNumber(simulation.assumptions.paths)}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">{copy.assumptions.horizon}</dt><dd className="text-slate-300 light:text-slate-600">{simulation.assumptions.horizon}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">{copy.assumptions.seed}</dt><dd className="text-slate-300 light:text-slate-600">{simulation.assumptions.seed}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">{copy.assumptions.drift}</dt><dd className="text-slate-300 light:text-slate-600">{formatPct(simulation.assumptions.driftAdjustmentPct, 2)}</dd></div>
                      </dl>
                      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{simulation.assumptions.method}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-lg font-black text-white light:text-slate-900">{copy.chart.compareTitle}</h2>
                      <p className="text-xs text-slate-500">{copy.chart.compareSubtitle}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{copy.assumptions.confidence} 90%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-[11px]">
                      <thead className="border-b border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-2">{copy.table.scenario}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.median}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.band}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.probabilityUp}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.var}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.drawdown}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.invalidation}</th>
                          <th className="py-2.5 px-2 text-right">{copy.table.sample}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {simulation.scenarios.map((scenario) => (
                          <tr key={scenario.id} className={`${scenario.id === selected ? 'bg-cyan-500/5' : ''} hover:bg-slate-800/30`}>
                            <td className="py-2.5 px-2">
                              <button onClick={() => setSelected(scenario.id)} className="inline-flex items-center gap-1.5 font-semibold text-slate-200 light:text-slate-700 hover:text-cyan-400 light:hover:text-cyan-700">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SCENARIO_COLORS[scenario.id].stroke }} />
                                {copy.scenario[scenario.id].name}
                              </button>
                            </td>
                            <td className={`py-2.5 px-2 text-right font-mono font-bold ${scenario.terminal && scenario.terminal.medianReturnPct >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                              {scenario.terminal ? formatPct(scenario.terminal.medianReturnPct, 2) : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-400 light:text-slate-500">
                              {scenario.terminal ? `${formatPct(scenario.terminal.p05ReturnPct, 1)} / ${formatPct(scenario.terminal.p95ReturnPct, 1)}` : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{scenario.terminal ? `${scenario.terminal.probUpPct.toFixed(0)}%` : '—'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-rose-400 light:text-rose-600">{scenario.terminal ? `${scenario.terminal.var95Pct.toFixed(2)}%` : '—'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-amber-400 light:text-amber-600">{scenario.terminal ? `${scenario.terminal.expectedMaxDrawdownPct.toFixed(2)}%` : '—'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                              {scenario.invalidationLow != null ? formatPrice(scenario.invalidationLow) : scenario.invalidationHigh != null ? formatPrice(scenario.invalidationHigh) : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-500">{formatNumber(scenario.sampleSize)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {!simulation && simLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-36 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse light:bg-white light:border-slate-200" />
                ))}
              </div>
            )}

            {!simulation && !simLoading && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
                {simError || copy.demoNotice}
              </div>
            )}
          </div>
        )}

        {/* War room */}
        {tab === 'warRoom' && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 light:bg-white light:border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-violet-400 light:text-violet-600" />
                    {copy.warRoom.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.warRoom.subtitle}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{copy.warRoom.honestNote}</p>
                </div>
                <div className="shrink-0 space-y-2">
                  <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1 light:bg-slate-100 light:border-slate-300">
                    <button
                      onClick={() => setWarMode('full')}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${warMode === 'full' ? 'bg-violet-500 text-white' : 'text-slate-400 light:text-slate-600'}`}
                    >
                      {copy.warRoom.modeFull}
                    </button>
                    <button
                      onClick={() => setWarMode('quick')}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${warMode === 'quick' ? 'bg-violet-500 text-white' : 'text-slate-400 light:text-slate-600'}`}
                    >
                      {copy.warRoom.modeQuick}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 max-w-xs">{copy.warRoom.modeHelp}</p>
                </div>
              </div>

              <div className="mt-5 grid lg:grid-cols-12 gap-4">
                <label className="lg:col-span-8 block">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.warRoom.brief}</span>
                  <textarea
                    value={brief}
                    onChange={(event) => setBrief(event.target.value.slice(0, 900))}
                    rows={3}
                    placeholder={copy.warRoom.briefPlaceholder}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 light:bg-slate-50 light:border-slate-300"
                  />
                </label>
                <div className="lg:col-span-4 flex flex-col justify-end gap-2">
                  <button
                    onClick={() => void runWarRoom()}
                    disabled={!simulation || warRoomLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {warRoomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                    {warRoomLoading ? copy.warRoom.running : copy.warRoom.run}
                  </button>
                  {!simulation && <p className="text-[10px] text-amber-500 text-center">{copy.warRoom.noSimulation}</p>}
                </div>
              </div>

              {warRoomError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{warRoomError}</span>
                </div>
              )}
            </section>

            {warRoomLoading && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 light:bg-white light:border-slate-200">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400 light:text-violet-600" />
                  {copy.warRoom.pipeline}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {pipelineRoles.map((role, index) => {
                    const Icon = ROLE_ICONS[role];
                    return (
                      <div key={role} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 animate-pulse light:bg-slate-50 light:border-slate-200" style={{ animationDelay: `${index * 90}ms` }}>
                        <Icon className="w-4 h-4 text-violet-400 light:text-violet-600" />
                        <div className="mt-2 text-[10px] font-bold text-slate-300 light:text-slate-600">{copy.role[role].name}</div>
                        <div className="mt-1 text-[9px] text-slate-500">{copy.role[role].mission}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {warRoom && !warRoomLoading && (
              <div className="space-y-4">
                {warRoom.agents.some((agent) => agent.status === 'error') && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{copy.warRoom.partial}</span>
                  </div>
                )}
                <div className="grid lg:grid-cols-2 gap-4">
                  {warRoom.agents.map((agent) => {
                    const Icon = ROLE_ICONS[agent.role];
                    const isJudge = agent.role === 'judge';
                    return (
                      <article
                        key={agent.role}
                        className={`rounded-2xl border p-5 ${
                          isJudge
                            ? 'border-violet-500/40 bg-violet-500/5 lg:col-span-2'
                            : 'border-slate-800 bg-slate-900/50 light:bg-white light:border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isJudge ? 'bg-violet-500/15 text-violet-400 light:text-violet-600' : 'bg-slate-800 text-slate-300 light:bg-slate-100 light:text-slate-600'}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white light:text-slate-900">{copy.role[agent.role].name}</h3>
                              <p className="text-[10px] text-slate-500 max-w-md">{copy.role[agent.role].mission}</p>
                            </div>
                          </div>
                          <StatusPill tone={agent.status === 'done' ? 'emerald' : 'rose'}>
                            {agent.status === 'done' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {agent.status === 'done' ? copy.warRoom.statusDone : copy.warRoom.statusError}
                          </StatusPill>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-slate-500">
                          {agent.model && <span>{copy.warRoom.model}: <span className="text-slate-300 light:text-slate-600">{agent.model}</span></span>}
                          {agent.latencyMs != null && <span>{copy.warRoom.latency}: <span className="text-slate-300 light:text-slate-600">{Math.round(agent.latencyMs / 1000)}s</span></span>}
                        </div>

                        {agent.status === 'done' && agent.text ? (
                          <div className="mt-3 text-[12px] leading-relaxed text-slate-300 light:text-slate-600 whitespace-pre-wrap">{agent.text}</div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-300">
                            {reasonLabel(agent.reason)}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {!warRoom.agents.some((agent) => agent.role === 'judge' && agent.status === 'done') && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-300">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{copy.warRoom.judgeMissing}</span>
                  </div>
                )}
              </div>
            )}

            {!warRoom && !warRoomLoading && !warRoomError && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
                {simulation ? copy.warRoom.honestNote : copy.warRoom.noSimulation}
              </div>
            )}
          </div>
        )}

        {/* Strategies */}
        {tab === 'strategies' && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 light:bg-white light:border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-emerald-400 light:text-emerald-600" />
                    {copy.strategies.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.strategies.subtitle}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{copy.strategies.method}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <label className="block">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.strategies.initialBalance}</span>
                    <input
                      type="number"
                      min={100}
                      max={1_000_000}
                      value={initialBalance}
                      onChange={(event) => setInitialBalance(Number(event.target.value) || 10000)}
                      className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none light:bg-slate-50 light:border-slate-300"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.strategies.risk}</span>
                    <input
                      type="number"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={riskPercent}
                      onChange={(event) => setRiskPercent(Number(event.target.value) || 2)}
                      className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none light:bg-slate-50 light:border-slate-300"
                    />
                  </label>
                  <button
                    onClick={() => void runStrategyLab()}
                    disabled={!simulation || strategyLoading}
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {strategyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {strategyLoading ? copy.strategies.running : copy.strategies.run}
                  </button>
                </div>
              </div>

              {strategyError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{strategyError}</span>
                </div>
              )}
            </section>

            {strategyLab ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Metric label={copy.strategies.trainBars} value={formatNumber(strategyLab.trainBars)} />
                  <Metric label={copy.strategies.testBars} value={formatNumber(strategyLab.testBars)} />
                  <Metric label={copy.strategies.buyHold} value={formatPct(strategyLab.buyHold.testPct, 2)} tone={strategyLab.buyHold.testPct >= 0 ? 'up' : 'down'} />
                  <Metric label={copy.assumptions.warnings} value={`${strategyLab.warnings.length}`} hint={strategyLab.warnings.map(warningLabel).join(' · ')} tone="warning" />
                </div>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-[11px]">
                      <thead className="border-b border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-2">{copy.strategies.candidate}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.inSample} · {copy.strategies.return}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.outOfSample} · {copy.strategies.return}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.testDrawdown}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.winRate}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.profitFactor}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.trades}</th>
                          <th className="py-2.5 px-2 text-right">{copy.strategies.finalBalance}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {strategyLab.candidates.map((candidate, index) => {
                          const isFirst = index === 0;
                          return (
                            <tr key={candidate.id} className={isFirst ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'}>
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-1.5">
                                  {isFirst && <StatusPill tone="emerald">{copy.strategies.selectedOnTrain}</StatusPill>}
                                  <span className="font-semibold text-slate-200">{candidate.name}</span>
                                </div>
                              </td>
                              <td className={`py-2.5 px-2 text-right font-mono ${candidate.train.totalReturnPercent >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                                {formatPct(candidate.train.totalReturnPercent, 2)}
                              </td>
                              <td className={`py-2.5 px-2 text-right font-mono font-bold ${candidate.test.totalReturnPercent >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                                {formatPct(candidate.test.totalReturnPercent, 2)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-amber-400 light:text-amber-600">{candidate.test.maxDrawdownPercent.toFixed(2)}%</td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{candidate.test.winRate.toFixed(1)}%</td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{candidate.test.profitFactor.toFixed(2)}</td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-400 light:text-slate-500">{candidate.test.totalTrades}</td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{formatNumber(candidate.test.finalBalance, 2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{copy.strategies.oosNote}</p>
                </section>

                {strategyLab.best && (
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
                        {copy.strategies.equity}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">{strategyLab.best.candidateId}</span>
                    </div>
                    <EquityCurveChart points={strategyLab.best.equityCurve} initialBalance={strategyLab.initialBalance} />
                  </section>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
                {strategyLoading ? copy.strategies.running : copy.strategies.empty}
              </div>
            )}
          </div>
        )}

        {/* Events */}
        {tab === 'events' && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 light:bg-white light:border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-sky-400 light:text-sky-600" />
                    {copy.events.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.events.subtitle}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{copy.events.note}</p>
                </div>
                <div className="flex items-end gap-3 shrink-0">
                  <label className="block">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">{copy.events.threshold}</span>
                    <select
                      value={threshold}
                      onChange={(event) => setThreshold(Number(event.target.value))}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none light:bg-slate-50 light:border-slate-300"
                    >
                      {[1.5, 2, 2.5, 3].map((item) => (
                        <option key={item} value={item}>{item}σ</option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={() => void runEventStudy()}
                    disabled={!simulation || eventLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {eventLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {eventLoading ? copy.events.running : copy.events.run}
                  </button>
                </div>
              </div>
              {eventError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{eventError}</span>
                </div>
              )}
            </section>

            {eventStudy ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-bold text-white light:text-slate-900">{copy.events.target} · {symbolLabel(eventStudy.symbol)}</h3>
                    <span className="text-[10px] font-mono text-slate-500">{eventStudy.sampleBars} {copy.controls.barsUnit} · {eventStudy.threshold}σ</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-[11px]">
                      <thead className="border-b border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="py-2.5 px-2">{copy.events.horizon}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.count}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.mean}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.median}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.positive}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.continuation}</th>
                          <th className="py-2.5 px-2 text-right">{copy.events.stdev}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {eventStudy.target.map((row) => (
                          <tr key={row.horizon} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-2 font-mono text-slate-300 light:text-slate-600">+{row.horizon}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-400 light:text-slate-500">{row.count}</td>
                            <td className={`py-2.5 px-2 text-right font-mono ${row.meanPct != null && row.meanPct >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>{formatPct(row.meanPct, 3)}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{formatPct(row.medianPct, 3)}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-300 light:text-slate-600">{row.positiveRatePct != null ? `${row.positiveRatePct.toFixed(1)}%` : '—'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-sky-400 light:text-sky-600">{row.continuationRatePct != null ? `${row.continuationRatePct.toFixed(1)}%` : '—'}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-500">{formatPct(row.stdevPct, 3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {eventStudy.episodes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{copy.events.noData}</div>
                ) : (
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-bold text-white light:text-slate-900">{copy.events.episodes}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{eventStudy.episodes.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-[11px]">
                        <thead className="border-b border-slate-800 text-[9px] font-mono uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="py-2.5 px-2">{copy.events.date}</th>
                            <th className="py-2.5 px-2">{copy.events.shock}</th>
                            <th className="py-2.5 px-2 text-right">+1</th>
                            <th className="py-2.5 px-2 text-right">+3</th>
                            <th className="py-2.5 px-2 text-right">+5</th>
                            <th className="py-2.5 px-2 text-right">+10</th>
                            <th className="py-2.5 px-2 text-right">{copy.events.benchmark}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {eventStudy.episodes.map((episode) => (
                            <tr key={`${episode.timestamp}-${episode.direction}`} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-2 font-mono text-slate-400">{shortDateFormatter.format(new Date(episode.timestamp))}</td>
                              <td className="py-2.5 px-2">
                                <span className={`inline-flex items-center gap-1 font-mono font-bold ${episode.direction === 'UP' ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                                  {episode.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {formatPct(episode.shockPct, 2)}
                                </span>
                              </td>
                              {episode.forward.map((value, index) => (
                                <td key={`t-${index}`} className={`py-2.5 px-2 text-right font-mono ${value != null && value >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                                  {formatPct(value, 2)}
                                </td>
                              ))}
                              <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                                {episode.benchmarkForward.length ? formatPct(episode.benchmarkForward[3] ?? episode.benchmarkForward[4], 2) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">
                {eventLoading ? copy.events.running : copy.events.note}
              </div>
            )}
          </div>
        )}

        {/* Reality tracker */}
        {tab === 'reality' && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 light:bg-white light:border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-black text-white light:text-slate-900 flex items-center gap-2">
                    <Radar className="w-5 h-5 text-orange-400" />
                    {copy.reality.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.reality.subtitle}</p>
                  <p className="mt-2 text-[10px] font-mono text-slate-500 inline-flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    {copy.reality.localOnly}
                  </p>
                </div>
                {simulation && selectedScenario?.available && (
                  <button
                    onClick={saveScenario}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {copy.reality.save}
                  </button>
                )}
              </div>

              {realityError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{realityError}</span>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 light:bg-white light:border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-violet-400 light:text-violet-600" />
                    {copy.reality.calibrationTitle}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 max-w-3xl">{copy.reality.calibrationSubtitle}</p>
                </div>
                <StatusPill tone={calibration.matured >= 5 ? 'emerald' : 'slate'}>
                  {calibration.matured} / 5
                </StatusPill>
              </div>

              {calibration.samples === 0 ? (
                <p className="mt-4 text-xs text-slate-500">{copy.reality.noCalibration}</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <Metric label={copy.reality.samples} value={formatNumber(calibration.samples)} />
                  <Metric label={copy.reality.maturedCount} value={formatNumber(calibration.matured)} />
                  <Metric label={copy.reality.inside50Rate} value={calibration.inside50RatePct != null ? `${calibration.inside50RatePct.toFixed(1)}%` : '—'} />
                  <Metric label={copy.reality.inside90Rate} value={calibration.inside90RatePct != null ? `${calibration.inside90RatePct.toFixed(1)}%` : '—'} />
                  <Metric label={copy.reality.bias} value={formatPct(calibration.meanBiasPct, 2)} tone={calibration.meanBiasPct != null && calibration.meanBiasPct >= 0 ? 'up' : 'down'} />
                  <Metric label={copy.reality.mae} value={formatPct(calibration.meanAbsoluteErrorPct, 2)} tone="warning" />
                </div>
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{copy.reality.mechanismNote}</p>
            </section>

            {records.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">{copy.reality.empty}</div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => {
                  const check = record.lastCheck;
                  const scenarioName = copy.scenario[record.scenarioId]?.name || record.scenarioId;
                  return (
                    <article key={record.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 light:bg-white light:border-slate-200">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white light:text-slate-900">{symbolLabel(record.symbol)}</span>
                            <span className="text-[10px] font-mono text-slate-500">{record.effectiveInterval}</span>
                            <StatusPill tone="cyan">{scenarioName}</StatusPill>
                            {check && <StatusPill tone={assessmentTone(check.assessment)}>{assessmentLabel(check.assessment)}</StatusPill>}
                            {check?.matured && <StatusPill tone="slate">{copy.reality.matured}</StatusPill>}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
                            <span>{copy.reality.created} {shortDateFormatter.format(new Date(record.createdAt))}</span>
                            <span>{copy.reality.baseline}: {formatPrice(record.baselinePrice)}</span>
                            <span>{copy.reality.expectedMedian}: {formatPct(record.expectedTerminalPct, 2)}</span>
                            <span>{copy.reality.horizon}: {record.horizon} {copy.controls.barsUnit}</span>
                            <span>{copy.reality.source}: {sourceLabel(record.source)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => void verifyRecord(record)}
                            disabled={checkingId === record.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-[10px] font-bold text-slate-300 light:text-slate-600 hover:border-cyan-500/40 hover:text-cyan-400 light:hover:text-cyan-700 disabled:opacity-50 light:bg-slate-50 light:border-slate-300"
                          >
                            {checkingId === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            {checkingId === record.id ? copy.reality.verifying : copy.reality.checkNow}
                          </button>
                          <button
                            onClick={() => deleteRecord(record)}
                            aria-label={copy.reality.delete}
                            className="rounded-lg border border-slate-700 p-2 text-slate-500 hover:text-rose-400 light:text-rose-600 hover:border-rose-500/40 light:border-slate-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {check ? (
                        <div className="mt-3 grid grid-cols-2 lg:grid-cols-6 gap-2.5">
                          <Metric label={copy.reality.lastPrice} value={formatPrice(check.lastPrice)} />
                          <Metric
                            label={copy.reality.observedReturn}
                            value={formatPct(check.observedReturnPct, 2)}
                            tone={check.observedReturnPct >= 0 ? 'up' : 'down'}
                          />
                          <Metric label={copy.reality.barsObserved} value={`${check.observedBars} / ${check.horizon}`} />
                          <Metric label={copy.reality.bracket} value={bracketLabel(check.bracket)} />
                          <Metric label={copy.reality.inside90} value={check.inside90 ? copy.reality.yes : copy.reality.no} tone={check.inside90 ? 'up' : 'down'} />
                          <Metric label={copy.reality.invalidated} value={check.invalidated ? copy.reality.yes : copy.reality.no} tone={check.invalidated ? 'down' : 'up'} />
                        </div>
                      ) : (
                        <p className="mt-3 text-[11px] text-slate-500">{copy.reality.noCheck}</p>
                      )}

                      {check && (check.warnings.length > 0 || check.coverageLimited) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {check.coverageLimited && (
                            <span className="rounded-full border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 text-[9px] font-mono text-amber-500">{copy.reality.coverageLimited}</span>
                          )}
                          {check.warnings.filter((warning) => warning !== 'COVERAGE_LIMITED').map((warning) => (
                            <span key={warning} className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] font-mono text-slate-500">{warningLabel(warning)}</span>
                          ))}
                        </div>
                      )}

                      {record.checkHistory.length > 0 && (
                        <details className="mt-3 group">
                          <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 light:text-slate-600">
                            {copy.reality.history} · {record.checkHistory.length}
                          </summary>
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full min-w-[520px] text-left text-[10px] font-mono">
                              <thead className="border-b border-slate-800 text-slate-500">
                                <tr>
                                  <th className="py-1.5 px-2">{copy.reality.lastCheck}</th>
                                  <th className="py-1.5 px-2 text-right">{copy.reality.barsObserved}</th>
                                  <th className="py-1.5 px-2 text-right">{copy.reality.observedReturn}</th>
                                  <th className="py-1.5 px-2 text-right">{copy.reality.bracket}</th>
                                  <th className="py-1.5 px-2 text-right">{copy.reality.assessment}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {record.checkHistory.slice().reverse().map((snapshot, index) => (
                                  <tr key={`${snapshot.at}-${index}`}>
                                    <td className="py-1.5 px-2 text-slate-400 light:text-slate-500">{dateFormatter.format(new Date(snapshot.at))}</td>
                                    <td className="py-1.5 px-2 text-right text-slate-400 light:text-slate-500">{snapshot.observedBars}</td>
                                    <td className={`py-1.5 px-2 text-right ${snapshot.observedReturnPct >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>{formatPct(snapshot.observedReturnPct, 2)}</td>
                                    <td className="py-1.5 px-2 text-right text-slate-400 light:text-slate-500">{bracketLabel(snapshot.bracket)}</td>
                                    <td className="py-1.5 px-2 text-right text-slate-300 light:text-slate-600">{assessmentLabel(snapshot.assessment)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 light:bg-white light:border-slate-200">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {copy.assumptions.limits}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {simulation?.assumptions.limitations.map((limit) => (
                  <span key={limit} className="rounded-lg border border-slate-700/70 bg-slate-950/30 px-2 py-1 text-[10px] text-slate-500 light:bg-slate-50 light:border-slate-200">
                    {copy.limitations[limit] || copy.assumptions.limits}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-slate-500 border-t border-slate-800/60 pt-4">
          {copy.disclaimer}
        </p>
      </div>
    </div>
  );
};
