import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { UserSession } from '../services/storage';
import {
  listWorkflowRuns,
  WorkflowRun,
  CHART_WORKFLOW_STEPS,
  loadChartAnalysisState,
  type WorkflowStepState,
  type StepStatus,
} from '../services/workflowStore';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Workflow,
  Play,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  Layers,
  Shield,
  FileText,
  Activity,
  Bot,
  ArrowRight,
  Clock
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: any;
  status: StepStatus;
  dataSummary?: string;
  rawPayload?: any;
  updatedAt?: number;
}

/** Icône associée à chaque étape réelle du pipeline d'analyse graphique. */
const NODE_ICONS: Record<string, any> = {
  reception: Activity,
  vision: TrendingUp,
  market: Cpu,
  ai: Bot,
  structures: Layers,
  risk: Shield,
  annotations: FileText,
  result: CheckCircle2,
};

/**
 * Workflow Studio.
 *
 * Cette page n'exécute plus de pipeline simulé : elle affiche l'exécution
 * réelle créée par l'Analyse Graphique (même identifiant d'exécution, mêmes
 * étapes, mêmes résultats techniques). Les exécutions et leurs erreurs sont
 * conservées après navigation et rechargement de la page.
 */
export const WorkflowStudioPage: React.FC<{ session: UserSession; onNavigate: (route: string) => void }> = ({
  session,
  onNavigate,
}) => {
  const { t, currentLang } = useLanguage();

  const LABELS = {
    fr: {
      savedRuns: 'Exécutions enregistrées',
      noRuns:
        "Aucun workflow exécuté pour le moment. Lancez une Analyse Graphique : l'exécution réelle apparaîtra ici et restera conservée après navigation.",
      openChart: 'Lancer une analyse graphique',
      backToChart: "Retourner à l'Analyse Graphique",
      emptyCanvas:
        "Le pipeline s'affiche ici dès qu'une analyse graphique réelle est lancée. Aucune étape n'est simulée sur cette page.",
      errorKept: 'Erreur conservée',
      progress: 'Étapes réussies',
      runInProgress: 'Exécution en cours',
      lastUpdate: 'Dernière mise à jour',
      noDetail: 'Aucune donnée transmise pour cette étape.',
    },
    en: {
      savedRuns: 'Recorded runs',
      noRuns:
        'No workflow has run yet. Launch a Chart Analysis: the real execution will appear here and will survive navigation.',
      openChart: 'Start a chart analysis',
      backToChart: 'Back to Chart Analysis',
      emptyCanvas:
        'The pipeline appears here as soon as a real chart analysis is launched. No step is simulated on this page.',
      errorKept: 'Stored error',
      progress: 'Completed steps',
      runInProgress: 'Run in progress',
      lastUpdate: 'Last update',
      noDetail: 'No data transmitted for this step.',
    },
    mg: {
      savedRuns: 'Famonoana voatahiry',
      noRuns:
        "Mbola tsy misy workflow natao. Atombohy ny Famakafakana Tabilao : hiseho eto ny tena famonoana ary hitoetra na dia miova pejy aza.",
      openChart: 'Atombohy ny famakafakana tabilao',
      backToChart: 'Hiverina any amin’ny Famakafakana Tabilao',
      emptyCanvas:
        "Hiseho eto ny pipeline raha vao manomboka famakafakana tabilao tena izy. Tsy misy dingana simba eto amin'ity pejy ity.",
      errorKept: 'Hadisoana voatahiry',
      progress: 'Dingana nahomby',
      runInProgress: 'Eo am-panatanterahana',
      lastUpdate: 'Fanavaozana farany',
      noDetail: 'Tsy misy angona nalefa ho an’ity dingana ity.',
    },
  };
  const L = LABELS[currentLang] || LABELS.fr;

  const nodeTitles: Record<string, string[]> = {
    fr: ['1. Ingestion Graphique', '2. Vision Multimodale', '3. Données de Marché', '4. Arbitrage Multi-Agents', '5. Calibrage du Risque', '6. Rapport Exécutif LYNARA'],
    en: ['1. Chart Ingestion', '2. Multimodal Vision', '3. Market Data', '4. Multi-Agent Arbitration', '5. Risk Calibration', '6. LYNARA Executive Report'],
    mg: ['1. Fampidirana Tabilao', '2. Fahitana Multimodal', '3. Angona Tsena', '4. Fitsarana Multi-Agents', '5. Fikirakirana Risika', '6. Tatitra Mpanatanteraka LYNARA'],
  };
  const nodeDescs: Record<string, string[]> = {
    fr: [
      'Réception du graphique importé et de son contexte de marché',
      'Lecture de l’image et détection des structures (OB, FVG, BOS, CHoCH)',
      'Récupération des bougies et cotations réelles du marché',
      'Analyse IA et arbitrage contradictoire des agents',
      'Dimensionnement de position et ratio Risque/Rendement',
      'Génération des annotations et du rapport final exploitable',
    ],
    en: [
      'Imported chart reception with its market context',
      'Image reading and structure detection (OB, FVG, BOS, CHoCH)',
      'Fetching real candles and market quotes',
      'AI analysis and contradictory agent arbitration',
      'Position sizing and Risk/Reward ratio',
      'Annotation rendering and final actionable report',
    ],
    mg: [
      'Fandraisana ny tabilao nampidirina sy ny toe-javatra tsena',
      'Famakiana ny sary sy fitadiavana rafitra (OB, FVG, BOS, CHoCH)',
      'Fakana ireo labozia sy vidiny tena izy',
      'Famakafakana AI sy adihevitra mifanohitra',
      'Kajy haben’ny position sy ratio Risika/Tombony',
      'Famokarana annotations sy tatitra farany azo ampiasaina',
    ],
  };

  const [persistedRuns, setPersistedRuns] = useState<WorkflowRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  useEffect(() => {
    const load = () => {
      const runs = listWorkflowRuns(session.userId);
      setPersistedRuns([...runs].reverse());
      setSelectedRunId((prev) => {
        if (prev && runs.some((r) => r.id === prev)) return prev;
        // Priorité à l'exécution liée à la dernière analyse graphique :
        // on affiche exactement le même run que celui de l'analyse.
        const linkedId = loadChartAnalysisState()?.workflowRunId as string | undefined;
        if (linkedId && runs.some((r) => r.id === linkedId)) return linkedId;
        return runs[runs.length - 1]?.id || '';
      });
    };
    load();
    window.addEventListener('jyntra_workflow_update', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('jyntra_workflow_update', load);
      window.removeEventListener('storage', load);
    };
  }, [session.userId]);

  const selectedRun = persistedRuns.find((r) => r.id === selectedRunId) || persistedRuns[0] || null;

  // Toutes les données affichées proviennent de l'exécution réelle persistée.
  const nodes: WorkflowNode[] = useMemo(() => {
    const source: WorkflowStepState[] = selectedRun?.steps ?? CHART_WORKFLOW_STEPS.map((s) => ({
      ...s,
      status: 'idle' as StepStatus,
    }));

    return source.map((s, index) => ({
      id: s.id,
      step: index + 1,
      title: nodeTitles[currentLang]?.[index] || s.title,
      description: nodeDescs[currentLang]?.[index] || '',
      icon: NODE_ICONS[s.id] || Activity,
      status: s.status,
      dataSummary: s.dataSummary,
      rawPayload: s.rawPayload,
      updatedAt: s.updatedAt,
    }));
  }, [selectedRun, currentLang]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('reception');

  useEffect(() => {
    if (!nodes.some((n) => n.id === selectedNodeId)) {
      const running = nodes.find((n) => n.status === 'running');
      const lastSuccess = [...nodes].reverse().find((n) => n.status === 'success');
      setSelectedNodeId(running?.id || lastSuccess?.id || nodes[0]?.id || 'reception');
    }
  }, [nodes, selectedNodeId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const successCount = nodes.filter((n) => n.status === 'success').length;
  const isRunning = selectedRun?.status === 'running';

  const formatTime = (ts?: number) => (ts ? new Date(ts).toLocaleString() : '—');

  /**
   * Disposition 4 × 2 en serpentin : les quatre premiers nœuds occupent la
   * première ligne (gauche → droite), le flux descend sur le quatrième nœud
   * puis repart de droite à gauche sur la seconde ligne. Sur les écrans plus
   * étroits (2 colonnes), l'ordre logique 1 → 8 est conservé.
   */
  const [isWideLayout, setIsWideLayout] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(min-width: 1024px)');
    const handle = () => setIsWideLayout(query.matches);
    handle();
    query.addEventListener('change', handle);
    return () => query.removeEventListener('change', handle);
  }, []);

  const layoutOrder = isWideLayout ? [0, 1, 2, 3, 7, 6, 5, 4] : [0, 1, 2, 3, 4, 5, 6, 7];
  const layoutNodes = layoutOrder.map((i) => nodes[i]).filter(Boolean);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canvasLayout, setCanvasLayout] = useState<{
    width: number;
    height: number;
    positions: Record<string, { x: number; y: number; w: number; h: number }>;
  }>({ width: 0, height: 0, positions: {} });

  const measureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      positions[id] = {
        x: rect.left - canvasRect.left,
        y: rect.top - canvasRect.top,
        w: rect.width,
        h: rect.height,
      };
    });
    setCanvasLayout((prev) => {
      const prevKeys = Object.keys(prev.positions);
      const nextKeys = Object.keys(positions);
      const unchanged =
        Math.abs(prev.width - canvasRect.width) < 0.5 &&
        Math.abs(prev.height - canvasRect.height) < 0.5 &&
        prevKeys.length === nextKeys.length &&
        nextKeys.every((id) => {
          const a = prev.positions[id];
          const b = positions[id];
          return a && b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5;
        });
      return unchanged ? prev : { width: canvasRect.width, height: canvasRect.height, positions };
    });
  }, []);

  useLayoutEffect(() => {
    measureCanvas();
    const observer = new ResizeObserver(measureCanvas);
    if (canvasRef.current) observer.observe(canvasRef.current);
    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    window.addEventListener('resize', measureCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureCanvas);
    };
  }, [measureCanvas, nodes.length, selectedRun?.id, currentLang, isWideLayout]);

  /** Courbe de Bézier entre deux nœuds, selon leur position réelle. */
  const buildConnector = (
    from: { x: number; y: number; w: number; h: number },
    to: { x: number; y: number; w: number; h: number }
  ) => {
    const sameRow = Math.abs(from.y - to.y) < Math.min(from.h, to.h) * 0.5;
    if (sameRow) {
      const direction = to.x > from.x ? 1 : -1;
      const sx = direction > 0 ? from.x + from.w : from.x;
      const sy = from.y + from.h / 2;
      const ex = direction > 0 ? to.x : to.x + to.w;
      const ey = to.y + to.h / 2;
      const curve = Math.max(36, Math.abs(ex - sx) * 0.55);
      return `M ${sx} ${sy} C ${sx + direction * curve} ${sy}, ${ex - direction * curve} ${ey}, ${ex} ${ey}`;
    }
    const downward = to.y > from.y;
    const sx = from.x + from.w / 2;
    const sy = downward ? from.y + from.h : from.y;
    const ex = to.x + to.w / 2;
    const ey = downward ? to.y : to.y + to.h;
    const curve = Math.max(28, Math.abs(ey - sy) * 0.55);
    return `M ${sx} ${sy} C ${sx} ${sy + (downward ? curve : -curve)}, ${ex} ${ey - (downward ? curve : -curve)}, ${ex} ${ey}`;
  };

  const connections = nodes.slice(0, -1).map((from, index) => {
    const to = nodes[index + 1];
    let state: 'idle' | 'pending' | 'active' | 'error' = 'idle';
    if (from.status === 'error' || to.status === 'error') state = 'error';
    else if (from.status === 'success') state = 'active';
    else if (from.status === 'running' || to.status === 'running') state = 'pending';
    return { from, to, state };
  });

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
            <Workflow className="w-3.5 h-3.5" />
            {t.workflow.badge}
          </div>
          <h1 className="text-3xl font-black text-white mt-1">{t.workflow.title}</h1>
          <p className="text-sm text-slate-400">{t.extra.workflowSubtitleLong}</p>
        </div>

        <button
          onClick={() => onNavigate('chart')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-orange-500/20 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? t.extra.workflowRunning : L.openChart}</span>
        </button>
      </div>

      {/* Exécutions réelles persistées (Analyse Graphique -> Workflow) */}
      <div className="max-w-7xl mx-auto w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white">{L.savedRuns}</h2>
          {selectedRun && (
            <span className="text-[11px] font-mono text-slate-500">
              {selectedRun.id} · {formatTime(selectedRun.updatedAt)}
            </span>
          )}
        </div>

        {persistedRuns.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">{L.noRuns}</p>
            <button
              onClick={() => onNavigate('chart')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-colors"
            >
              {L.openChart}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {persistedRuns.map((r) => {
                const isActive = selectedRun?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                    title={`${r.id} — ${new Date(r.createdAt).toLocaleString()}`}
                  >
                    {r.symbol} {r.timeframe} • {r.status} • {new Date(r.createdAt).toLocaleTimeString()}
                  </button>
                );
              })}
            </div>

            {selectedRun && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {L.lastUpdate} : {formatTime(selectedRun.updatedAt)}
                  </span>
                  <span>
                    {L.progress} : {successCount}/{nodes.length}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      selectedRun.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : selectedRun.status === 'error'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {selectedRun.status === 'running' ? L.runInProgress : selectedRun.status}
                  </span>
                </div>

                {selectedRun.error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                    <span>
                      <strong>{L.errorKept} :</strong> {selectedRun.error}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => onNavigate('chart')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-colors"
                >
                  {L.backToChart}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Connected Node Canvas with Real Connecting Cables */}
      <div className="max-w-7xl mx-auto p-6 rounded-2xl bg-gradient-to-b from-[#0c1017] to-[#070a0f] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-orange-400 animate-pulse' : 'bg-cyan-400'}`} />
            <span>{t.extra.workflowNodesTitle}</span>
            {selectedRun && <span className="text-slate-600">· {selectedRun.symbol} {selectedRun.timeframe}</span>}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-500 inline-block" />{' '}
              {currentLang === 'mg' ? 'Tariby Miasa' : currentLang === 'en' ? 'Active Cable' : 'Câble Actif'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> {t.extra.dataTransmitted}
            </span>
          </div>
        </div>

        {!selectedRun && (
          <div className="relative z-10 mb-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
            {L.emptyCanvas}
          </div>
        )}

        <div ref={canvasRef} className="relative z-10">
          {/* Câbles mesurés dans le DOM : courbes fluides entre les nœuds réels. */}
          <svg
            className="hidden lg:block absolute inset-0 pointer-events-none z-0"
            width={canvasLayout.width}
            height={canvasLayout.height}
            viewBox={`0 0 ${canvasLayout.width || 1} ${canvasLayout.height || 1}`}
            aria-hidden="true"
          >
            <defs>
              <filter id="workflow-flow-glow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {connections.map(({ from, to, state }) => {
              const fromPos = canvasLayout.positions[from.id];
              const toPos = canvasLayout.positions[to.id];
              if (!fromPos || !toPos) return null;
              const path = buildConnector(fromPos, toPos);
              const stroke =
                state === 'active' ? '#10b981' : state === 'pending' ? '#06b6d4' : state === 'error' ? '#f43f5e' : '#334155';
              return (
                <g key={`${from.id}-${to.id}`}>
                  <path d={path} fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={state === 'idle' ? 1.5 : 2.25}
                    strokeLinecap="round"
                    strokeDasharray={state === 'pending' ? '6 5' : undefined}
                    opacity={state === 'idle' ? 0.8 : 1}
                  >
                    {state === 'pending' && (
                      <animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.9s" repeatCount="indefinite" />
                    )}
                  </path>
                  {state === 'active' && (
                    <>
                      <circle r="3.2" fill="#a7f3d0" filter="url(#workflow-flow-glow)">
                        <animateMotion dur="1.9s" repeatCount="indefinite" path={path} />
                      </circle>
                      <circle r="1.8" fill="#ecfdf5">
                        <animateMotion dur="1.9s" repeatCount="indefinite" path={path} />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-x-12 lg:gap-y-20 auto-rows-fr">
            {layoutNodes.map((node) => {
              const index = nodes.findIndex((n) => n.id === node.id);
              const isSelected = selectedNodeId === node.id;
              const isSuccess = node.status === 'success';
              const isRunningNode = node.status === 'running';
              const isError = node.status === 'error';

              return (
                <div key={node.id} className="relative flex flex-col items-center h-full">
                  <div
                    ref={(el) => {
                      cardRefs.current[node.id] = el;
                    }}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full h-full min-h-[190px] p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-slate-900 border-orange-500 shadow-xl shadow-orange-500/20'
                        : 'bg-slate-950/90 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                  {index > 0 && (
                    <div
                      className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                        isSuccess
                          ? 'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/50'
                          : isRunningNode
                          ? 'bg-orange-500 border-white animate-ping'
                          : isError
                          ? 'bg-rose-500 border-rose-300'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                      title={t.extra.inputPort}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  )}

                  {index < nodes.length - 1 && (
                    <div
                      className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                        isSuccess
                          ? 'bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/50'
                          : isRunningNode
                          ? 'bg-orange-500 border-white'
                          : isError
                          ? 'bg-rose-500 border-rose-300'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                      title={t.extra.outputPort}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                        {currentLang === 'mg' ? 'NODE' : currentLang === 'en' ? 'NODE' : 'NŒUD'} #{node.step}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isSuccess
                            ? 'bg-emerald-400'
                            : isRunningNode
                            ? 'bg-orange-500 animate-ping'
                            : isError
                            ? 'bg-rose-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl transition-colors ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isRunningNode
                            ? 'bg-orange-500/10 text-orange-400 animate-pulse'
                            : isError
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <node.icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-white leading-tight">{node.title}</h3>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{node.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 mt-3 text-[10px] font-mono flex items-center justify-between">
                    <span className="text-slate-500">{t.extra.statusColon}</span>
                    {isSuccess ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {currentLang === 'mg' ? 'Nalefa' : currentLang === 'en' ? 'Transmitted' : 'Transmis'}
                      </span>
                    ) : isRunningNode ? (
                      <span className="text-orange-400 font-bold animate-pulse">{t.extra.calculating}</span>
                    ) : isError ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {currentLang === 'mg' ? 'Tsy nahomby' : currentLang === 'en' ? 'Failed' : 'Échec'}
                      </span>
                    ) : (
                      <span className="text-slate-500">{currentLang === 'mg' ? 'Miandry' : currentLang === 'en' ? 'Waiting' : 'En attente'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Selected Node Data Stream Inspector */}
      {selectedNode && (
        <div className="max-w-7xl mx-auto rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-orange-400">
                <selectedNode.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{selectedNode.title}</h2>
                <p className="text-xs text-slate-400">{selectedNode.description}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                selectedNode.status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : selectedNode.status === 'running'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                  : selectedNode.status === 'error'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {t.extra.statusColon} {selectedNode.status}
            </span>
          </div>

          {selectedNode.updatedAt && (
            <p className="text-[11px] font-mono text-slate-500">
              {L.lastUpdate} : {formatTime(selectedNode.updatedAt)}
            </p>
          )}

          {selectedNode.dataSummary && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <strong>{t.extra.outgoingSummary}</strong> {selectedNode.dataSummary}
            </div>
          )}

          {selectedNode.rawPayload ? (
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2 font-mono">{t.extra.outgoingJson}</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72">
                {JSON.stringify(selectedNode.rawPayload, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              {selectedRun ? L.noDetail : t.extra.workflowHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
