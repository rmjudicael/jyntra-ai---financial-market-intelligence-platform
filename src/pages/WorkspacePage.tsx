import React, { useState, useEffect } from 'react';
import { UserSession, LocalStore, STORAGE_KEYS, ChartAnalysisRecord, JournalEntry } from '../services/storage';
import { FinancialChartCanvas } from '../components/chart/FinancialChartCanvas';
import { useLanguage } from '../i18n/LanguageContext';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Bot,
  Shield,
  BarChart2,
  BookOpen,
  ArrowRight,
  Zap,
  Activity,
  Compass,
  Clock,
  Plus
} from 'lucide-react';

interface WorkspacePageProps {
  session: UserSession;
  onNavigate: (route: string) => void;
  onOpenAnalysisWithImage?: (base64: string) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ session, onNavigate, onOpenAnalysisWithImage }) => {
  const { t } = useLanguage();
  const [analyses, setAnalyses] = useState<ChartAnalysisRecord[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [tickers, setTickers] = useState<any[]>([]);

  useEffect(() => {
    // Load local storage items
    const savedAnalyses = LocalStore.get<ChartAnalysisRecord[]>(STORAGE_KEYS.ANALYSES, []);
    setAnalyses(savedAnalyses.filter((a) => a.userId === session.userId));

    const savedJournal = LocalStore.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
    setJournal(savedJournal.filter((j) => j.userId === session.userId));

    // Fetch real tickers
    fetch('/api/market/ticker')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.tickers) setTickers(d.tickers);
      })
      .catch(() => {});
  }, [session.userId]);

  const closedTrades = journal.filter((j) => j.status === 'CLOSED');
  const winningTrades = closedTrades.filter((j) => (j.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const totalPnL = closedTrades.reduce((acc, curr) => acc + (curr.pnl || 0), 0);

  const handleChartSnapshot = (base64: string) => {
    if (onOpenAnalysisWithImage) {
      onOpenAnalysisWithImage(base64);
    }
    onNavigate('chart');
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t.extra.secureSession}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t.workspace.welcome}, <span className="text-orange-400">{session.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.workspace.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('chart')}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t.workspace.newAnalysisBtn}
          </button>
          <button
            onClick={() => onNavigate('lynara')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Bot className="w-4 h-4" />
            {t.workspace.consultLynaraBtn}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">{t.workspace.metricAnalyses}</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{analyses.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.workspace.metricAnalysesSub}</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">{t.workspace.metricTrades}</div>
          <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">{journal.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{closedTrades.length} {t.workspace.metricTradesSub}</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">{t.workspace.metricWinRate}</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{winRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{t.workspace.metricWinRateSub}</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">{t.workspace.metricPnL}</div>
          <div className={`text-2xl font-black mt-1 font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{t.workspace.metricPnLSub}</div>
        </div>
      </div>

      {/* Live Chart Centerpiece */}
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              {t.workspace.chartTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.workspace.chartSubtitle}
            </p>
          </div>
          <button
            onClick={() => onNavigate('chart')}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            {t.workspace.chartDeepAnalysisBtn} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <FinancialChartCanvas symbol="BTCUSDT" onSnapshot={handleChartSnapshot} height={380} />
      </div>

      {/* Quick Launchpad Modules Grid */}
      <div className="max-w-7xl mx-auto space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          {t.workspace.quickModulesTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'chart', title: t.nav.chartAnalysis, desc: t.chart.subtitle, icon: TrendingUp, color: 'text-orange-400', border: 'border-orange-500/20 hover:border-orange-500/50' },
            { id: 'jarvis', title: t.nav.lynara3d, desc: t.lynara.roleDesc, icon: Bot, color: 'text-cyan-400', border: 'border-cyan-500/20 hover:border-cyan-500/50' },
            { id: 'agents', title: t.nav.multiAgents, desc: t.agents.subtitle, icon: Layers, color: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-500/50' },
            { id: 'risk', title: t.nav.risk, desc: t.risk.subtitle, icon: Shield, color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
            { id: 'backtest', title: t.nav.backtest, desc: t.backtest.subtitle, icon: BarChart2, color: 'text-cyan-300', border: 'border-cyan-500/20 hover:border-cyan-500/50' },
            { id: 'workflow', title: t.nav.workflow, desc: t.workflow.subtitle, icon: Zap, color: 'text-blue-400', border: 'border-blue-500/20 hover:border-blue-500/50' },
          ].map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className={`p-5 rounded-xl bg-slate-900/60 border ${card.border} text-left transition-all hover:bg-slate-900 hover:scale-[1.01] flex flex-col justify-between group`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg bg-slate-800/80 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Saved Analyses */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            {t.workspace.recentAnalysesTitle}
          </h2>
          <span className="text-xs text-slate-400">{analyses.length} {t.extra.archivedCount}</span>
        </div>

        {analyses.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-400">
              {t.workspace.recentAnalysesEmpty}
            </p>
            <button
              onClick={() => onNavigate('chart')}
              className="px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-semibold"
            >
              {t.workspace.createFirstAnalysis}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.slice(-3).reverse().map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">{rec.symbol}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.recommendation === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : rec.recommendation === 'SELL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {rec.recommendation}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    TF: {rec.timeframe} &bull; {new Date(rec.timestamp).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {rec.aiInterpretation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{t.extra.modelLabel}: JYNTRA</span>
                  <button
                    onClick={() => onNavigate('chart')}
                    className="text-orange-400 font-semibold hover:underline"
                  >
                    {t.extra.openLink}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
