import React from 'react';
import {
  AudioLines,
  BrainCircuit,
  Check,
  CircleDashed,
  Cpu,
  Globe2,
  Languages,
  MessageSquareText,
  MinusCircle,
  Radar,
  Send,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

export type WorkflowStatus = 'pending' | 'active' | 'done' | 'skipped' | 'error';

export interface WorkflowStep {
  id: string;
  label: string;
  detail?: string;
  status: WorkflowStatus;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  input: MessageSquareText,
  language: Languages,
  transcription: AudioLines,
  vision: Radar,
  segmentation: Radar,
  routing: Cpu,
  reasoning: BrainCircuit,
  search: Globe2,
  response: Sparkles,
  delivery: Send,
};

function Connector({ active, index }: { active: boolean; index: number }) {
  const flip = index % 2 === 0;
  const d = flip ? 'M34 0 C 34 12, 52 15, 52 30' : 'M34 0 C 34 12, 16 15, 16 30';
  return (
    <svg viewBox="0 0 68 30" className="h-7 w-[68px] shrink-0" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`flow-${index}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? '#22d3ee' : '#334155'} stopOpacity={active ? 0.95 : 0.7} />
          <stop offset="100%" stopColor={active ? '#a78bfa' : '#1e293b'} stopOpacity={active ? 0.8 : 0.5} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="#1e293b" strokeWidth="1.2" />
      <path
        d={d}
        fill="none"
        stroke={`url(#flow-${index})`}
        strokeWidth={active ? 1.9 : 1.2}
        strokeLinecap="round"
        className={active ? 'lynara-flow' : ''}
      />
    </svg>
  );
}

const DOT: Record<WorkflowStatus, string> = {
  done: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]',
  active: 'bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse',
  pending: 'bg-slate-600',
  skipped: 'bg-slate-700',
  error: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)]',
};

export const LynaraWorkflow: React.FC<{
  steps: WorkflowStep[];
  running: boolean;
  onSuggestion?: (text: string) => void;
  suggestions?: Array<{ label: string; text: string }>;
}> = ({ steps, running, onSuggestion, suggestions = [] }) => {
  return (
    <div className="lynara-panel keep-white relative flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#070A10]/95 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${running ? 'animate-ping bg-cyan-300' : 'bg-emerald-400'}`} />
          <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
            Workflow LYNARA
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {running ? 'exécution réelle' : 'prêt'}
        </span>
      </div>

      <div className="lynara-grid flex-1 overflow-y-auto px-4 py-5">
        <ol className="space-y-0">
          {steps.map((step, index) => {
            const Icon = ICONS[step.id] || CircleDashed;
            const isLast = index === steps.length - 1;
            return (
              <li key={step.id} className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex w-[68px] shrink-0 flex-col items-center">
                    <div
                      className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur transition-all duration-500 ${
                        step.status === 'done'
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                          : step.status === 'active'
                            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.22)]'
                            : step.status === 'error'
                              ? 'border-rose-400/50 bg-rose-400/10 text-rose-300'
                              : step.status === 'skipped'
                                ? 'border-slate-800 bg-slate-900/50 text-slate-600'
                                : 'border-slate-700 bg-slate-900/70 text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {step.status === 'done' && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                    {step.status === 'error' && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 text-slate-950">
                        <TriangleAlert className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                    {step.status === 'skipped' && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                        <MinusCircle className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  </div>

                  <div className={`min-w-0 flex-1 pb-1 pt-1 ${step.status === 'skipped' ? 'opacity-55' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-[13px] font-bold ${step.status === 'active' ? 'text-cyan-100' : step.status === 'error' ? 'text-rose-200' : 'text-slate-200'}`}>
                        {step.label}
                      </span>
                      <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${DOT[step.status]}`} />
                    </div>
                    {step.detail && (
                      <p className={`mt-0.5 text-[11px] leading-relaxed ${step.status === 'error' ? 'text-rose-300/90' : 'text-slate-500'}`}>
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex w-[68px] justify-center">
                    <Connector active={step.status === 'done' || step.status === 'active'} index={index} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {suggestions.length > 0 && (
          <div className="mt-5 border-t border-slate-800/70 pt-4">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
              Nœuds de départ suggérés
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => onSuggestion?.(s.text)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-left text-[11px] text-slate-300 transition-all hover:border-cyan-500/40 hover:bg-slate-900 hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        <span>Chaque étape correspond à une opération réellement exécutée</span>
        <span className="text-cyan-500/80">JYNTRA</span>
      </div>
    </div>
  );
};
