import React, { useState } from 'react';
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
  Flame,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Bot,
  BarChart3
} from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const lastAnalysis = getLastAnalysis();
  const handleRunDebate = async () => {
    if (!getLastAnalysis()) { setError(MISSING_ANALYSIS_MSG); return; }
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
    } catch (err: any) {
      setError(err?.message || 'Erreur de communication avec le comité d\'agents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            {t.agents.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.agents.title}</h1>
          <p className="text-sm text-slate-400">
            {t.agents.subtitle}
          </p>
        </div>

        <button
          onClick={handleRunDebate}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/20 transition-all flex items-center gap-2 text-xs disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>{t.agents.launchingDebate}</span>
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              <span>{t.agents.launchDebateBtn}</span>
            </>
          )}
        </button>
      </div>

      {/* Configuration bar */}
      <div className="max-w-7xl mx-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t.extra.assetShort}</span>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-orange-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t.agents.timeframeLabel} :</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-200 focus:outline-none"
          >
            <option value="15M">15M</option>
            <option value="1H">1H</option>
            <option value="4H">4H</option>
            <option value="D1">{t.extra.dailyLabel}</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t.agents.contextPlaceholder}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {!lastAnalysis && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-wrap items-center gap-3">
          <span>{t.agents.missingAnalysis}</span>
          <button onClick={() => onNavigate('chart')} className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">{t.agents.goToChart}</button>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex flex-wrap items-center gap-3">
          <span>{error}</span>
          {error === MISSING_ANALYSIS_MSG && (<button onClick={() => onNavigate('chart')} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold">{t.agents.goToChart}</button>)}
        </div>
      )}

      {/* Consensus Summary Banner if ready */}
      {consensusData && (
        <div className="max-w-7xl mx-auto p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Arbitrage Final du Lead Analyst
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-3xl font-black px-5 py-2 rounded-xl tracking-wider ${
                  consensusData.consensusVerdict === 'BUY'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : consensusData.consensusVerdict === 'SELL'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                }`}
              >
                {consensusData.consensusVerdict}
              </span>
              <div>
                <div className="text-sm font-bold text-white">
                  Confiance Collégiale : {consensusData.consensusConfidence || 85}%
                </div>
                <div className="text-xs text-slate-400">
                  {consensusData.agents?.lead?.suggestedAction || 'Suivre scrupuleusement les règles du Risk Manager.'}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-md p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
            <span className="font-bold text-orange-400">{t.extra.executiveSynthesis}</span>
            <p className="text-slate-300 leading-relaxed">
              {consensusData.agents?.lead?.executiveSummary}
            </p>
            {consensusData.agents?.lead?.keyDisagreements && (
              <p className="text-amber-400/90 text-[11px] pt-1">
                <strong>{t.extra.disagreements}</strong> {consensusData.agents.lead.keyDisagreements}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6 Agents Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            key: 'technical',
            name: 'Technical Analyst',
            role: t.agents.roleTechnical,
            icon: TrendingUp,
            color: 'text-cyan-400',
            bg: 'border-cyan-500/30',
            data: consensusData?.agents?.technical,
            defaultDesc: t.agents.descTechnical,
          },
          {
            key: 'macro',
            name: 'Market Research Analyst',
            role: t.agents.roleMacro,
            icon: Globe,
            color: 'text-blue-400',
            bg: 'border-blue-500/30',
            data: consensusData?.agents?.macro,
            defaultDesc: t.agents.descMacro,
          },
          {
            key: 'risk',
            name: 'Risk Manager',
            role: t.agents.roleRisk,
            icon: Shield,
            color: 'text-emerald-400',
            bg: 'border-emerald-500/30',
            data: consensusData?.agents?.risk,
            defaultDesc: t.agents.descRisk,
          },
          {
            key: 'strategy',
            name: 'Strategy Analyst',
            role: t.agents.roleStrategy,
            icon: Compass,
            color: 'text-purple-400',
            bg: 'border-purple-500/30',
            data: consensusData?.agents?.strategy,
            defaultDesc: t.agents.descStrategy,
          },
          {
            key: 'redTeam',
            name: 'Red-Team Analyst',
            role: t.agents.roleRedTeam,
            icon: AlertTriangle,
            color: 'text-rose-400',
            bg: 'border-rose-500/30',
            data: consensusData?.agents?.redTeam,
            defaultDesc: t.agents.descRedTeam,
          },
          {
            key: 'lead',
            name: 'Lead Analyst',
            role: t.agents.roleLead,
            icon: Layers,
            color: 'text-orange-400',
            bg: 'border-orange-500/30',
            data: consensusData?.agents?.lead,
            defaultDesc: t.agents.descLead,
          },
        ].map((agent) => (
          <div
            key={agent.key}
            className={`p-6 rounded-2xl bg-slate-900/60 border ${agent.bg} flex flex-col justify-between space-y-4`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl bg-slate-800 ${agent.color}`}>
                    <agent.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <p className="text-[11px] text-slate-400">{agent.role}</p>
                  </div>
                </div>

                {agent.data?.stance && (
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      agent.data.stance.includes('BULL') || agent.data.stance.includes('APPROV')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : agent.data.stance.includes('BEAR') || agent.data.stance.includes('REJECT') || agent.data.stance.includes('TRAP')
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {agent.data.stance}
                  </span>
                )}
              </div>

              {agent.data ? (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {agent.data.argument || agent.data.critique || agent.data.executiveSummary}
                  </p>
                  {agent.data.keyLevel && (
                    <div className="text-[11px] font-mono text-cyan-400">
                      Niveau clé surveillé : <strong>{agent.data.keyLevel}</strong>
                    </div>
                  )}
                  {agent.data.counterHypothesis && (
                    <div className="text-[11px] text-rose-300">
                      <strong>{t.extra.adverseHypothesis}</strong> {agent.data.counterHypothesis}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {agent.defaultDesc}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>{t.agents.statusLabel} : {agent.data ? t.agents.statusReady : t.agents.statusStandby}</span>
              <span className="text-orange-400">JYNTRA Node</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
