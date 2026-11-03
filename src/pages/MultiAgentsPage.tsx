import React, { useMemo, useState } from 'react';
import { UserSession } from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { getLastAnalysis, MISSING_ANALYSIS_MSG } from '../utils/prerequisites';
import {
  Layers,
  Shield,
  TrendingUp,
  Globe,
  Compass,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gauge,
  GitBranch,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import { AgentAI3D } from '../components/3d/AgentAI3D';
import { AgentsAmbient3D } from '../components/3d/AgentsAmbient3D';

type AgentStatus = 'idle' | 'analyzing' | 'completed' | 'error';

interface AgentDef {
  key: string;
  code: string;
  name: string;
  role: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hex: string;
}

export const MultiAgentsPage: React.FC<{ session: UserSession; onNavigate: (route: string) => void }> = ({
  session,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1H');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [consensusData, setConsensusData] = useState<any | null>(null);
  const [redTeamInvoked, setRedTeamInvoked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastAnalysis = getLastAnalysis();

  const agents: AgentDef[] = useMemo(
    () => [
      { key: 'technical', code: 'AG-01', name: 'Technical Agent', role: t.agents.roleTechnical, desc: t.agents.descTechnical, icon: TrendingUp, hex: '#22d3ee' },
      { key: 'macro', code: 'AG-02', name: 'Macro Agent', role: t.agents.roleMacro, desc: t.agents.descMacro, icon: Globe, hex: '#3b82f6' },
      { key: 'risk', code: 'AG-03', name: 'Risk Agent', role: t.agents.roleRisk, desc: t.agents.descRisk, icon: Shield, hex: '#10b981' },
      { key: 'strategy', code: 'AG-04', name: 'Strategy Agent', role: t.agents.roleStrategy, desc: t.agents.descStrategy, icon: Compass, hex: '#a78bfa' },
      { key: 'redTeam', code: 'AG-05', name: 'Red-Team Agent', role: t.agents.roleRedTeam, desc: t.agents.descRedTeam, icon: AlertTriangle, hex: '#fb7185' },
      { key: 'lead', code: 'AG-06', name: 'Lead Analyst', role: t.agents.roleLead, desc: t.agents.descLead, icon: Layers, hex: '#f97316' },
    ],
    [t],
  );

  const handleRunDebate = async () => {
    if (!getLastAnalysis()) {
      setError(MISSING_ANALYSIS_MSG);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/multi-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe, contextData: context, priorAnalysis: getLastAnalysis() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la délibération.');
      }
      setConsensusData(data.consensus);
      setRedTeamInvoked(Boolean(data.redTeamInvoked));
    } catch (err: any) {
      setError(err?.message || "Erreur de communication avec le comité d'agents.");
      setConsensusData(null);
    } finally {
      setLoading(false);
    }
  };

  const prerequisiteError = error === MISSING_ANALYSIS_MSG;
  const globalStatus: AgentStatus = error && !prerequisiteError ? 'error' : loading ? 'analyzing' : consensusData ? 'completed' : 'idle';

  const agentStatus = (key: string): AgentStatus => {
    if (globalStatus === 'analyzing') return 'analyzing';
    if (globalStatus === 'error') return 'error';
    if (globalStatus === 'completed') return consensusData?.agents?.[key] ? 'completed' : 'idle';
    return 'idle';
  };

  const statusLabel = (status: AgentStatus) =>
    status === 'analyzing'
      ? t.agents.statusAnalyzing
      : status === 'completed'
        ? t.agents.statusReady
        : status === 'error'
          ? t.agents.statusError
          : t.agents.statusStandby;

  const statusTone: Record<AgentStatus, string> = {
    idle: 'text-slate-400',
    analyzing: 'text-amber-300',
    completed: 'text-emerald-300',
    error: 'text-rose-400',
  };

  const receivedCount = consensusData
    ? agents.filter((agent) => Boolean(consensusData?.agents?.[agent.key])).length
    : 0;

  const verdict: string | undefined = consensusData?.consensusVerdict;
  const verdictDisplay = verdict ? verdict.replace(/_/g, ' ') : undefined;
  const confidence =
    typeof consensusData?.consensusConfidence === 'number' && Number.isFinite(consensusData.consensusConfidence)
      ? Math.max(0, Math.min(100, consensusData.consensusConfidence))
      : null;
  const lead = consensusData?.agents?.lead;

  const verdictTone =
    verdict === 'BUY'
      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
      : verdict === 'SELL'
        ? 'bg-rose-500 text-white shadow-rose-500/30'
        : 'bg-amber-500 text-slate-950 shadow-amber-500/30';

  const stanceTone = (stance?: string) => {
    const value = (stance || '').toUpperCase();
    if (/BULL|APPROV|HIGH_PROB|VALIDAT/.test(value)) return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
    if (/BEAR|REJECT|RISK_HIGH|TRAP|LOW_EDGE/.test(value)) return 'border-rose-500/30 bg-rose-500/15 text-rose-300';
    return 'border-amber-500/30 bg-amber-500/15 text-amber-300';
  };

  const agentFields = (key: string, data: any) => {
    if (!data) return [];
    const fields: { label: string; value: React.ReactNode }[] = [];
    if (key === 'technical' && data.keyLevel) fields.push({ label: t.agents.keyLevelLabel, value: data.keyLevel });
    if (key === 'macro' && data.macroFactor) fields.push({ label: t.agents.macroFactorLabel, value: data.macroFactor });
    if (key === 'risk' && data.maxRiskRecommended) fields.push({ label: t.agents.maxRiskLabel, value: data.maxRiskRecommended });
    if (key === 'strategy' && data.expectedEdge) fields.push({ label: t.agents.expectedEdgeLabel, value: data.expectedEdge });
    if (key === 'redTeam' && data.counterHypothesis) fields.push({ label: t.extra.adverseHypothesis.replace(/\s*:\s*$/, ''), value: data.counterHypothesis });
    if (key === 'lead' && data.keyDisagreements) fields.push({ label: t.extra.disagreements.replace(/\s*:\s*$/, ''), value: data.keyDisagreements });
    return fields;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080B10] text-slate-100">
      <AgentsAmbient3D className="absolute inset-0 z-0 opacity-30" />
      {/* Voile de protection visuelle : au-dessus de la 3D, sous le contenu. */}
      <div
        aria-hidden="true"
        className="jyntra-private-3d-veil pointer-events-none absolute inset-0 z-[1]"
      />
      <div className="relative z-10">
      {/* ── Command deck ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-slate-800/80">
        <div aria-hidden="true" className="ja-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-orange-400">
                <Bot className="h-3.5 w-3.5" />
                {t.agents.badge}
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                {t.agents.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{t.agents.subtitle}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-900/70 px-2 py-1 text-slate-300">
                  <GitBranch className="h-3 w-3 text-orange-400" />6 agents · 1 verdict
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-900/70 px-2 py-1 text-slate-300">
                  <ShieldAlert className="h-3 w-3 text-emerald-400" />
                  Risk Manager obligatoire
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-900/70 px-2 py-1 text-slate-300">
                  <Gauge className="h-3 w-3 text-cyan-400" />
                  {receivedCount > 0 ? `${receivedCount}/6 rapports reçus` : 'Aucune donnée simulée'}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 lg:w-auto lg:items-end">
              <button
                onClick={handleRunDebate}
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.agents.launchingDebate}</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    <span>{t.agents.launchDebateBtn}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              <p className="text-center font-mono text-[10px] leading-relaxed text-slate-500 lg:text-right">
                {t.agents.metaEngineNotice}
              </p>
            </div>
          </div>

          {/* Pipeline: the six specialised nodes of one system */}
          <div className="mt-6 rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{t.agents.pipelineTitle}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">JYNTRA CORE · 6 NODES</span>
            </div>
            <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {agents.map((agent, index) => {
                const status = agentStatus(agent.key);
                const Icon = agent.icon;
                return (
                  <li
                    key={agent.key}
                    className="relative flex min-w-0 items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/50 px-2 py-1.5 transition-colors"
                    style={{ borderColor: status === 'completed' ? `${agent.hex}55` : undefined }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${agent.hex}1f`, color: agent.hex }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-300">{agent.name.replace(' Agent', '')}</div>
                      <div className={`truncate font-mono text-[9px] ${statusTone[status]}`}>{statusLabel(status)}</div>
                    </div>
                    {index < agents.length - 1 && (
                      <span aria-hidden="true" className="absolute -right-1.5 top-1/2 hidden h-px w-3 bg-slate-700 xl:block" />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Configuration */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[150px]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{t.extra.assetShort.replace(/\s*:\s*$/, '')}</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-bold text-orange-400 focus:border-orange-500/60 focus:outline-none"
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1 sm:w-[130px]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{t.agents.timeframeLabel}</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs font-bold text-slate-200 focus:border-orange-500/60 focus:outline-none"
              >
                <option value="15M">15M</option>
                <option value="1H">1H</option>
                <option value="4H">4H</option>
                <option value="D1">{t.extra.dailyLabel}</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[220px]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{t.agents.contextPlaceholder}</span>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={t.agents.contextPlaceholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-orange-500/60 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {!lastAnalysis && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">{t.agents.missingAnalysis}</span>
            <button onClick={() => onNavigate('chart')} className="rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-slate-950">
              {t.agents.goToChart}
            </button>
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            {prerequisiteError && (
              <button onClick={() => onNavigate('chart')} className="rounded-lg bg-rose-500 px-3 py-1.5 font-bold text-white">
                {t.agents.goToChart}
              </button>
            )}
          </div>
        )}

        {/* Lead Analyst synthesis — only from real returned data */}
        {consensusData && (
          <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="border-b border-slate-800 p-5 sm:p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-orange-400">
                  <Layers className="h-3.5 w-3.5" />
                  {t.agents.consensusVerdict}
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <span className={`rounded-xl px-5 py-2 text-2xl font-black tracking-wider shadow-lg sm:text-3xl ${verdictTone}`}>
                    {verdictDisplay || '—'}
                  </span>
                  {confidence !== null && (
                    <div className="pb-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{t.agents.confidenceScore}</div>
                      <div className="text-2xl font-black text-white">{confidence}%</div>
                    </div>
                  )}
                </div>

                {confidence !== null && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-slate-300">
                    {consensusData.symbol || symbol}
                  </span>
                  <span className="rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-slate-300">
                    {consensusData.timeframe || timeframe}
                  </span>
                  {redTeamInvoked && (
                    <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">
                      Red-Team Meta activé
                    </span>
                  )}
                  <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    {receivedCount}/6 rapports
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6 lg:col-span-7">
                {lead?.executiveSummary ? (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{t.extra.executiveSynthesis}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{lead.executiveSummary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">{t.agents.synthesisUnavailable}</p>
                )}

                {lead?.keyDisagreements && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400">{t.extra.disagreements}</div>
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/90">{lead.keyDisagreements}</p>
                  </div>
                )}

                {lead?.suggestedAction && (
                  <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">{t.agents.actionLabel}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{lead.suggestedAction}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Results header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">{t.agents.resultsTitle}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{t.agents.resultsHint}</p>
          </div>
          <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 font-mono text-[10px] ${
            globalStatus === 'completed'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : globalStatus === 'analyzing'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : globalStatus === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400'
          }`}>
            <span className="relative flex h-2 w-2">
              {globalStatus === 'analyzing' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${
                globalStatus === 'completed' ? 'bg-emerald-400' : globalStatus === 'analyzing' ? 'bg-amber-400' : globalStatus === 'error' ? 'bg-rose-400' : 'bg-slate-500'
              }`} />
            </span>
            {statusLabel(globalStatus)}
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const data = consensusData?.agents?.[agent.key];
            const status = agentStatus(agent.key);
            const fields = agentFields(agent.key, data);
            const isLead = agent.key === 'lead';
            return (
              <article
                key={agent.key}
                className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-slate-900/50 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/80 ${
                  status === 'completed' ? 'border-slate-700/80' : status === 'error' ? 'border-rose-500/40' : 'border-slate-800'
                }`}
                style={status === 'completed' ? { borderColor: `${agent.hex}40`, boxShadow: `0 18px 40px -30px ${agent.hex}` } : undefined}
              >
                <div aria-hidden="true" className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${agent.hex}, ${agent.hex}00)` }} />

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
                        <AgentAI3D variant={agent.key as 'technical' | 'macro' | 'risk' | 'strategy' | 'redTeam' | 'lead'} status={status} hex={agent.hex} className="h-full w-full" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-mono text-[9px] tracking-[0.18em] text-slate-500">{agent.code}</span>
                          <span className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider ${statusTone[status]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabel(status)}
                          </span>
                        </div>
                        <h3 className="mt-0.5 text-sm font-black uppercase tracking-wide text-white">{agent.name}</h3>
                        <p className="text-[10px] leading-snug text-slate-400">{agent.role}</p>
                      </div>
                    </div>

                    {data?.stance && (
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${stanceTone(data.stance)}`}>
                        {data.stance}
                      </span>
                    )}
                    {isLead && data?.verdict && !data?.stance && (
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${stanceTone(verdict)}`}>
                        {data.verdict.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex-1">
                    {data ? (
                      <p key={`${agent.key}-body`} className="ja-result rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-300">
                        {data.argument || data.critique || data.executiveSummary || '—'}
                      </p>
                    ) : status === 'analyzing' ? (
                      <div className="space-y-2" aria-hidden="true">
                        <div className="ja-shimmer h-2.5 w-full rounded-full" />
                        <div className="ja-shimmer h-2.5 w-11/12 rounded-full" />
                        <div className="ja-shimmer h-2.5 w-4/5 rounded-full" />
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-slate-500">{agent.desc}</p>
                    )}
                  </div>

                  {fields.length > 0 && (
                    <dl className="mt-3 grid grid-cols-1 gap-1.5">
                      {fields.map((field, index) => (
                        <div key={index} className="flex flex-wrap items-baseline gap-x-2 rounded-lg border border-slate-800/70 bg-slate-950/40 px-2.5 py-1.5">
                          <dt className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{field.label}</dt>
                          <dd className="min-w-0 break-words text-[11px] font-semibold text-slate-200">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/70 pt-3 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      {status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock3 className="h-3 w-3" />}
                      {statusLabel(status)}
                    </span>
                    <span className="text-slate-600">NODE · {agent.code}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
      </div>
    </div>
  );
};
