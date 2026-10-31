import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserSession, LocalStore, STORAGE_KEYS, ChartAnalysisRecord, JournalEntry } from '../services/storage';
import { FinancialChartCanvas } from '../components/chart/FinancialChartCanvas';
import { AnnotatedChart, CandleLike } from '../components/chart/AnnotatedChart';
import { loadChartAnalysisState } from '../services/workflowStore';
import { startChartJob, loadChartJob, subscribeChartJob, resumeChartJob, type ChartJobState } from '../services/chartJob';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Upload,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Bot,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronDown,
  Eye,
  Check,
  ScanSearch
} from 'lucide-react';

interface ChartAnalysisPageProps {
  session: UserSession;
  initialImageBase64?: string;
  onNavigateToJarvis?: (contextAnalysis: any) => void;
  onNavigate: (route: string) => void;
}

/** Small, quiet metric cell used inside the decision card. */
const PlanStat: React.FC<{ label: string; value: any; accent?: string }> = ({ label, value, accent }) => (
  <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 px-2.5 py-2">
    <span className={`block text-[9px] font-mono uppercase tracking-wide ${accent || 'text-slate-500'}`}>{label}</span>
    <strong className="mt-0.5 block truncate font-mono text-[12px] font-bold text-slate-100">
      {value === null || value === undefined || value === '' ? '—' : value}
    </strong>
  </div>
);

