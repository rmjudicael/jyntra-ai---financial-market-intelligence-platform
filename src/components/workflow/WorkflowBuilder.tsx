import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '../NotificationSystem';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  FileJson,
  Layers,
  LineChart,
  Loader2,
  Newspaper,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Workflow,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { UserSession } from '../../services/storage';
import {
  BLOCK_LIBRARY,
  WorkflowBlock,
  WorkflowBlockKind,
  WorkflowBlueprint,
  WorkflowExecution,
  buildContext,
  createBlock,
  createBlueprintFromTemplate,
  createEmptyBlueprint,
  deleteBlueprint,
  deleteExecution,
  exportExecution,
  listBlueprints,
  listExecutions,
  nextPendingIndex,
  reorderBlocks,
  resumeExecution,
  runBlueprint,
  saveBlueprint,
  WORKFLOW_TEMPLATES,
} from '../../services/workflowBuilder';

const BLOCK_ICONS: Record<WorkflowBlockKind, React.ComponentType<{ className?: string }>> = {
  market: Activity,
  candles: LineChart,
  news: Newspaper,
  chart: Layers,
  agents: Bot,
  risk: ShieldCheck,
  ai: BrainCircuit,
};

const STATUS_STYLE: Record<string, string> = {
  idle: 'border-slate-700 bg-slate-800/50 text-slate-400',
  running: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

export const WorkflowBuilder: React.FC<{ session: UserSession }> = ({ session }) => {
  const { t, currentLang } = useLanguage();

  const L = useMemo(() => {
    const labels = {
      fr: {
        title: 'Orchestrateur de workflows',
        subtitle: 'Construisez, configurez et exécutez des enchaînements réels. Chaque bloc appelle une opération vérifiable.',
        templates: 'Modèles',
        newWorkflow: 'Nouveau workflow',
        empty: 'Créez un workflow à partir d’un modèle ou ajoutez un premier bloc.',
        name: 'Nom du workflow',
        save: 'Enregistrer',
        saved: 'Enregistré',
        run: 'Exécuter',
        running: 'Exécution…',
        resume: 'Reprendre',
        relaunch: 'Relancer',
        delete: 'Supprimer',
        addBlock: 'Ajouter un bloc',
        moveUp: 'Monter',
        moveDown: 'Descendre',
        remove: 'Retirer',
        config: 'Configuration',
        output: 'Sortie réelle',
        noOutput: 'Ce bloc n’a pas encore été exécuté.',
        lastRun: 'Dernière exécution',
        noRun: 'Aucune exécution pour ce workflow.',
        status: 'Statut',
        export: 'Copier le JSON',
        copied: 'JSON copié',
        blocked: 'Bloc en échec',
        resumeHint: 'Les blocs réussis sont réutilisés : aucun appel payant n’est répété.',
        fresh: 'Aucune exécution',
        symbol: 'Actif',
        timeframe: 'Unité de temps',
        interval: 'Intervalle',
        limit: 'Nombre de bougies',
        newsLimit: 'Nombre de titres',
        prompt: 'Consigne de synthèse',
        account: 'Capital du compte',
        riskPercent: 'Risque par trade (%)',
        minRR: 'R:R minimum (veto)',
        liveData: 'Données réelles',
        honest: 'Un bloc sans donnée réelle échoue explicitement : rien n’est simulé.',
      },
      en: {
        title: 'Workflow orchestrator',
        subtitle: 'Build, configure and execute real chains. Each block performs a verifiable operation.',
        templates: 'Templates',
        newWorkflow: 'New workflow',
        empty: 'Create a workflow from a template or add a first block.',
        name: 'Workflow name',
        save: 'Save',
        saved: 'Saved',
        run: 'Run',
        running: 'Running…',
        resume: 'Resume',
        relaunch: 'Run again',
        delete: 'Delete',
        addBlock: 'Add a block',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove',
        config: 'Configuration',
        output: 'Real output',
        noOutput: 'This block has not run yet.',
        lastRun: 'Latest execution',
        noRun: 'No execution for this workflow.',
        status: 'Status',
        export: 'Copy JSON',
        copied: 'JSON copied',
        blocked: 'Failed block',
        resumeHint: 'Successful blocks are reused: no paid call is repeated.',
        fresh: 'Not run',
        symbol: 'Asset',
        timeframe: 'Timeframe',
        interval: 'Interval',
        limit: 'Candles',
        newsLimit: 'Headlines',
        prompt: 'Synthesis instruction',
        account: 'Account balance',
        riskPercent: 'Risk per trade (%)',
        minRR: 'Minimum R:R (veto)',
        liveData: 'Real data',
        honest: 'A block without real data fails explicitly: nothing is simulated.',
      },
      mg: {
        title: 'Mpitantana workflow',
        subtitle: 'Amboary, amboarina ary ampiasao ny fifandraisan-dingana tena izy. Ny bloka tsirairay dia manao asa azo hamarinina.',
        templates: 'Modely',
        newWorkflow: 'Workflow vaovao',
        empty: 'Mamorona workflow avy amin’ny modely na ampio bloka voalohany.',
        name: 'Anaran’ny workflow',
        save: 'Tehirizo',
        saved: 'Voatahiry',
        run: 'Ampiasao',
        running: 'Eo am-panatanterahana…',
        resume: 'Hanohy',
        relaunch: 'Avereno',
        delete: 'Fafao',
        addBlock: 'Ampio bloka',
        moveUp: 'Ampidiniro ambony',
        moveDown: 'Ampidiniro ambany',
        remove: 'Esory',
        config: 'Fandrindrana',
        output: 'Vokatra tena izy',
        noOutput: 'Tsy mbola niasa ity bloka ity.',
        lastRun: 'Fanatanterahana farany',
        noRun: 'Tsy misy fanatanterahana ho an’ity workflow ity.',
        status: 'Toe-javatra',
        export: 'Adikao JSON',
        copied: 'Voatahiry JSON',
        blocked: 'Bloka tsy nahomby',
        resumeHint: 'Ny bloka nahomby dia ampiasaina indray: tsy misy antso mandoa averina.',
        fresh: 'Tsy mbola niasa',
        symbol: 'Fananana',
        timeframe: 'Fe-potoana',
        interval: 'Elanelana',
        limit: 'Labozia',
        newsLimit: 'Lohateny',
        prompt: 'Baiko famintinana',
        account: 'Renivola',
        riskPercent: 'Risika isaky ny varotra (%)',
        minRR: 'R:R farany ambany (veto)',
        liveData: 'Angona tena izy',
        honest: 'Ny bloka tsy manana angona tena izy dia tsy mahomby mazava: tsy misy simba.',
      },
    };
    return labels[currentLang] || labels.fr;
  }, [currentLang]);

  const [blueprints, setBlueprints] = useState<WorkflowBlueprint[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState<WorkflowBlueprint | null>(null);
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const { confirm: notifyConfirm, success: notifySuccess, error: notifyError, info: notifyInfo } = useNotifications();

  const load = useCallback(() => {
    const items = listBlueprints(session.userId);
    setBlueprints(items);
    setSelectedId((prev) => (prev && items.some((item) => item.id === prev) ? prev : items[0]?.id || ''));
  }, [session.userId]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('jyntra_workflow_builder_update', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('jyntra_workflow_builder_update', handler);
      window.removeEventListener('storage', handler);
    };
  }, [load]);

  useEffect(() => {
    const found = blueprints.find((item) => item.id === selectedId) || null;
    setDraft(found ? { ...found, blocks: found.blocks.map((block) => ({ ...block, config: { ...block.config } })) } : null);
    if (found) {
      const runs = listExecutions(session.userId).filter((item) => item.blueprintId === found.id);
      setExecution(runs[0] || null);
    } else {
      setExecution(null);
    }
    setError('');
  }, [blueprints, selectedId, session.userId]);

  const commit = (next: WorkflowBlueprint) => {
    const saved = saveBlueprint(next);
    setDraft(saved);
    setBlueprints(listBlueprints(session.userId));
    setNotice(L.saved);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const patchBlock = (blockId: string, patch: Partial<WorkflowBlock>) => {
    if (!draft) return;
    commit({
      ...draft,
      blocks: draft.blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch, config: { ...block.config, ...(patch.config || {}) } } : block,
      ),
    });
  };

  const addBlock = (kind: WorkflowBlockKind) => {
    if (!draft) return;
    const block = createBlock(kind, {
      symbol: draft.blocks[0]?.config.symbol || 'BTC/USDT',
      timeframe: draft.blocks[0]?.config.timeframe || '1H',
      interval: draft.blocks[0]?.config.interval || '1h',
    });
    commit({ ...draft, blocks: [...draft.blocks, block] });
    setExpanded(block.id);
    setShowAdd(false);
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    commit({ ...draft, blocks: reorderBlocks(draft.blocks, index, index + direction) });
  };

  const removeBlock = (blockId: string) => {
    if (!draft) return;
    commit({ ...draft, blocks: draft.blocks.filter((block) => block.id !== blockId) });
  };

  const createFromTemplate = (templateId: string) => {
    const blueprint = createBlueprintFromTemplate(session.userId, templateId);
    saveBlueprint(blueprint);
    setBlueprints(listBlueprints(session.userId));
    setSelectedId(blueprint.id);
  };

  const createBlank = () => {
    const blueprint = createEmptyBlueprint(session.userId);
    saveBlueprint(blueprint);
    setBlueprints(listBlueprints(session.userId));
    setSelectedId(blueprint.id);
  };

  const removeBlueprint = () => {
    if (!draft) return;
    notifyConfirm(
      'Supprimer ce workflow',
      `Supprimer « ${draft.name} » ? Cette action est irréversible.`,
      () => {
        deleteBlueprint(draft.id);
        setSelectedId('');
        setBlueprints(listBlueprints(session.userId));
        notifySuccess('Workflow supprimé', `${draft.name} a été supprimé.`);
      },
      () => notifyInfo('Annulé', 'La suppression a été annulée.')
    );
  };

  const run = async () => {
    if (!draft || running) return;
    setRunning(true);
    setError('');
    try {
      const result = await runBlueprint(draft, {
        onProgress: (progress) => setExecution({ ...progress, blocks: progress.blocks.map((b) => ({ ...b })) }),
      });
      setExecution(result);
      notifySuccess('Workflow exécuté', 'L’exécution du workflow est terminée avec succès.');
    } catch (err: any) {
      const msg = err?.message || 'L’exécution a échoué.';
      setError(msg);
      notifyError('Erreur d’exécution', msg);
    } finally {
      setRunning(false);
    }
  };

  const resume = async () => {
    if (!draft || !execution || running) return;
    setRunning(true);
    setError('');
    try {
      const result = await resumeExecution(draft, execution, (progress) =>
        setExecution({ ...progress, blocks: progress.blocks.map((b) => ({ ...b })) }),
      );
      setExecution(result);
      notifySuccess('Workflow repris', 'L’exécution du workflow a repris avec succès.');
    } catch (err: any) {
      const msg = err?.message || 'La reprise a échoué.';
      setError(msg);
      notifyError('Erreur de reprise', msg);
    } finally {
      setRunning(false);
    }
  };

  const clearRuns = () => {
    if (!execution) return;
    deleteExecution(execution.id);
    setExecution(null);
  };

  const copyJson = async () => {
    if (!execution) return;
    try {
      await navigator.clipboard.writeText(exportExecution(execution));
      setNotice(L.copied);
      window.setTimeout(() => setNotice(''), 1800);
    } catch {
      setError('Le presse-papiers n’est pas accessible dans ce navigateur.');
    }
  };

  const downloadJson = () => {
    if (!execution) return;
    try {
      const json = exportExecution(execution);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jyntra-workflow-${execution.name.replace(/\s+/g, '_')}-${execution.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Impossible de télécharger le fichier JSON.');
    }
  };

  const execBlock = (blockId: string) => execution?.blocks.find((item) => item.blockId === blockId);
  const successCount = execution?.blocks.filter((item) => item.status === 'success').length || 0;
  const canResume = Boolean(execution && draft && execution.blueprintId === draft.id && execution.status !== 'success' && nextPendingIndex(execution.blocks) >= 0);

  const blockFields = (block: WorkflowBlock) => {
    const cfg = block.config;
    const num = (value: any, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
    return (
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(block.kind === 'market' || block.kind === 'candles' || block.kind === 'agents' || block.kind === 'chart') && (
          <label className="space-y-1">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.symbol}</span>
            <input
              value={cfg.symbol || ''}
              onChange={(event) => patchBlock(block.id, { config: { symbol: event.target.value.toUpperCase().slice(0, 16) } })}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            />
          </label>
        )}
        {(block.kind === 'agents' || block.kind === 'chart') && (
          <label className="space-y-1">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.timeframe}</span>
            <select
              value={cfg.timeframe || '1H'}
              onChange={(event) => patchBlock(block.id, { config: { timeframe: event.target.value } })}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            >
              {['15M', '1H', '4H', '1D'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        {(block.kind === 'market' || block.kind === 'candles') && (
          <>
            <label className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.interval}</span>
              <select
                value={cfg.interval || '1h'}
                onChange={(event) => patchBlock(block.id, { config: { interval: event.target.value } })}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              >
                {['15m', '1h', '4h', '1d'].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.limit}</span>
              <input
                type="number"
                min={20}
                max={300}
                value={num(cfg.limit, 120)}
                onChange={(event) => patchBlock(block.id, { config: { limit: Number(event.target.value) || 120 } })}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
          </>
        )}
        {block.kind === 'news' && (
          <label className="space-y-1">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.newsLimit}</span>
            <input
              type="number"
              min={1}
              max={12}
              value={num(cfg.newsLimit, 5)}
              onChange={(event) => patchBlock(block.id, { config: { newsLimit: Number(event.target.value) || 5 } })}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            />
          </label>
        )}
        {block.kind === 'risk' && (
          <>
            <label className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.account}</span>
              <input
                type="number"
                min={1}
                value={num(cfg.accountBalance, 10000)}
                onChange={(event) => patchBlock(block.id, { config: { accountBalance: Number(event.target.value) || 10000 } })}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.riskPercent}</span>
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={num(cfg.riskPercent, 1)}
                onChange={(event) => patchBlock(block.id, { config: { riskPercent: Number(event.target.value) || 1 } })}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.minRR}</span>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={num(cfg.minRiskReward, 1.5)}
                onChange={(event) => patchBlock(block.id, { config: { minRiskReward: Number(event.target.value) || 1.5 } })}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              />
            </label>
          </>
        )}
        {block.kind === 'ai' && (
          <label className="space-y-1 sm:col-span-2">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.prompt}</span>
            <textarea
              rows={2}
              value={cfg.prompt || ''}
              onChange={(event) => patchBlock(block.id, { config: { prompt: event.target.value.slice(0, 900) } })}
              className="w-full resize-y rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              <Workflow className="h-3.5 w-3.5" /> {L.liveData}
            </div>
            <h2 className="mt-1 text-lg font-black text-white">{L.title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{L.subtitle}</p>
            <p className="mt-1 text-[11px] text-slate-500">{L.honest}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="max-w-[220px] rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-2 text-xs text-slate-200 focus:border-cyan-500/60 focus:outline-none"
              aria-label={L.title}
            >
              <option value="">—</option>
              {blueprints.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button onClick={createBlank} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-500/40">
              <Plus className="h-3.5 w-3.5" /> {L.newWorkflow}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/70 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.templates}:</span>
          {WORKFLOW_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => createFromTemplate(template.id)}
              title={template.description}
              className="rounded-full border border-slate-700/70 bg-slate-950/50 px-3 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-500"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {!draft ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <Workflow className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-xs text-slate-400">{L.empty}</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  value={draft.name}
                  onChange={(event) => commit({ ...draft, name: event.target.value.slice(0, 80) })}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-lg font-black text-white hover:border-slate-700/70 focus:border-cyan-500/60 focus:outline-none"
                  aria-label={L.name}
                />
                {notice && <span className="shrink-0 font-mono text-[10px] text-emerald-500">{notice}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={run}
                  disabled={running || draft.blocks.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60"
                >
                  {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  {running ? L.running : L.run}
                </button>
                {canResume && (
                  <button onClick={resume} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-300 disabled:opacity-60" title={L.resumeHint}>
                    <RotateCcw className="h-3.5 w-3.5" /> {L.resume}
                  </button>
                )}
                <button onClick={() => commit(draft)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-200">
                  <Save className="h-3.5 w-3.5" /> {L.save}
                </button>
                <button onClick={removeBlueprint} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500 dark:text-rose-300">
                  <Trash2 className="h-3.5 w-3.5" /> {L.delete}
                </button>
              </div>
            </div>

            <div
              className="workflow-canvas relative mt-4 min-h-[360px] touch-none select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[size:22px_22px]"
              onWheel={(event) => {
                event.preventDefault();
                const delta = event.deltaY > 0 ? -0.08 : 0.08;
                setZoom((value) => Math.min(1.8, Math.max(0.6, Number((value + delta).toFixed(2)))));
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                const target = event.target as HTMLElement;
                if (!target.classList.contains('workflow-canvas-bg')) return;
                setIsPanning(true);
                panStartRef.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
                (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!isPanning) return;
                setPan({
                  x: panStartRef.current.px + (event.clientX - panStartRef.current.x),
                  y: panStartRef.current.py + (event.clientY - panStartRef.current.y),
                });
              }}
              onPointerUp={() => setIsPanning(false)}
              onPointerLeave={() => setIsPanning(false)}
            >
              <div className="workflow-canvas-bg absolute inset-0 cursor-grab active:cursor-grabbing" />
              <div
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center top' }}
                className="relative z-10 mx-auto w-full max-w-3xl space-y-3 px-4 py-6 transition-transform duration-75"
              >
              {draft.blocks.map((block, index) => {
                const Icon = BLOCK_ICONS[block.kind] || Activity;
                const runState = execBlock(block.id);
                const status = runState?.status || 'idle';
                const isOpen = expanded === block.id;
                return (
                  <div key={block.id} className="relative pl-8">
                    <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-950 font-mono text-[10px] font-bold text-slate-400">
                      {index + 1}
                    </span>
                    {index < draft.blocks.length - 1 && (
                      <svg aria-hidden="true" viewBox="0 0 24 28" className="absolute bottom-[-16px] left-0 top-7 h-7 w-6 overflow-visible" preserveAspectRatio="none">
                        <path d="M12 0 C 12 8, 18 10, 18 14 C 18 18, 6 20, 6 28" fill="none" stroke="#334155" strokeWidth="1.1" />
                        <path
                          d="M12 0 C 12 8, 18 10, 18 14 C 18 18, 6 20, 6 28"
                          fill="none"
                          stroke={runState?.status === 'running' || runState?.status === 'success' ? '#22d3ee' : '#475569'}
                          strokeWidth={runState?.status === 'running' ? 1.8 : 1.1}
                          strokeLinecap="round"
                          className={runState?.status === 'running' ? 'lynara-flow' : ''}
                        />
                      </svg>
                    )}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button onClick={() => setExpanded(isOpen ? null : block.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <span className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-1.5 text-cyan-500">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-white">{block.title}</span>
                            <span className="block truncate font-mono text-[10px] text-slate-500">{BLOCK_LIBRARY[block.kind].hint}</span>
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${STATUS_STYLE[status] || STATUS_STYLE.idle}`}>
                            {status === 'running' ? <Loader2 className="mr-1 inline h-2.5 w-2.5 animate-spin" /> : null}
                            {status}
                          </span>
                          <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={L.moveUp} className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-30">
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => move(index, 1)} disabled={index === draft.blocks.length - 1} aria-label={L.moveDown} className="rounded p-1 text-slate-500 hover:text-white disabled:opacity-30">
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeBlock(block.id)} aria-label={L.remove} className="rounded p-1 text-slate-500 hover:text-rose-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setExpanded(isOpen ? null : block.id)} aria-label={L.config} className="rounded p-1 text-slate-500 hover:text-white">
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-slate-800/70 pt-3">
                          {blockFields(block)}
                          <div className="mt-3 space-y-2">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{L.output}</p>
                            {runState?.summary ? (
                              <p className="mt-1 break-words rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-300">
                                {runState.summary}
                              </p>
                            ) : runState?.error ? (
                              <p className="mt-1 break-words rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 font-mono text-[10px] text-rose-500 dark:text-rose-300">
                                {runState.error}
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] italic text-slate-500">{L.noOutput}</p>
                            )}
                            {runState?.output !== undefined && (
                              <div className="mt-1.5 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                                <div className="px-2.5 py-1.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">{t.extra.outgoingJson}</span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <pre className="p-2.5 max-h-48 overflow-auto font-mono text-[9px] text-cyan-400">
                                  {JSON.stringify(runState.output, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-xl border border-slate-700/70 bg-slate-950/80 p-1.5">
                <button type="button" onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Zoom avant">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Zoom arrière">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Réinitialiser la vue">
                  <Maximize2 className="h-4 w-4" />
                </button>
                <span className="px-1 font-mono text-[10px] text-slate-400">{Math.round(zoom * 100)}%</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setShowAdd((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-600 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:border-cyan-500/50 hover:text-cyan-500">
                <Plus className="h-3.5 w-3.5" /> {L.addBlock}
              </button>
              {showAdd &&
                (Object.keys(BLOCK_LIBRARY) as WorkflowBlockKind[]).map((kind) => {
                  const Icon = BLOCK_ICONS[kind];
                  return (
                    <button key={kind} onClick={() => addBlock(kind)} title={BLOCK_LIBRARY[kind].hint} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-950/50 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-cyan-500/40">
                      <Icon className="h-3 w-3" /> {BLOCK_LIBRARY[kind].title}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">{L.lastRun}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {execution && (
                  <>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${STATUS_STYLE[execution.status === 'success' ? 'success' : execution.status === 'error' ? 'error' : 'running']}`}>
                      {execution.status} · {successCount}/{execution.blocks.length}
                    </span>
                    <button onClick={copyJson} className="inline-flex items-center gap-1 rounded-lg border border-slate-700/70 px-2 py-1 font-mono text-[10px] text-slate-400 hover:text-cyan-500">
                      <FileJson className="h-3 w-3" /> {L.export}
                    </button>
                    <button onClick={downloadJson} className="inline-flex items-center gap-1 rounded-lg border border-slate-700/70 bg-slate-800/60 px-2 py-1 font-mono text-[10px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-500">
                      <Download className="h-3 w-3" /> {t.extra.downloadJson}
                    </button>
                    <button onClick={clearRuns} className="rounded-lg border border-slate-700/70 px-2 py-1 font-mono text-[10px] text-slate-400 hover:text-rose-400">
                      {L.delete}
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-500 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            {!execution ? (
              <p className="mt-3 text-xs text-slate-500">{L.noRun}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {execution.error && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/5 p-2.5 text-[11px] text-rose-500 dark:text-rose-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{execution.error}</span>
                  </div>
                )}
                <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {execution.blocks.map((block, index) => (
                    <li key={`${execution.id}-${block.blockId}`} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-bold text-slate-200">{index + 1}. {block.title}</span>
                        <span className={`shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] ${STATUS_STYLE[block.status] || STATUS_STYLE.idle}`}>
                          {block.status}
                        </span>
                      </div>
                      <p className="mt-1 break-words font-mono text-[10px] text-slate-500">{block.summary || block.error || '—'}</p>
                      {block.endedAt && block.startedAt && (
                        <p className="mt-1 inline-flex items-center gap-1 font-mono text-[9px] text-slate-600">
                          <Clock className="h-2.5 w-2.5" /> {Math.max(0, Math.round((block.endedAt - block.startedAt) / 100) / 10)}s
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
                {execution.status !== 'success' && canResume && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2.5">
                    <p className="text-[11px] text-cyan-700 dark:text-cyan-300">{L.resumeHint}</p>
                    <button onClick={resume} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-300 disabled:opacity-60">
                      <RotateCcw className="h-3 w-3" /> {L.resume}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default WorkflowBuilder;
