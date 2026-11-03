import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserSession, LocalStore, STORAGE_KEYS, ChartAnalysisRecord, JournalEntry } from '../services/storage';
import { FinancialChartCanvas } from '../components/chart/FinancialChartCanvas';
import { AnnotatedChart, CandleLike } from '../components/chart/AnnotatedChart';
import { loadChartAnalysisState } from '../services/workflowStore';
import { startChartJob, loadChartJob, subscribeChartJob, resumeChartJob, type ChartJobState } from '../services/chartJob';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell3D } from '../components/3d/PageShell3D';
import {
  Upload,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Bot,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  Check,
  ScanSearch,
  Trash2,
  X,
  Maximize2,
  Download,
  Droplets,
  Layers,
  Box,
  Crosshair,
  Target,
  Gauge,
  ListChecks,
} from 'lucide-react';

interface ChartAnalysisPageProps {
  session: UserSession;
  initialImageBase64?: string;
  onNavigateToJarvis?: (contextAnalysis: any) => void;
  onNavigate: (route: string) => void;
}

/**
 * Humanises machine labels for display only (`NO_TRADE` → `NO TRADE`).
 * Technical values sent to the backend, stored or used in calculations are
 * never touched: this helper only formats what the user sees.
 */
const prettyLabel = (value: any): string => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
};

/** Small, quiet metric cell used inside the decision card. */
const PlanStat: React.FC<{ label: string; value: any; accent?: string }> = ({ label, value, accent }) => (
  <div className="rounded-md bg-slate-950/60 border border-slate-800/60 px-2.5 py-1.5">
    <span className={`block text-[10px] font-mono uppercase tracking-wide ${accent || 'text-slate-500'}`}>{label}</span>
    <strong className="mt-0.5 block truncate font-mono text-[13px] font-semibold text-slate-100">
      {prettyLabel(value)}
    </strong>
  </div>
);

/** Consistent card heading used by every result section. */
const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; accent?: string }> = ({
  icon,
  title,
  accent = 'text-orange-400',
}) => (
  <h3 className={`text-[11px] font-semibold uppercase tracking-[0.12em] font-mono flex items-center gap-2 ${accent}`}>
    {icon}
    <span>{title}</span>
  </h3>
);

/** Label/value row used by structure and plan sections. */
const DataRow: React.FC<{ label: string; value: any; accent?: string }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between gap-3 rounded-md bg-slate-950/60 border border-slate-800/60 px-2.5 py-1.5">
    <span className="text-[10px] font-mono uppercase tracking-wide text-slate-500">{label}</span>
    <strong className={`font-mono text-[13px] font-semibold ${accent || 'text-slate-100'}`}>
      {prettyLabel(value)}
    </strong>
  </div>
);

const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
);

/** Converts the generated canvas data URL into a Blob for reliable mobile downloads. */
const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
    const [meta, base64] = dataUrl.split(',');
    if (!base64) return null;
    const mime = /data:([^;]+)/.exec(meta)?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
};