export const ChartAnalysisPage: React.FC<ChartAnalysisPageProps> = ({
  session,
  initialImageBase64,
  onNavigateToJarvis,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [imageBase64, setImageBase64] = useState<string>(initialImageBase64 || '');
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'upload'>('canvas');
  const [candles, setCandles] = useState<CandleLike[]>([]);
  const [marketNote, setMarketNote] = useState<string>('');
  const [annotatedUrl, setAnnotatedUrl] = useState<string>('');
  const [workflowRunId, setWorkflowRunId] = useState<string>('');
  const [job, setJob] = useState<ChartJobState | null>(null);
  /** Image actually submitted to the analysis: the annotated chart keeps it. */
  const [analysisImage, setAnalysisImage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Restores both the last completed analysis and any job still running.
   * A running job is resumed from the server, so its real state and result are
   * shown again after navigation or a full reload.
   */
  useEffect(() => {
    const saved = loadChartAnalysisState();
    const running = loadChartJob();
    if (saved?.analysis) {
      setAnalysisResult(saved.analysis);
      if (saved.symbol) setSymbol(saved.symbol);
      if (saved.timeframe) setTimeframe(saved.timeframe);
      if (saved.workflowRunId) setWorkflowRunId(saved.workflowRunId);
      if (saved.imageBase64) {
        setImageBase64(saved.imageBase64);
        setAnalysisImage(saved.imageBase64);
        setActiveTab('upload');
      }
    }
    if (running) {
      setJob(running);
      setWorkflowRunId(running.workflowRunId);
      setSymbol(running.symbol);
      setTimeframe(running.timeframe);
      if (running.imageBase64) {
        setImageBase64(running.imageBase64);
        setAnalysisImage(running.imageBase64);
        setActiveTab('upload');
      }
      setLoading(running.status === 'queued' || running.status === 'running');
      if (running.status === 'error') setError(running.error || null);
      if (running.result?.analysis) setAnalysisResult(running.result.analysis);
      resumeChartJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live state of the real server job (works even if this page was unmounted).
  useEffect(() => {
    const sync = () => {
      const current = loadChartJob();
      if (!current) return;
      setJob(current);
      if (current.workflowRunId) setWorkflowRunId(current.workflowRunId);
      setLoading(current.status === 'queued' || current.status === 'running');
      if (current.status === 'error') setError(current.error || 'L’analyse n’a pas pu aboutir.');
      if (current.status === 'success' && current.result?.analysis) {
        setAnalysisResult(current.result.analysis);
        setError(null);
      }
    };
    sync();
    const unsubscribe = subscribeChartJob(sync);
    return unsubscribe;
  }, []);

  const fetchRealCandles = useCallback(async () => {
    const tfMap: Record<string, string> = { M5: '5m', M15: '15m', '1H': '1h', '4H': '4h', D1: '1d' };
    try {
      const clean = symbol.replace('/', '').toUpperCase();
      const r = await fetch(`/api/market/candles?symbol=${clean}&interval=${tfMap[timeframe] || '1h'}&limit=90`);
      const d = await r.json();
      if (d.success && Array.isArray(d.candles) && d.candles.length) { setCandles(d.candles); setMarketNote(`${d.source || 'Données réelles'} • ${d.candles.length} bougies`); return d; }
      setMarketNote(d.error || 'Données de marché indisponibles pour cet instrument.');
      return null;
    } catch { setMarketNote('Données de marché indisponibles (erreur réseau).'); return null; }
  }, [symbol, timeframe]);

  // Candles are only used for a live-canvas analysis. An uploaded screenshot is
  // kept as the real base image so annotations stay aligned with it.
  useEffect(() => {
    if (analysisResult && !analysisImage) fetchRealCandles();
  }, [analysisResult, analysisImage, fetchRealCandles]);

  /**
   * Downscales a screenshot before upload: the vision model does not need a
   * 4K file, and a bounded image can be persisted so the annotated chart is
   * still available after a reload.
   */
  const prepareImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const maxSide = 1600;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          if (scale === 1 && dataUrl.length < 1_300_000) return resolve(dataUrl);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch {
        resolve(dataUrl);
      }
    });

  // Handle image upload from computer (MT4 / MT5 screenshots)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (PNG ou JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const prepared = await prepareImage(reader.result as string);
      setImageBase64(prepared);
      setActiveTab('upload');
      setError(null);
    };
    reader.onerror = () => {
      setError('Impossible de lire l\'image sélectionnée.');
    };
    reader.readAsDataURL(file);
  };

  // Real analysis: the server runs it as an owner-scoped job. Navigation or a
  // reload never cancels it; the interface always reconnects to the real state.
  const handleAnalyze = async () => {
    if (loading) return;
    setError(null);
    setSaveSuccess(false);
    setAnnotatedUrl('');
    setCandles([]);
    setLoading(true);
    try {
      const prepared = imageBase64 ? await prepareImage(imageBase64) : '';
      if (prepared && prepared !== imageBase64) setImageBase64(prepared);
      setAnalysisImage(prepared);
      const state = await startChartJob({
        symbol,
        timeframe,
        customPrompt,
        imageBase64: prepared || undefined,
        userId: session.userId,
      });
      setJob(state);
      setWorkflowRunId(state.workflowRunId);
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau lors du lancement de l’analyse.');
      setLoading(false);
    }
  };

  // Persist current analysis
  const handleSaveToJournal = () => {
    if (!analysisResult) return;

    const recordId = 'anl_' + Date.now().toString(36);
    const newRecord: ChartAnalysisRecord = {
      id: recordId,
      userId: session.userId,
      title: `Analyse ${symbol} (${timeframe})`,
      symbol,
      timeframe,
      timestamp: Date.now(),
      modelUsed: 'jyntra',
      visualObservations: {
        instrumentDetected: analysisResult.instrument || symbol,
        timeframeDetected: analysisResult.timeframe || timeframe,
        trend: analysisResult.visualObservations?.trend || 'UNCERTAIN',
        supportResistance: [
          ...(analysisResult.visualObservations?.keySupports || []),
          ...(analysisResult.visualObservations?.keyResistances || []),
        ],
        liquidityZones: analysisResult.visualObservations?.liquidityZones || [],
        orderBlocks: analysisResult.visualObservations?.orderBlocks || [],
        fairValueGaps: analysisResult.visualObservations?.fairValueGaps || [],
        breakOfStructure: !!analysisResult.visualObservations?.breakOfStructure,
        changeOfCharacter: !!analysisResult.visualObservations?.changeOfCharacter,
      },
      aiInterpretation: analysisResult.technicalInterpretation || '',
      hypotheses: analysisResult.hypotheses || [],
      recommendation: analysisResult.recommendation || 'NO_TRADE',
      tradePlan: analysisResult.tradePlan
        ? {
            entry: analysisResult.tradePlan.entry || 0,
            stopLoss: analysisResult.tradePlan.stopLoss || 0,
            takeProfit: analysisResult.tradePlan.takeProfit1 || 0,
            takeProfit2: analysisResult.tradePlan.takeProfit2 || undefined,
            takeProfit3: analysisResult.tradePlan.takeProfit3 || undefined,
            riskRewardRatio: analysisResult.tradePlan.riskRewardRatio || 0,
            invalidationCondition: analysisResult.tradePlan.invalidationCondition || '',
          }
        : undefined,
      imageSnippet: imageBase64 ? imageBase64.substring(0, 200) + '...' : undefined,
      annotatedImage: annotatedUrl || undefined,
      workflowRunId: workflowRunId || undefined,
      provider: 'JYNTRA AI',
    };

    // Save to analyses storage
    const allAnalyses = LocalStore.get<ChartAnalysisRecord[]>(STORAGE_KEYS.ANALYSES, []);
    allAnalyses.push(newRecord);
    LocalStore.set(STORAGE_KEYS.ANALYSES, allAnalyses);

    // If trade recommendation is BUY or SELL, also create a journal draft entry
    if (analysisResult.recommendation === 'BUY' || analysisResult.recommendation === 'SELL') {
      const allJournal = LocalStore.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
      const newJournalEntry: JournalEntry = {
        id: 'jrn_' + Date.now().toString(36),
        userId: session.userId,
        symbol,
        direction: analysisResult.recommendation,
        timeframe,
        entryPrice: analysisResult.tradePlan?.entry || 0,
        stopLoss: analysisResult.tradePlan?.stopLoss || 0,
        takeProfit: analysisResult.tradePlan?.takeProfit1 || 0,
        size: 0.1,
        status: 'OPEN',
        notes: `Signal IA Vision (${analysisResult.visualObservations?.trend || 'Tendance'}). ${analysisResult.technicalInterpretation?.substring(0, 160)}...${workflowRunId ? ' Workflow: ' + workflowRunId : ''}`,
        imageUrl: annotatedUrl || undefined,
        tags: ['IA-Vision', timeframe, analysisResult.recommendation],
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
      };
      allJournal.push(newJournalEntry);
      LocalStore.set(STORAGE_KEYS.JOURNAL, allJournal);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleConsultJarvis = () => {
    if (onNavigateToJarvis && analysisResult) {
      onNavigateToJarvis({
        symbol,
        recommendation: analysisResult.recommendation,
        summary: analysisResult.technicalInterpretation,
        plan: analysisResult.tradePlan,
      });
    } else {
      onNavigate('jarvis');
    }
  };

  const isTrade = analysisResult
    ? ['BUY', 'SELL'].includes(String(analysisResult.recommendation).toUpperCase())
    : false;
  const confirmations: string[] = Array.isArray(analysisResult?.tradePlan?.confirmations)
    ? analysisResult.tradePlan.confirmations.filter((c: any) => typeof c === 'string' && c.trim())
    : [];
  const interpretationParagraphs: string[] = analysisResult?.technicalInterpretation
    ? String(analysisResult.technicalInterpretation)
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            {t.chart.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.chart.title}</h1>
          <p className="text-sm text-slate-400">
            {t.chart.subtitle}
          </p>
        </div>

        {analysisResult && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToJournal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all active:scale-95 shadow-md"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{t.chart.savedToJournal}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-orange-400" />
                  <span>Enregistrer dans le journal</span>
                </>
              )}
            </button>

            <button
              onClick={handleConsultJarvis}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
            >
              <Bot className="w-4 h-4" />
              <span>{t.chart.explainWithLynara}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Source & Canvas, Right AI Results */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image / Canvas selection (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Tabs: Live Candlestick vs MT4/MT5 Screenshot Upload */}
          <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'canvas' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.chart.tabLive}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'upload' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.chart.tabUpload}
            </button>
          </div>

          {activeTab === 'canvas' ? (
            <div className="space-y-3">
              <FinancialChartCanvas
                symbol={symbol.replace('/', '')}
                onSymbolChange={(s) => setSymbol(s)}
                onSnapshot={(b64) => {
                  setImageBase64(b64);
                }}
                height={380}
              />
              <p className="text-[11px] text-slate-400">
                {t.chart.liveFeedHint}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/80 group"
              >
                {imageBase64 ? (
                  <div className="space-y-3">
                    <img
                      src={imageBase64}
                      alt="Capture de graphique"
                      className="max-h-64 mx-auto rounded-lg object-contain shadow-lg border border-slate-800"
                    />
                    <div className="text-xs text-orange-400 font-medium group-hover:underline">
                      {t.chart.changeImage}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {t.chart.dropzoneTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {t.chart.dropzoneSubtitle}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              {t.chart.paramsTitle}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t.chart.instrumentLabel}</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="ex: EUR/USD, BTC/USDT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-orange-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t.chart.timeframeLabel}</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="M5">5 Minutes (M5)</option>
                  <option value="M15">15 Minutes (M15)</option>
                  <option value="1H">1 Heure (1H)</option>
                  <option value="4H">4 Heures (4H)</option>
                  <option value="D1">Journalier (D1)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.chart.customPromptLabel}
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t.chart.customPromptPlaceholder}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{t.chart.analyzingBtn}</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>{t.chart.analyzeBtn}</span>
                </>
              )}
            </button>
          </div>

          {job && (job.status === 'running' || job.status === 'queued') && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-orange-500/25 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-2 text-orange-400 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyse en cours · {job.steps?.filter((s) => s.status === 'success').length || 0}/{job.steps?.length || 8}
                </span>
                <span>Vous pouvez changer de page : l’analyse continue.</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(job.steps || []).map((s) => (
                  <div key={s.id} className="flex items-start gap-1.5 text-[10.5px] leading-tight">
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        s.status === 'success'
                          ? 'bg-emerald-400'
                          : s.status === 'error'
                          ? 'bg-rose-400'
                          : s.status === 'running'
                          ? 'animate-pulse bg-orange-400'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span className={s.status === 'success' ? 'text-slate-300' : s.status === 'running' ? 'text-orange-300' : 'text-slate-500'}>
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Structured AI Output (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {!analysisResult ? (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-orange-400 flex items-center justify-center mx-auto">
                <Eye className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">{t.chart.waitingTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.chart.waitingDesc}
                </p>
              </div>

              <div className="text-left max-w-sm mx-auto p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 font-mono">
                <div className="text-slate-300 font-bold text-xs uppercase mb-1">{t.chart.auditCriteria}</div>
                <div>&bull; {t.chart.crit1}</div>
                <div>&bull; {t.chart.crit2}</div>
                <div>&bull; {t.chart.crit3}</div>
                <div>&bull; {t.chart.crit4}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Compact decision card — YES/NO TRADE stays a small signal */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.14em] ${
                        isTrade
                          ? analysisResult.recommendation === 'BUY'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {isTrade ? t.chart.yesTradeLabel : t.chart.noTradeLabel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {analysisResult.recommendation} · {analysisResult.instrument} · {analysisResult.timeframe}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    {typeof analysisResult.confidence === 'number' && (
                      <span>{t.chart.confidenceLabel} <strong className="text-slate-200">{analysisResult.confidence}%</strong></span>
                    )}
                    {analysisResult.setupQuality && analysisResult.setupQuality !== 'NONE' && (
                      <span>{t.chart.setupQualityLabel} <strong className="text-slate-200">{analysisResult.setupQuality}</strong></span>
                    )}
                    <span className="hidden sm:inline text-orange-400">{t.chart.engineName}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {analysisResult.tradePlan && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <PlanStat label={t.chart.entryLabel} value={analysisResult.tradePlan.entry || t.chart.atMarket} accent="text-cyan-400" />
                      <PlanStat label={t.chart.stopLossLabel} value={analysisResult.tradePlan.stopLoss} accent="text-rose-400" />
                      <PlanStat label={t.chart.takeProfitLabel} value={analysisResult.tradePlan.takeProfit1} accent="text-emerald-400" />
                      <PlanStat label={t.chart.riskRewardLabel} value={analysisResult.tradePlan.riskRewardRatio ? `1 : ${analysisResult.tradePlan.riskRewardRatio}` : null} accent="text-sky-400" />
                      {analysisResult.tradePlan.takeProfit2 ? (
                        <PlanStat label={t.chart.takeProfit2Label} value={analysisResult.tradePlan.takeProfit2} accent="text-emerald-400" />
                      ) : null}
                      {analysisResult.tradePlan.takeProfit3 ? (
                        <PlanStat label={t.chart.takeProfit3Label} value={analysisResult.tradePlan.takeProfit3} accent="text-emerald-400" />
                      ) : null}
                    </div>
                  )}

                  {analysisResult.tradePlan?.invalidationCondition && (
                    <div className="p-3 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 text-[11px] text-rose-300/90 flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-400">{t.chart.invalidationTitle}</strong>{' '}
                        {analysisResult.tradePlan.invalidationCondition}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(workflowRunId || analysisResult.completeness || job) && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-300">
                    {t.chart.providerLabel} <strong className="text-orange-400">JYNTRA AI</strong>
                    {job && (job.status === 'running' || job.status === 'queued') && (
                      <span className="ml-2 text-slate-400">
                        · {job.steps?.filter((s) => s.status === 'success').length || 0}/{job.steps?.length || 8} étapes
                      </span>
                    )}
                  </div>
                  {analysisResult.completeness && <div className="text-slate-300">{t.chart.completenessLabel} <strong>{analysisResult.completeness.isComplete ? t.chart.sufficientLabel : t.chart.incompleteLabel}</strong>{Array.isArray(analysisResult.completeness.missing) && analysisResult.completeness.missing.length > 0 && <span> — {t.chart.missingLabel} {analysisResult.completeness.missing.join(', ')}{marketNote ? ` • ${t.chart.realDataUsedLabel} ${marketNote}` : ''}</span>}</div>}
                  {!analysisResult.completeness && marketNote && <div className="text-slate-400">{marketNote}</div>}
                  {workflowRunId && <button onClick={() => onNavigate('workflow')} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold">{t.chart.viewWorkflow}</button>}
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">{t.chart.annotatedImageTitle}</h3>
                <AnnotatedChart
                  analysis={analysisResult}
                  symbol={symbol}
                  timeframe={timeframe}
                  imageBase64={analysisImage || undefined}
                  candles={analysisImage ? [] : candles}
                  onReady={(d) => setAnnotatedUrl(d)}
                />
                <p className="text-[11px] text-slate-500">{t.chart.annotatedNote}</p>
              </div>

              {/* 1. Visual Observations */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                  <Eye className="w-4 h-4" /> {t.chart.visualObservationsTitle}
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">{t.chart.trendLabel}</span>
                    <strong className="text-white font-mono">
                      {analysisResult.visualObservations?.trend || t.chart.neutralLabel}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">{t.chart.smcLabel}</span>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                      <span className={analysisResult.visualObservations?.breakOfStructure ? 'text-emerald-400' : 'text-slate-500'}>
                        BOS: {analysisResult.visualObservations?.breakOfStructure ? t.chart.yesLabel : t.chart.noLabel}
                      </span>
                      <span>&bull;</span>
                      <span className={analysisResult.visualObservations?.changeOfCharacter ? 'text-cyan-400' : 'text-slate-500'}>
                        CHoCH: {analysisResult.visualObservations?.changeOfCharacter ? t.chart.yesLabel : t.chart.noLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Blocks & Liquidity */}
                {analysisResult.visualObservations?.orderBlocks?.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">{t.chart.orderBlocksLabel}</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {analysisResult.visualObservations.orderBlocks.map((ob: string, i: number) => (
                        <li key={i}>{ob}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.visualObservations?.liquidityZones?.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">{t.chart.liquidityLabel}</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {analysisResult.visualObservations.liquidityZones.map((lz: string, i: number) => (
                        <li key={i}>{lz}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.visualObservations?.fairValueGaps?.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="text-slate-400 font-semibold text-[11px]">FVG :</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {analysisResult.visualObservations.fairValueGaps.map((fvg: string, i: number) => (
                        <li key={i}>{fvg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 2. Market reading — short paragraphs, no wall of text */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {t.chart.marketReadingTitle}
                </h3>
                <div className="space-y-2.5 text-[13px] text-slate-300 leading-relaxed">
                  {interpretationParagraphs.length > 0 ? (
                    interpretationParagraphs.map((p, i) => (
                      <p key={i} className="whitespace-pre-line">{p}</p>
                    ))
                  ) : (
                    <p className="text-slate-500">{t.chart.neutralLabel}</p>
                  )}
                </div>
              </div>

              {/* 2b. Confirmations — only when the model actually listed them */}
              {confirmations.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-400">
                    {t.chart.confirmationsLabel}
                  </h4>
                  <ul className="space-y-1.5 text-[12px] text-slate-300">
                    {confirmations.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Conditional Hypotheses */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> {t.chart.hypothesesTitle}
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysisResult.hypotheses?.map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-amber-400 font-bold font-mono">H{i + 1}:</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Management Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  {analysisResult.riskWarning || t.chart.riskDisclaimer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
