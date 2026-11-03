import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, Target, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StructuredAIResponse — Affiche une réponse IA de manière structurée, lisible et hiérarchisée.
 *
 * - Nettoie les artefacts Markdown brus (***, ///, #*, ____, etc.)
 * - Détecte les sections par titres en majuscules (OBSERVATION, INTERPRETATION, etc.)
 * - Affiche chaque section dans une carte dédiée avec icône et couleur selon le type
 * - Conserve le Dark Mode et le Light Mode cohérents avec JYNTRA AI
 *
 * Ne modifie jamais le contenu brut : seule la présentation change.
 */
interface StructuredAIResponseProps {
  content: string | null;
  title?: string;
  accent?: 'cyan' | 'emerald' | 'orange' | 'purple' | 'rose';
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  OBSERVATION: Info,
  INTERPRETATION: Target,
  CONFIRMATIONS: CheckCircle2,
  INVALIDATION: AlertTriangle,
  RISK: ShieldCheck,
  RECOMMENDATION: TrendingUp,
  UNCERTAINTY: TrendingDown,
  CONCLUSION: Target,
};

const sectionColors: Record<string, string> = {
  OBSERVATION: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  INTERPRETATION: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  CONFIRMATIONS: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  INVALIDATION: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
  RISK: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  RECOMMENDATION: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  UNCERTAINTY: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  CONCLUSION: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
};

const accentBg: Record<string, string> = {
  cyan: 'from-cyan-500/10 to-slate-900/60 border-cyan-500/30',
  emerald: 'from-emerald-500/10 to-slate-900/60 border-emerald-500/30',
  orange: 'from-orange-500/10 to-slate-900/60 border-orange-500/30',
  purple: 'from-purple-500/10 to-slate-900/60 border-purple-500/30',
  rose: 'from-rose-500/10 to-slate-900/60 border-rose-500/30',
};

/**
 * Nettoie les artefacts Markdown brus sans altérer le sens.
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\*/g, '')      // ***
    .replace(/\/\/\/+/g, '')     // ///
    .replace(/#\*/g, '')         // #*
    .replace(/_{2,}/g, '')       // ____
    .replace(/\*{2,}/g, '')      // **
    .replace(/_{1}/g, '')        // _
    .replace(/#{1,3}\s/g, '')    // # ## ### headings
    .replace(/^\s*[\-•]\s*/gm, '') // bullet points
    .replace(/\n{3,}/g, '\n\n')  // multiple blank lines
    .trim();
}

/**
 * Détecte si une ligne est un titre de section (majuscules, 3+ caractères).
 */
function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 40) return false;
  const upperRatio = trimmed.split('').filter((c) => c >= 'A' && c <= 'Z').length / trimmed.replace(/\s/g, '').length;
  return upperRatio > 0.7 && /[A-Z]/.test(trimmed);
}

/**
 * Segmente le texte en sections par titres détectés.
 */
function segmentSections(text: string): Array<{ title: string; body: string }> {
  const lines = cleanMarkdown(text).split('\n');
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of lines) {
    if (isSectionHeader(line) && !current?.body?.includes(line)) {
      if (current) sections.push(current);
      current = { title: trimmedCase(line), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      // Orphan line before any section: creates implicit section
      if (!current) {
        current = { title: 'OBSERVATION', body: [] };
      }
      current.body.push(line);
    }
  }
  if (current) sections.push(current);

  return sections.map((s) => ({ title: s.title, body: s.body.filter((l) => l.trim()).join(' ').trim() })).filter((s) => s.body);
}

function trimmedCase(t: string): string {
  return t.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const StructuredAIResponse: React.FC<StructuredAIResponseProps> = ({
  content,
  title = 'Analyse IA — JYNTRA',
  accent = 'cyan',
}) => {
  if (!content || content.trim().length === 0) return null;

  const sections = segmentSections(content);
  const hasMultipleSections = sections.length > 1;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${accentBg[accent]} p-5 space-y-4 shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
          <Target className="w-3.5 h-3.5" />
          {title}
        </div>
      </div>

      {hasMultipleSections ? (
        <div className="space-y-3">
          {sections.map((section, i) => {
            const Icon = sectionIcons[section.title] || Info;
            const colorClass = sectionColors[section.title] || 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5';
            return (
              <div key={i} className={`rounded-xl border p-3 ${colorClass}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {section.body}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border p-3 text-cyan-500/20 bg-cyan-500/5">
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{sections[0]?.body || content}</p>
        </div>
      )}
    </div>
  );
};
