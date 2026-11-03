import React, { useState } from 'react';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { MetaIcon } from '../ui/MetaIcon';
import { StructuredAIResponse } from './StructuredAIResponse';

interface MetaIntelligencePanelProps {
  title: string;
  subtitle?: string;
  buttonLabel: string;
  buildPrompt: () => string;
  systemPrompt?: string;
  disabled?: boolean;
  disabledReason?: string;
  accent?: 'emerald' | 'purple' | 'cyan' | 'orange' | 'rose';
}

const accentClasses: Record<string, string> = {
  emerald: 'from-emerald-500/10 to-slate-900/60 border-emerald-500/30 text-emerald-300',
  purple: 'from-purple-500/10 to-slate-900/60 border-purple-500/30 text-purple-300',
  cyan: 'from-cyan-500/10 to-slate-900/60 border-cyan-500/30 text-cyan-300',
  orange: 'from-orange-500/10 to-slate-900/60 border-orange-500/30 text-orange-300',
  rose: 'from-rose-500/10 to-slate-900/60 border-rose-500/30 text-rose-300',
};

// Additional light surface for day mode (applied via html.light in index.css)
const lightSurface = 'bg-slate-50 border-slate-200 text-slate-900';

export const MetaIntelligencePanel: React.FC<MetaIntelligencePanelProps> = ({
  title,
  subtitle,
  buttonLabel,
  buildPrompt,
  systemPrompt,
  disabled,
  disabledReason,
  accent = 'cyan',
}) => {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/ai/engine-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(),
          systemPrompt: systemPrompt || 'Tu es un analyste financier d\'élite de JYNTRA AI. Tu raisonnes uniquement à partir des données fournies. Tu ne dois jamais inventer de données, de prix, de statistiques ou de résultats. Si les données sont insuffisantes, indique "INSUFFICIENT EVIDENCE".',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Analyse indisponible.');
      } else {
        setResult(typeof data.text === 'string' ? data.text : JSON.stringify(data.text));
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur de connexion au serveur.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-all duration-300 ${accentClasses[accent]}`}>
      {/* En-tête : badge + titre + statut */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
            <MetaIcon className="w-3.5 h-3.5" />
            <span className={`font-bold ${accentClasses[accent].split(' ').pop()}`}>{title}</span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {result && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100/50"
            aria-label="toggle"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* État désactivé */}
      {disabled && disabledReason && (
        <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100/50 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>{disabledReason}</span>
        </div>
      )}

      {/* Bouton d'action */}
      <button
        onClick={run}
        disabled={running || disabled}
        className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white hover:border-orange-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
      >
        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MetaIcon className="w-3.5 h-3.5" />}
        <span>{running ? 'Analyse en cours…' : buttonLabel}</span>
      </button>

      {/* Erreur */}
      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Résultat IA : carte structurée */}
      {result && expanded && (
        <div className="rounded-2xl border p-4 shadow-sm transition-all duration-300">
          <StructuredAIResponse content={result} title={title} accent={accent} />
        </div>
      )}
    </div>
  );
};