/** Bullet list for the really-returned text zones (never invented). */
const ZoneList: React.FC<{ items: any[]; empty: string; tone?: string }> = ({ items, empty, tone = 'text-slate-300' }) => {
  if (!items.length) return <EmptyHint>{empty}</EmptyHint>;
  return (
    <ul className="space-y-1.5 text-[12.5px] leading-relaxed">
      {items.map((item, i) => (
        <li key={i} className={`flex items-start gap-2 ${tone}`}>
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-70" />
          <span>{prettyLabel(item)}</span>
        </li>
      ))}
    </ul>
  );
};

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
  /** Muse Image generated result URL when requested. */
  const [museImageUrl, setMuseImageUrl] = useState<string>('');
  /** Whether to request Muse Image generation for the annotated chart. */
  const [preferMuseImage, setPreferMuseImage] = useState<boolean>(false);
  /** Zoom modal state for the annotated chart. */
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clearedRef = useRef<boolean>(false);

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
      if (running.result?.museImage) setMuseImageUrl(running.result.museImage);
      resumeChartJob();
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const current = loadChartJob();
      if (!current) return;
      setJob(current);
      if (current.workflowRunId) setWorkflowRunId(current.workflowRunId);
      setLoading(current.status === 'queued' || current.status === 'running');
      if (current.status === 'error') setError(current.error || 'L’analyse n’a pas pu aboutir.');
      if (current.status === 'success' && current.result?.analysis && !clearedRef.current) {
        setAnalysisResult(current.result.analysis);
        if (current.result.museImage) setMuseImageUrl(current.result.museImage);
        setError(null);
      }
    };
    sync();
    const unsubscribe = subscribeChartJob(sync);
    return unsubscribe;
  }, []);

  // Lock the page behind the viewer and allow closing it with Escape.
  useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsZoomed(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isZoomed]);

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

  useEffect(() => {
    if (analysisResult && !analysisImage) fetchRealCandles();
  }, [analysisResult, analysisImage, fetchRealCandles]);

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

  /** Full reset: original image, generated image, analysis, temporary states. */
  const handleClearImage = () => {
    clearedRef.current = true;
    if (loading) {
      setLoading(false);
    }
    setImageBase64('');
    setAnalysisImage('');
    setAnalysisResult(null);
    setAnnotatedUrl('');
    setMuseImageUrl('');
    setPreferMuseImage(false);
    setError(null);
    setLoading(false);
    setJob(null);
    setWorkflowRunId('');
    setCustomPrompt('');
    setMarketNote('');
    setCandles([]);
    setSaveSuccess(false);
    setIsZoomed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (loading) return;
    clearedRef.current = false;
    setError(null);
    setSaveSuccess(false);
    setAnnotatedUrl('');
    setIsZoomed(false);
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
        preferMuseImage,
        userId: session.userId,
      });
      setJob(state);
      setWorkflowRunId(state.workflowRunId);
    } catch (err: any) {
      setError(err?.message || 'Erreur réseau lors du lancement de l’analyse.');
      setLoading(false);
    }
  };

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

    const allAnalyses = LocalStore.get<ChartAnalysisRecord[]>(STORAGE_KEYS.ANALYSES, []);
    allAnalyses.push(newRecord);
    LocalStore.set(STORAGE_KEYS.ANALYSES, allAnalyses);

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

  /**
   * Downloads the generated annotated chart (the canvas output).
   * The imported source image is deliberately never used as a fallback: it
   * does not contain the annotations, so it must not be presented as the
   * result of the analysis.
   */
  const handleDownloadAnnotated = () => {
    if (!annotatedUrl) return;
    const blob = dataUrlToBlob(annotatedUrl);
    const objectUrl = blob ? URL.createObjectURL(blob) : annotatedUrl;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `jyntra-analyse-${symbol.replace(/[^\w-]/g, '')}-${timeframe}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (blob) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  };

  const handleConsultJarvis = () => {
    if (onNavigateToJarvis && analysisResult) {
      // Pass the real analysis (plan, structure, hypotheses) so LYNARA can
      // answer from the same verified context instead of a short summary.
      onNavigateToJarvis({
        ...analysisResult,
        symbol,
        timeframe,
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

  const visual = analysisResult?.visualObservations || {};
  const structure = analysisResult?.structure || {};
  const plan = analysisResult?.tradePlan || {};
  const keySupports: any[] = Array.isArray(visual.keySupports) ? visual.keySupports : [];
  const keyResistances: any[] = Array.isArray(visual.keyResistances) ? visual.keyResistances : [];
  const orderBlocks: any[] = Array.isArray(visual.orderBlocks) ? visual.orderBlocks : [];
  const liquidityZones: any[] = Array.isArray(visual.liquidityZones) ? visual.liquidityZones : [];
  const fairValueGaps: any[] = Array.isArray(visual.fairValueGaps) ? visual.fairValueGaps : [];
  const hasTradePlan = Boolean(
    plan.entry || plan.stopLoss || plan.takeProfit1 || plan.takeProfit2 || plan.takeProfit3 || plan.riskRewardRatio,
  );
  const openZoom = () => setIsZoomed(true);

  return (
    <PageShell3D scene="chart" secondaryOnly secondaryVariant="chart" className="min-h-screen text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            {t.chart.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.chart.title}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.chart.subtitle}
          </p>
        </div>

        {analysisResult && (
          <div className="flex flex-wrap items-center gap-3">
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

      {/* Workspace: analysis source on the left, generated result on the right */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Image / Canvas selection + configuration */}
        <div className={`lg:col-span-5 space-y-4 ${analysisResult ? 'order-2 lg:order-1' : 'order-1'}`}>
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
                className="border border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900/80 group"
              >
                {imageBase64 ? (
                  <div className="relative space-y-3">
                    <img
                      src={imageBase64}
                      alt="Capture de graphique"
                      className="max-h-64 mx-auto rounded-lg object-contain shadow-lg border border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearImage(); }}
                      title="Supprimer l'image et l'analyse"
                      className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 hover:text-rose-400 transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
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
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 font-mono">
              {t.chart.paramsTitle}
            </h3>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="flex items-center gap-3 px-2">
              <input
                id="muse-image"
                type="checkbox"
                checked={preferMuseImage}
                onChange={(e) => setPreferMuseImage(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="muse-image" className="text-xs text-slate-300 cursor-pointer">
                {t.chart.museImageToggle}
              </label>
              {preferMuseImage && (
                <span className="text-[10px] text-orange-400/80 font-mono">
                  {t.chart.museImageHint}
                </span>
              )}
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
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
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
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: generated image + decision */}
        <div className={`lg:col-span-7 space-y-4 ${analysisResult ? 'order-1 lg:order-2' : 'order-2'}`}>
          {!analysisResult ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-orange-400 flex items-center justify-center mx-auto">
                <Eye className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">{t.chart.waitingTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.chart.waitingDesc}
                </p>
              </div>

              <div className="text-left max-w-sm mx-auto p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-mono">
                <div className="text-slate-300 font-bold text-xs uppercase mb-1">{t.chart.auditCriteria}</div>
                <div>&bull; {t.chart.crit1}</div>
                <div>&bull; {t.chart.crit2}</div>
                <div>&bull; {t.chart.crit3}</div>
                <div>&bull; {t.chart.crit4}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Generated annotated chart (the only image used by zoom + download) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SectionTitle icon={<ImageIcon className="w-4 h-4" />} title={t.chart.annotatedImageTitle} accent="text-emerald-400" />
                  {annotatedUrl && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80"
                      title={t.chart.annotatedImageTitle}
                      aria-label={t.chart.annotatedImageTitle}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div
                  className="relative group cursor-zoom-in rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  onClick={openZoom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openZoom();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t.chart.zoomChart}
                >
                  <AnnotatedChart
                    analysis={analysisResult}
                    symbol={symbol}
                    timeframe={timeframe}
                    imageBase64={analysisImage || undefined}
                    candles={analysisImage ? [] : candles}
                    onReady={setAnnotatedUrl}
                  />

                  {/* Enlarge icon: bottom-right, inside the generated image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openZoom();
                    }}
                    className="absolute bottom-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/40 bg-slate-950/80 text-orange-300 shadow-lg backdrop-blur-sm transition-all hover:bg-orange-500 hover:text-white active:scale-95"
                    title={t.chart.zoomChart}
                    aria-label={t.chart.zoomChart}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <span className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/75 px-3 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-sm sm:inline-flex">
                    <Maximize2 className="w-3 h-3" />
                    {t.chart.clickToZoom}
                  </span>
                </div>

                <p className="text-xs text-slate-500">{t.chart.annotatedNote}</p>
              </div>

              {/* Download stays a standalone action below the image, never overlaid */}
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleDownloadAnnotated}
                  disabled={!annotatedUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {t.chart.downloadChart}
                </button>
                {!annotatedUrl && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {t.chart.generatingImageLabel}
                  </span>
                )}
              </div>

              {/* Trade decision */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <SectionTitle icon={<Crosshair className="w-4 h-4" />} title={t.chart.tradeDecisionTitle} accent="text-orange-400" />
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] ${
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
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    {typeof analysisResult.confidence === 'number' && (
                      <span>{t.chart.confidenceLabel} <strong className="text-slate-200">{analysisResult.confidence}%</strong></span>
                    )}
                    {analysisResult.setupQuality && analysisResult.setupQuality !== 'NONE' && (
                      <span>{t.chart.setupQualityLabel} <strong className="text-slate-200">{prettyLabel(analysisResult.setupQuality)}</strong></span>
                    )}
                    <span className="hidden sm:inline text-orange-400">{t.chart.engineName}</span>
                  </div>
                </div>

                <div className="p-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-mono uppercase tracking-wide text-slate-500">{t.chart.recommendationLabel}</span>
                    <strong
                      className={`mt-0.5 block text-xl font-black tracking-tight ${
                        analysisResult.recommendation === 'BUY'
                          ? 'text-emerald-400'
                          : analysisResult.recommendation === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {prettyLabel(analysisResult.recommendation || 'NO TRADE')}
                    </strong>
                    <span className="mt-0.5 block text-xs font-mono text-slate-400">
                      {analysisResult.instrument || symbol} · {analysisResult.timeframe || timeframe}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right">
                    <PlanStat
                      label={t.chart.confidenceLabel}
                      value={typeof analysisResult.confidence === 'number' ? `${analysisResult.confidence}%` : null}
                      accent="text-cyan-400"
                    />
                    <PlanStat
                      label={t.chart.setupQualityLabel}
                      value={analysisResult.setupQuality && analysisResult.setupQuality !== 'NONE' ? analysisResult.setupQuality : null}
                      accent="text-sky-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Provider / completeness — centered strip, full width */}
      {analysisResult && (workflowRunId || analysisResult.completeness || job) && (
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto flex w-full flex-col items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-center text-xs sm:flex-row sm:flex-wrap sm:text-left">
            <span className="text-slate-400">
              {t.chart.providerLabel} <strong className="text-orange-400">JYNTRA AI</strong>
              {job && (job.status === 'running' || job.status === 'queued') && (
                <span className="ml-2 text-slate-500">
                  · {job.steps?.filter((s) => s.status === 'success').length || 0}/{job.steps?.length || 8} étapes
                </span>
              )}
            </span>

            {analysisResult.completeness && (
              <span className="text-slate-400">
                {t.chart.completenessLabel}{' '}
                <strong className="text-slate-200">
                  {analysisResult.completeness.isComplete ? t.chart.sufficientLabel : t.chart.incompleteLabel}
                </strong>
                {Array.isArray(analysisResult.completeness.missing) && analysisResult.completeness.missing.length > 0 && (
                  <span>
                    {' '}— {t.chart.missingLabel} {analysisResult.completeness.missing.join(', ')}
                    {marketNote ? ` • ${t.chart.realDataUsedLabel} ${marketNote}` : ''}
                  </span>
                )}
              </span>
            )}

            {!analysisResult.completeness && marketNote && <span className="text-slate-400">{marketNote}</span>}

            {workflowRunId && (
              <button
                onClick={() => onNavigate('workflow')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700"
              >
                {t.chart.viewWorkflow}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full-width analysis: every real result is spread across the page */}
      {analysisResult && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          {/* 1. Factual visual observation */}
          <div className="md:col-span-1 xl:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Eye className="w-4 h-4" />} title={t.chart.visualObservationsTitle} accent="text-cyan-400" />

            <div className="grid grid-cols-2 gap-3">
              <PlanStat label={t.chart.trendLabel} value={visual.trend || t.chart.neutralLabel} accent="text-cyan-400" />
              <PlanStat label={t.chart.smcLabel} value={`BOS ${visual.breakOfStructure ? t.chart.yesLabel : t.chart.noLabel} · CHoCH ${visual.changeOfCharacter ? t.chart.yesLabel : t.chart.noLabel}`} accent="text-sky-400" />
            </div>

            {visual.marketStructure && (
              <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 px-3 py-2.5">
                <span className="block text-[10px] font-mono uppercase tracking-wide text-slate-500">{t.chart.marketStructureLabel}</span>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-300">{prettyLabel(visual.marketStructure)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 px-3 py-2">
                <span className="block text-[10px] font-mono uppercase tracking-wide text-slate-500">{t.chart.instrumentLabel}</span>
                <strong className="mt-0.5 block truncate font-mono text-[13px] font-semibold text-slate-100">{analysisResult.instrument || symbol}</strong>
              </div>
              <div className="rounded-lg bg-slate-950/70 border border-slate-800/70 px-3 py-2">
                <span className="block text-[10px] font-mono uppercase tracking-wide text-slate-500">{t.chart.timeframeLabel}</span>
                <strong className="mt-0.5 block truncate font-mono text-[13px] font-semibold text-slate-100">{analysisResult.timeframe || timeframe}</strong>
              </div>
            </div>
          </div>

          {/* 2. Market reading */}
          <div className="md:col-span-1 xl:col-span-7 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title={t.chart.marketReadingTitle} accent="text-orange-400" />
            <div className="space-y-2.5 text-[13px] text-slate-300 leading-relaxed">
              {interpretationParagraphs.length > 0 ? (
                interpretationParagraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))
              ) : (
                <EmptyHint>{t.chart.noElementDetected}</EmptyHint>
              )}
            </div>
          </div>

          {/* 3. Confirmations */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2.5">
            <SectionTitle icon={<ListChecks className="w-4 h-4" />} title={t.chart.confirmationsLabel} accent="text-emerald-400" />
            {confirmations.length > 0 ? (
              <ul className="space-y-1.5 text-[12.5px] text-slate-300">
                {confirmations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint>{t.chart.noElementDetected}</EmptyHint>
            )}
          </div>

          {/* 4. Structure analysis */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<ScanSearch className="w-4 h-4" />} title={t.chart.structureAnalysisTitle} accent="text-sky-400" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <DataRow label="BOS" value={visual.breakOfStructure ? t.chart.yesLabel : t.chart.noLabel} accent={visual.breakOfStructure ? 'text-emerald-400' : 'text-slate-400'} />
              <DataRow label="CHoCH" value={visual.changeOfCharacter ? t.chart.yesLabel : t.chart.noLabel} accent={visual.changeOfCharacter ? 'text-cyan-400' : 'text-slate-400'} />
              <DataRow label="BOS LEVEL" value={structure.bosLevel} accent="text-sky-300" />
              <DataRow label="CHoCH LEVEL" value={structure.chochLevel} accent="text-purple-300" />
              <DataRow label={t.chart.lastSwingHighLabel} value={structure.lastSwingHigh} accent="text-orange-300" />
              <DataRow label={t.chart.lastSwingLowLabel} value={structure.lastSwingLow} accent="text-cyan-300" />
            </div>
          </div>

          {/* 5. Support & resistance */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<TrendingUp className="w-4 h-4" />} title={t.chart.supportResistanceTitle} accent="text-cyan-400" />
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wide text-cyan-400">{t.chart.supportLabel}</span>
                {keySupports.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {keySupports.map((s, i) => (
                      <span key={i} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-mono text-xs font-semibold text-cyan-300">
                        {prettyLabel(s)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1"><EmptyHint>{t.chart.noElementDetected}</EmptyHint></div>
                )}
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wide text-orange-400">{t.chart.resistanceLabel}</span>
                {keyResistances.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {keyResistances.map((r, i) => (
                      <span key={i} className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-1 font-mono text-xs font-semibold text-orange-300">
                        {prettyLabel(r)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1"><EmptyHint>{t.chart.noElementDetected}</EmptyHint></div>
                )}
              </div>
            </div>
          </div>

          {/* 6. Liquidity */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Droplets className="w-4 h-4" />} title={t.chart.liquidityTitle} accent="text-amber-400" />
            <ZoneList items={liquidityZones} empty={t.chart.noElementDetected} tone="text-amber-200/90" />
          </div>

          {/* 7. Fair value gap */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Layers className="w-4 h-4" />} title={t.chart.fairValueGapTitle} accent="text-fuchsia-400" />
            <ZoneList items={fairValueGaps} empty={t.chart.noElementDetected} tone="text-fuchsia-200/90" />
          </div>

          {/* 8. Order block */}
          <div className="md:col-span-1 xl:col-span-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Box className="w-4 h-4" />} title={t.chart.orderBlockTitle} accent="text-blue-400" />
            <ZoneList items={orderBlocks} empty={t.chart.noElementDetected} tone="text-blue-200/90" />
          </div>

          {/* 9. Entry / stop loss / take profit */}
          <div className="md:col-span-2 xl:col-span-7 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Target className="w-4 h-4" />} title={t.chart.entryStopTakeProfitTitle} accent="text-cyan-400" />
            {hasTradePlan ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <PlanStat label={t.chart.entryLabel} value={plan.entry || t.chart.atMarket} accent="text-cyan-400" />
                <PlanStat label={t.chart.stopLossLabel} value={plan.stopLoss} accent="text-rose-400" />
                <PlanStat label={t.chart.takeProfitLabel} value={plan.takeProfit1} accent="text-emerald-400" />
                <PlanStat label={t.chart.takeProfit2Label} value={plan.takeProfit2} accent="text-emerald-400" />
                <PlanStat label={t.chart.takeProfit3Label} value={plan.takeProfit3} accent="text-emerald-400" />
                <PlanStat label={t.chart.riskRewardLabel} value={plan.riskRewardRatio ? `1 : ${plan.riskRewardRatio}` : null} accent="text-sky-400" />
              </div>
            ) : (
              <EmptyHint>{t.chart.noElementDetected}</EmptyHint>
            )}
          </div>

          {/* 10. Risk / reward */}
          <div className="md:col-span-2 xl:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<Gauge className="w-4 h-4" />} title={t.chart.riskRewardTitle} accent="text-sky-400" />
            <div className="grid grid-cols-2 gap-2">
              <PlanStat label={t.chart.riskRewardLabel} value={plan.riskRewardRatio ? `1 : ${plan.riskRewardRatio}` : null} accent="text-sky-400" />
              <PlanStat label={t.chart.confidenceLabel} value={typeof analysisResult.confidence === 'number' ? `${analysisResult.confidence}%` : null} accent="text-cyan-400" />
            </div>
            {plan.invalidationCondition ? (
              <div className="p-3 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 text-xs text-rose-300/90 flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-400">{t.chart.invalidationTitle}</strong>{' '}
                  {plan.invalidationCondition}
                </div>
              </div>
            ) : (
              <EmptyHint>{t.chart.noElementDetected}</EmptyHint>
            )}
          </div>

          {/* 11. Conditional hypotheses */}
          <div className="md:col-span-2 xl:col-span-7 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <SectionTitle icon={<HelpCircle className="w-4 h-4" />} title={t.chart.hypothesesTitle} accent="text-amber-400" />
            {Array.isArray(analysisResult.hypotheses) && analysisResult.hypotheses.length > 0 ? (
              <ul className="space-y-2 text-[12.5px] text-slate-300">
                {analysisResult.hypotheses.map((h: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-amber-400 font-bold font-mono">H{i + 1}:</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint>{t.chart.noElementDetected}</EmptyHint>
            )}
          </div>

          {/* 12. Risk disclaimer */}
          <div className="md:col-span-2 xl:col-span-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 min-h-full">
            <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed text-xs text-slate-400">
              {analysisResult.riskWarning || t.chart.riskDisclaimer}
            </div>
          </div>

          {/* Optional Muse Image output — kept separate from the verified annotated chart */}
          {museImageUrl && (
            <div className="md:col-span-2 xl:col-span-12 p-4 rounded-xl bg-orange-900/20 border border-orange-500/30 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> {t.chart.museImageTitle}
              </h3>
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
                <img src={museImageUrl} alt="Chart généré par Muse Image" className="max-h-80 w-full object-contain mx-auto" />
                <button
                  onClick={() => setMuseImageUrl('')}
                  className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 transition-colors z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-orange-400/70">
                {t.chart.museImageNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen viewer — portal to <body> so no navbar or page layer can cover it */}
      {isZoomed && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setIsZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.chart.annotatedImageTitle}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-6xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-rose-500/80 sm:-right-3 sm:-top-3"
              title={t.chart.closeViewer}
              aria-label={t.chart.closeViewer}
            >
              <X className="h-5 w-5" />
            </button>

            {annotatedUrl ? (
              <img
                src={annotatedUrl}
                alt={t.chart.annotatedImageTitle}
                className="max-h-[86vh] w-auto max-w-full rounded-xl border border-white/10 object-contain shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-12 text-slate-300">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-400" />
                <span className="text-xs font-mono">{t.chart.generatingImageLabel}</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

    </PageShell3D>
  );
};
